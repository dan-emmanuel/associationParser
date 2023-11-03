
import axios from "axios";
import UserSingleton from "./user";
import path from "path";
import archiver from 'archiver';
import { Request, Response, response } from "express";
import fs from "fs";
import { SubventionTable } from "./pubFunding.type";
import { gentPubFundingList } from "./gentPubFundingList";
import { PubfundingMetadata } from "./PubfundingMetadata";
import { Logger } from "../logger";
import { outputDirPath } from "./outputDirPath";

const logger = new Logger("gentPubFundingListDetails");


export const gentPubFundingListDetails = async (req?: Request, res?: Response): Promise<{
  // csvPath: string,
  jsonPath: string,
  zipPath: string,
}> => {

  try {
    const { jsonPath } = await gentPubFundingList()
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const codes = jsonData.map((item: SubventionTable) => item.code)
    logger.info(` number of subvs : ${codes.length}`)
    const errorCodes: any[] = []
    let counter = 0
    const subventionsMetdatas = Promise.all(codes.map(async (code: string) => {
      try {

        const dataResponse = await axios.get(`https://lecompteasso.associations.gouv.fr/gw/rds-server/subventions/${code}?populate=instructeurs.service.dispositifs.sous_dispositifs%20instructeurs.service.bo%20dispositif.sous_dispositifs`, {
          headers: {
            'X-Access-Token': UserSingleton.getInstance().token,
          },
        });

        return dataResponse.data
      } catch (error: any) {
        errorCodes.push(error.config.url)
        return null
      }

    }))



    const allSubventionsMetadata: (PubfundingMetadata | null)[] = (await subventionsMetdatas).filter(sub => sub !== null);

    while (errorCodes.length > 0) {
      const errorCodesChunk = errorCodes.splice(0, 100);
      const subventionsMetdatasChunk = Promise.all(errorCodesChunk.map(async (code: string) => {
        try {

          const dataResponse = await axios.get(code, {
            headers: {
              'X-Access-Token': UserSingleton.getInstance().token,
            },
          });

          return dataResponse.data
        } catch (error: any) {
          errorCodes.push(error.config.url)
          return null
        }

      }))
      const subventionsMetdatasChunkFiltered = (await subventionsMetdatasChunk).filter(sub => sub !== null);
      allSubventionsMetadata.push(...subventionsMetdatasChunkFiltered);
    }
    // Create a directory to store the aggregated data
    const errorPath = path.join(outputDirPath, "errors");
    // if folder does not exists create it
    if (!fs.existsSync(errorPath)) {
      fs.mkdirSync(errorPath);
    }
    const pathFileError = path.join(errorPath, `errorsCodes.json`);



    fs.writeFileSync(pathFileError, JSON.stringify(errorCodes, null, 2));
    const aggregatedDataDirectory = path.join(outputDirPath, "aggregatedData");
    fs.mkdirSync(aggregatedDataDirectory, { recursive: true });
    // Create a timestamp string (dd-mm-yyyy)
    const date = new Date();
    const timeStamp = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
    // Create the JSON file for aggregated data
    const aggregatedJsonFilePath = path.join(aggregatedDataDirectory, `${timeStamp}-aggregatedData.json`);
    fs.writeFileSync(aggregatedJsonFilePath, JSON.stringify(allSubventionsMetadata, null, 2));
    // Create a zip archive for aggregated data
    const aggregatedZipFilePath = path.join(aggregatedDataDirectory, `${timeStamp}-aggregatedData.zip`);
    const aggregatedZipStream = fs.createWriteStream(aggregatedZipFilePath);
    const aggregatedArchive = archiver('zip', { zlib: { level: 9 } });
    aggregatedArchive.pipe(aggregatedZipStream);
    // Append JSON file to the archive
    aggregatedArchive.append(JSON.stringify(allSubventionsMetadata), { name: `${timeStamp}-aggregatedData.json` });
    // Finalize the archive
    aggregatedArchive.finalize();
    // Return the file paths
    const result = {
      jsonPath: aggregatedJsonFilePath,
      zipPath: aggregatedZipFilePath,
    };
    if (res) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=data.zip');
      // Pipe the zip archive to the response
      fs.createReadStream(aggregatedZipFilePath).pipe(res);
    }
    return result;
  } catch (error) {
    logger.error(error);
    if (res) res.status(500).json({ message: 'Internal server error' });
    throw new Error('Internal server error');

  }




};