import fs from "fs";
import path from "path";
import { Logger } from "./logger";
import archiver from "archiver";
import Papa from 'papaparse';
type AnyDict = { [key: string]: any };
let arraysStorage: AnyDict
const logger = new Logger("aggregateParser");

const deepTraverse = (obj: AnyDict, arrayKey?: string) => {

  const objEntries = Object.entries(obj);

  for (let [key, value] of objEntries) {
    if (!!value) {
      if (Array.isArray(value)) {

        if (typeof key === "string") {
          arraysStorage?.[key] || (arraysStorage[key] = []);
        }
        value.forEach(element => {
          deepTraverse(element, key)
        });
        const newValue = value.map((item) => {
          if (typeof item === "object") {
            const ind = arraysStorage[key].push({ index: arraysStorage[key].length + 1, ...item });
            return ind;
          } else {
            return item;
          }
        });
        obj[key] = newValue.join("|");

      } else if (typeof value === "object") {
        if (typeof key === "string") {
          arraysStorage?.[key] || (arraysStorage[key] = []);
        }
        deepTraverse(value);
        const keyToPusInto = arrayKey || key;

        const ind = arraysStorage[keyToPusInto].push({ index: arraysStorage[keyToPusInto].length + 1, ...value });
        obj[key] = ind
      }
    }

  }
}
const writeCSV = (data: AnyDict[], filePath: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // Find all unique keys in the data array
    const allKeys = new Set<string>();
    for (const obj of data) {
      for (const key of Object.keys(obj)) {
        allKeys.add(key);
      }
    }

    // Create a "template" object that has all possible fields set to null
    const template: AnyDict = {};
    Array.from(allKeys).forEach((key) => {
      template[key] = null;
    });

    // Add the template object to the beginning of the data array
    // This ensures that all possible columns exist in the resulting CSV
    const completeData = data.map((obj) => ({ ...template, ...obj }));

    // Use PapaParse to convert the objects to CSV
    const csv = Papa.unparse(completeData);

    // Write the CSV data to disk
    fs.writeFile(filePath, csv, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};


const createZip = (sourceDir: string, outputFilePath: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Compression level
    });

    output.on('close', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
};


export async function aggregateParser(jsonFilePath: string, outputDirPath: string): Promise<{
  zipFilePath: string,
  outputDirectory: string,
}> {
  try {
    arraysStorage = {
      subventions: [],
    };
    const outputDirectory = path.join(outputDirPath, "explodedData");
    if (fs.existsSync(outputDirectory)) {
      fs.readdirSync(outputDirectory).forEach((file: any) => {
        fs.unlinkSync(path.join(outputDirectory, file));
      });
    }

    fs.mkdirSync(outputDirectory, { recursive: true });

    const jsonContent = fs.readFileSync(jsonFilePath, "utf-8");

    const pubfundingMetadataArray: AnyDict[] = JSON.parse(jsonContent);


    for (let item of pubfundingMetadataArray) {
      arraysStorage.subventions.push(item);
      deepTraverse(item);
    }
    const date = new Date();
    const timeStamp = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;

    //write one JSON file per key of arraysStorage in the output directory
    for (let key in arraysStorage) {
      const jsonFilePath = path.join(outputDirectory, `${timeStamp}-${key}.json`);
      const csvFilePath = path.join(outputDirectory, `${timeStamp}-${key}.csv`);

      // Remove empty arrays
      Object.keys(arraysStorage).forEach((key) => {
        if (arraysStorage[key].length === 0) {
          delete arraysStorage[key];
        }
      });

      logger.info(`Writing ${jsonFilePath}`);
      fs.writeFileSync(jsonFilePath, JSON.stringify(arraysStorage[key], null, 2));

      logger.info(`Writing ${csvFilePath}`);
      await writeCSV(arraysStorage[key], csvFilePath);
    }
    const zipFilePath = path.join(outputDirPath, `explodedData/${timeStamp}-explodedData.zip`);

    logger.info(`Creating ZIP archive ${zipFilePath}`);

    await createZip(outputDirectory, zipFilePath);

    logger.info("zipcreated");
    return {
      zipFilePath,
      outputDirectory,
    }
  } catch (error) {
    throw error;
  }
}
