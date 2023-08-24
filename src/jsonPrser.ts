import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify";

type AnyDict = { [key: string]: any };

let arraysStorage: { [key: string]: any[] } = {};

function processArray(array: any[], key: string): string {
  if (!arraysStorage[key]) {
    arraysStorage[key] = [];
  }
  let indexes: number[] = [];
  for (let obj of array) {
    arraysStorage[key].push(obj);
    indexes.push(arraysStorage[key].length - 1);
  }
  return indexes.join(",");
}

function deepTraverse(obj: AnyDict): void {
  for (let key in obj) {
    if (Array.isArray(obj[key])) {
      if (obj[key].length > 0 && typeof obj[key][0] === "string") {
        obj[key] = obj[key].join(",");
      } else {
        obj[key] = processArray(obj[key], key);
      }
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      if (!arraysStorage[key]) {
        arraysStorage[key] = [];
      }
      arraysStorage[key].push(obj[key]);
      obj[key] = arraysStorage[key].length - 1;
      deepTraverse(obj[key]);
    } else {
      console.log(key);
    }
  }
}

async function saveToFiles(directory: string): Promise<void> {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  for (let arrayName in arraysStorage) {
    const filePathJSON = path.join(directory, `${dateStr}-${arrayName}.json`);
    const filePathCSV = path.join(directory, `${dateStr}-${arrayName}.csv`);
    fs.writeFileSync(
      filePathJSON,
      JSON.stringify(arraysStorage[arrayName], null, 2)
    );

    const csvString = await new Promise<string>((resolve, reject) => {
      stringify(arraysStorage[arrayName], { header: true }, (err, output) => {
        if (err) return reject(err);
        resolve(output as string);
      });
    });

    fs.writeFileSync(filePathCSV, csvString);
  }
}

export async function aggregateParser(jsonFilePath: string): Promise<void> {
  try {
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

    arraysStorage = {};

    for (let item of pubfundingMetadataArray) {
      deepTraverse(item);
    }

    await saveToFiles(outputDirectory);
    console.log("Done");
  } catch (error) {
    throw error;
  }
}
