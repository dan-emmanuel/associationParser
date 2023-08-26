import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Logger } from "./logger";  // Assuming Logger is in the same directory

export class GoogleDriveManager {
  private logger = new Logger("GoogleDriveManager");
  private drive: any;
  private sheets: any;
  private auth: JWT;
  private folderMetadata = {
    mimeType: 'application/vnd.google-apps.folder',
    parents: ['1R8VpNVtd4Gxz_uoijKih9rksQcu2CDSP']  // <-- adding this line
  };

  constructor() {
    const serviceAccountPathFile = path.join(__dirname, 'clientSecretGdrive.json');
    const { client_email, private_key } = JSON.parse(fs.readFileSync(serviceAccountPathFile, 'utf-8'));
    this.auth = new google.auth.JWT(
      client_email,
      undefined,
      private_key,
      ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
    );

    this.drive = google.drive({ version: 'v3', auth: this.auth });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });

    this.logger.info('GoogleDriveManager initialized');
  }

  private async createFolder(name: string): Promise<string> {
    this.logger.info(`Creating folder: ${name}`);

    const folder = await this.drive.files.create({
      resource: { ...this.folderMetadata, name },
      fields: 'id'
    });
    this.logger.info(`Folder created with ID: ${folder.data.id}`);
    return folder.data.id!;
  }

  private async readCSV(filePath: string): Promise<any[]> {
    this.logger.info(`Reading CSV from: ${filePath}`);
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => rows.push(Object.values(row)))
        .on('end', () => {
          this.logger.info(`Finished reading CSV: ${filePath}`);
          resolve(rows);
        })
        .on('error', (error) => {
          this.logger.error(`Error reading CSV: ${filePath}`);
          reject(error);
        });
    });
  }

  private async rearrangeAndDeleteSheets(sheetId: string, sheetTitles: string[]): Promise<void> {
    try {
      this.logger.info(`Rearranging and deleting sheets for sheetId: ${sheetId}`);
      const sheetDetails = await this.sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const sheets = sheetDetails.data.sheets || [];
      this.logger.info(`sheets: ${JSON.stringify(sheets)}`);
      const subventionsSheetIndex = sheetTitles.indexOf('subventions');
      if (subventionsSheetIndex !== -1) {
        const subventionsSheetId = sheets[subventionsSheetIndex].properties.sheetId;
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          resource: {
            requests: [
              {
                updateSheetProperties: {
                  properties: { sheetId: subventionsSheetId, index: 0 },
                  fields: 'index'
                }
              }
            ]
          }
        });
      }
      this.logger.info(`subventionsSheetIndex: ${subventionsSheetIndex}`);
      const sheet1Index = sheetTitles.indexOf('Sheet1');
      if (sheet1Index !== -1) {
        const sheet1Id = sheets[sheet1Index].properties.sheetId;
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          resource: {
            requests: [
              {
                deleteSheet: {
                  sheetId: sheet1Id
                }
              }
            ]
          }
        });
      }
      this.logger.info(`sheet1Index: ${sheet1Index}`);
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      throw new Error("Failed to rearrange and delete sheets");
    }
  }

  public async uploadFolderAndCreateSheet(localFolderPath: string): Promise<{
    folderId: string,
    sheetId: string,
    urlFolder: string,
    urlSheet: string
  }> {
    try {
      const dateString = new Date().toLocaleString().replace(/[:\s]/g, '-');
      const newFolderId = await this.createFolder(dateString);

      const sheet = await this.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: `CSVs from ${dateString}`
          }
        },
        fields: 'spreadsheetId'
      });
      const sheetId = sheet.data.spreadsheetId!;

      await this.drive.files.update({
        fileId: sheetId,
        addParents: newFolderId,
        fields: 'id, parents'
      });

      const files = fs.readdirSync(localFolderPath);
      const uploadPromises = files.map(async (file) => {
        const filePath = path.join(localFolderPath, file);
        if (path.extname(file) === '.csv') {
          const data = await this.readCSV(filePath);
          const sheetName = path.basename(file, '.csv').split("-").pop();

          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            resource: {
              requests: [{
                addSheet: {
                  properties: {
                    title: sheetName
                  }
                }
              }]
            }
          });

          await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: sheetId,
            resource: {
              valueInputOption: "RAW",
              data: [{
                range: `${sheetName}!A1`,
                values: data
              }]
            }
          });
        } else {
          const media = fs.createReadStream(filePath);
          await this.drive.files.create({
            requestBody: {
              name: file,
              parents: [newFolderId]
            },
            media: {
              mimeType: 'application/octet-stream',
              body: media
            }
          });
        }
      });

      await Promise.all(uploadPromises);

      const sheetDetails = await this.sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const sheetTitles = sheetDetails.data.sheets?.map((sheet: any) => sheet.properties?.title) || [];

      await this.rearrangeAndDeleteSheets(sheetId, sheetTitles);

      return {
        folderId: newFolderId,
        sheetId: sheetId,
        urlFolder: `https://drive.google.com/drive/folders/${newFolderId}`,
        urlSheet: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
      };
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      throw new Error("Failed to upload folder and create sheet");
    }
  }

}
