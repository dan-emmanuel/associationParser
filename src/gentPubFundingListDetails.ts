import axios from "axios";
import UserSingleton from "./user";
import path from "path";
import archiver from 'archiver';
import  { Request, Response } from "express";
import fs from "fs";
import { SubventionTable } from "./pubFunding.type";
import { createObjectCsvWriter } from "csv-writer";
import { gentPubFundingList } from "./gentPubFundingList";
import { PubfundingMetadata } from "./PubfundingMetadata";
import { agregateParser } from "./jsonPrser";

export const gentPubFundingListDetails = async (req: Request, res:Response): Promise<{
  // csvPath: string,
  jsonPath: string,
  zipPath: string,
}> => {
  
  try{
    const {jsonPath} = await gentPubFundingList()
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const codes =  jsonData.map((item:SubventionTable) => item.code)
    const subventionsMetdatas = Promise.all(codes.map(async (code:string) => {
      const dataResponse = await axios.get(`https://lecompteasso.associations.gouv.fr/gw/rds-server/subventions/${code}?populate=instructeurs.service.dispositifs.sous_dispositifs%20instructeurs.service.bo%20dispositif.sous_dispositifs`, {
        headers: {
          'X-Access-Token': UserSingleton.getInstance().token,
        },
      });
      return dataResponse.data
    }))
    // Collect all subventions metadata
    const allSubventionsMetadata:PubfundingMetadata[] = await subventionsMetdatas;
    // Create a directory to store the aggregated data
    const aggregatedDataDirectory = path.join(__dirname, 'outputs/aggregatedData');
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

    agregateParser(aggregatedJsonFilePath)

    if(res){
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=data.zip');
      // Pipe the zip archive to the response
      fs.createReadStream(aggregatedZipFilePath).pipe(res);
      }
    return result;
  }catch(error){
      console.error(error);
      if(res)res.status(500).json({ message: 'Internal server error' });
      throw new Error('Internal server error');
  
  }
  

  

};