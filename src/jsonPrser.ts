import { subventions } from './subventions';
import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify";
import { Logger } from "./logger";
type AnyDict = { [key: string]: any };
let arraysStorage: AnyDict
const deepTraverse = (obj: AnyDict, arrayKey?: string) => {

  const objEntries = Object.entries(obj);

  for (let [key, value] of objEntries) {
    if (!!value) {
      if (Array.isArray(value)) {
        arraysStorage?.[key] || (arraysStorage[key] = []);
        value.forEach(element => {
          deepTraverse(value, key)
        });
      }

      if (typeof value === "object") {
        if (typeof key === "string") {
          arraysStorage?.[key] || (arraysStorage[key] = []);         
        }
        deepTraverse(value);
        const keyToPusInto = arrayKey || key;

        arraysStorage[keyToPusInto].push(value);
      }
    }

  }
}



export async function aggregateParser(jsonFilePath: string): Promise<void> {
  const logger = new Logger("aggregateParser");
  try {
    arraysStorage = {
      subventions: [],
    };
    const outputDirectory = path.join(__dirname, "outputs/explodedData");
    const fs = require("fs");


    fs.readdirSync(outputDirectory).forEach((file: any) => {
      fs.unlinkSync(path.join(outputDirectory, file));
    });

    fs.mkdirSync(outputDirectory, { recursive: true });

    const jsonContent = fs.readFileSync(jsonFilePath, "utf-8");
    const pubfundingMetadataArray: AnyDict[] = JSON.parse(jsonContent);


    for (let item of pubfundingMetadataArray) {
      arraysStorage.subventions.push(item);
      deepTraverse(item);
    }

    //write one JSON file per key of arraysStorage in the output directory
    for (let key in arraysStorage) {
      const filePath = path.join(outputDirectory, `${key}.json`);
      logger.info(`Writing ${filePath}`);

      fs.writeFileSync(filePath, JSON.stringify(arraysStorage[key], null, 2));
    }


    logger.verbose("Done");
  } catch (error) {
    throw error;
  }
}
