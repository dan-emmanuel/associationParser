import { subventions } from './subventions';
import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify";

type AnyDict = { [key: string]: any };
let arraysStorage: AnyDict
const deepTraverse = (obj: AnyDict) => {
  console.log(obj);

  const objEntries = Object.entries(obj);

  for (let [key, value] of objEntries) {
    if (!!value) {
      if (Array.isArray(value)) {
        arraysStorage?.[key] || (arraysStorage[key] = []);
      }

      if (typeof value === "object") {
        arraysStorage?.[key] || (arraysStorage[key] = []);

        deepTraverse(value);
      }
    }

  }
}



export async function aggregateParser(jsonFilePath: string): Promise<void> {
  try {
    arraysStorage = {
      subventions: [],
    };
    const outputDirectory = path.join(__dirname, "outputs/explodedData");
    const fs = require("fs");

    fs.readdir(outputDirectory, (err: any, files: any) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(outputDirectory, file), (err: any) => {
          if (err) throw err;
        });
      }
    });

    fs.mkdirSync(outputDirectory, { recursive: true });

    const jsonContent = fs.readFileSync(jsonFilePath, "utf-8");
    const pubfundingMetadataArray: AnyDict[] = JSON.parse(jsonContent);


    for (let item of pubfundingMetadataArray) {
      arraysStorage.subventions.push(item);
      deepTraverse(item);
    }
    console.log(arraysStorage);

    console.log("Done");
  } catch (error) {
    throw error;
  }
}
