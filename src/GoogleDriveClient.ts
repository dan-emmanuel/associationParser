import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Logger } from "./logger";

export class GoogleDriveManager {
  private logger = new Logger("GoogleDriveManager");
  private drive: any;
  private sheets: any;
  private auth: JWT;
  private folderMetadata = {
    mimeType: 'application/vnd.google-apps.folder',
    parents: ['1R8VpNVtd4Gxz_uoijKih9rksQcu2CDSP']
  };

  constructor() {
    const serviceAccountPathFile = path.join(__dirname, "..", 'clientSecretGdrive.json');
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
    const folder = await this.drive.files.create({
      resource: { ...this.folderMetadata, name },
      fields: 'id'
    });
    return folder.data.id!;
  }

  private async readCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      let isFirstRow = true;
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          if (isFirstRow) {
            rows.push(Object.keys(row));  // Add the headers
            isFirstRow = false;
          }
          rows.push(Object.values(row));  // Add the row values
        })
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  private async rearrangeAndDeleteSheets(sheetId: string, sheetTitles: string[]): Promise<void> {
    const sheetDetails = await this.sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheets = sheetDetails.data.sheets || [];
    const requests = [];

    const subventionsSheetIndex = sheetTitles.indexOf('subventions');
    if (subventionsSheetIndex !== -1) {
      const subventionsSheetId = sheets[subventionsSheetIndex].properties.sheetId;
      requests.push({
        updateSheetProperties: {
          properties: { sheetId: subventionsSheetId, index: 0 },
          fields: 'index'
        }
      });
    }

    const sheet1Index = sheetTitles.indexOf('Sheet1');
    if (sheet1Index !== -1) {
      const sheet1Id = sheets[sheet1Index].properties.sheetId;
      requests.push({
        deleteSheet: {
          sheetId: sheet1Id
        }
      });
    }

    if (requests.length > 0) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: { requests }
      });
    }
  }

  public async uploadFolderAndCreateSheet(localFolderPath: string): Promise<{
    urlFolder: string,
    urlSheet: string
  }> {
    const dateString = new Date().toLocaleString().replace(/[:\s]/g, '-');
    const newFolderId = await this.createFolder(dateString);

    const sheet = await this.sheets.spreadsheets.create({
      resource: { properties: { title: `CSVs from ${dateString}` } },
      fields: 'spreadsheetId'
    });
    const sheetId = sheet.data.spreadsheetId!;

    await this.drive.files.update({
      fileId: sheetId,
      addParents: newFolderId,
      fields: 'id, parents'
    });

    const files = fs.readdirSync(localFolderPath);
    const addSheetRequests: any = [];
    const dataUpdates: any = [];

    const uploadPromises = files.map(async (file) => {
      const filePath = path.join(localFolderPath, file);
      if (path.extname(file) === '.csv') {
        const data = await this.readCSV(filePath);
        const sheetName = path.basename(file, '.csv').split("-").pop();
        addSheetRequests.push({
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        });
        dataUpdates.push({
          range: `${sheetName}!A1`,
          values: data
        });
      }
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

    });

    await Promise.all(uploadPromises);
    if (addSheetRequests.length > 0) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: { requests: addSheetRequests }
      });
    }

    if (dataUpdates.length > 0) {
      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          valueInputOption: "RAW",
          data: dataUpdates
        }
      });
    }

    const sheetDetails = await this.sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTitles = sheetDetails.data.sheets?.map((sheet: any) => sheet.properties?.title) || [];
    await this.rearrangeAndDeleteSheets(sheetId, sheetTitles);

    return {
      urlFolder: `https://drive.google.com/drive/folders/${newFolderId}`,
      urlSheet: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    };
  }
}
