import axios from "axios";
import UserSingleton from "./user";
import path from "path";
import archiver from 'archiver';
import { Request, Response } from "express";
import fs from "fs";
import { SubventionTable } from "./pubFunding.type";
import { createObjectCsvWriter } from "csv-writer";
import { outputDirPath } from "./outputDirPath";
import { Logger } from "../logger";  // Assuming Logger is in the same directory

const logger = new Logger("gentPubFundingList");


export const gentPubFundingList = async (res: Response | undefined = undefined): Promise<{
  csvPath: string,
  jsonPath: string,
  zipPath: string,
}> => {
  try {
    // Continue with the scraping and data processing
    const dataResponse = await axios.get('https://lecompteasso.associations.gouv.fr/gw/rds-server/subventions?fields=code%20libelle%20type_projet%20campagne_exercice%20instructeurs%20dispositif&dispositif=&typeFinanceur=&niveauTerritorial=&zoneTerritoriale=&populate=instructeurs.service.bo%20instructeurs.service.dispositifs.sous_dispositifs%20dispositif.sous_dispositifs', {
      headers: {
        'X-Access-Token': UserSingleton.getInstance().token,
      },
    });
    const tableData: SubventionTable[] = dataResponse.data;
    const jsonData = JSON.stringify(tableData, null, 2);
    const outputDirectory = path.join(outputDirPath, 'tableData');
    fs.mkdirSync(outputDirectory, { recursive: true });
    //create a time string dd-mm-yyyyy
    const date = new Date();
    const timeStamp = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;

    //create the json file
    const jsonFilePath = path.join(outputDirectory, `${timeStamp}-tableData.json`);
    fs.writeFileSync(jsonFilePath, jsonData);

    // Create a CSV writer
    const csvWriter = createObjectCsvWriter({
      path: path.join(outputDirectory, `${timeStamp}-tableData.csv`),
      header: [
        { id: '_id', title: 'ID' },
        { id: 'code', title: 'Code' },
        { id: 'libelle', title: 'Libelle' },
        { id: 'dispositif.nom', title: 'Dispositif' },
        // Add more headers as needed
      ],
    });
    // Write the data to the CSV file
    await csvWriter.writeRecords(tableData);

    // Create a zip archive
    const zipFilePath = path.join(outputDirectory, `${timeStamp}-tableData.zip`);
    const zipStream = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(zipStream);

    // Add JSON file to the archive
    archive.append(jsonData, { name: `${timeStamp}-tableData.json` });

    // Add csv file to the archive
    archive.append(fs.createReadStream(path.join(outputDirectory, `${timeStamp}-tableData.csv`)), { name: `${timeStamp}-tableData.csv` });

    // Finalize the archive
    archive.finalize();

    // Set response headers for the zip archive
    if (res) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=data.zip');
      // Pipe the zip archive to the response
      fs.createReadStream(zipFilePath).pipe(res);
    }
    return {
      csvPath: path.join(outputDirectory, `${timeStamp}-tableData.csv`),
      jsonPath: path.join(outputDirectory, `${timeStamp}-tableData.json`),
      zipPath: path.join(outputDirectory, `${timeStamp}-tableData.zip`),
    };
  } catch (error) {
    logger.error(error);
    if (res) res.status(500).json({ message: 'Internal server error' });
    throw new Error('Internal server error');

  }
}