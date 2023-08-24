import path from "path";
import fs from 'fs';
import { google, sheets_v4 } from 'googleapis';
import { createObjectCsvWriter } from 'csv-writer';

interface MyObject {
    [key: string]: MyObject | number | string | boolean | null;
}

let possibilitiesArray: MyObject[] = [];

const  writeObjToCSV = (obj: MyObject, index: number) =>{
  const csvParsedPath = path.join(__dirname, 'outputs/csvParsed');
  objectParser(obj)
  fs.mkdirSync(csvParsedPath, { recursive: true });
    const csvWriter = createObjectCsvWriter({
        path: `${csvParsedPath}csvParsedPath_${index}.csv`,
        header: [
            { id: 'key', title: 'KEY' },
            { id: 'value', title: 'VALUE' }
        ]
    });

    const records = Object.keys(obj).map(key => ({ key, value: obj[key] }));
    csvWriter.writeRecords(records);
}

const  processObject = (obj: MyObject) =>{
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            possibilitiesArray.push(obj[key] as MyObject);
            const currentIndex = possibilitiesArray.length - 1;
            obj[key] = currentIndex;
            writeObjToCSV(obj[key] as MyObject, currentIndex);
            processObject(obj[key] as MyObject);
        }
    });
}

const objectParser = (object:any)=>{
    import fs from 'fs';

interface PubfundingMetadata { /* ... */ }

// Recursive function to process the JSON object
function processObject(obj: any, parentArray?: any[]): any {
  if (Array.isArray(obj)) {
    const newArray: any[] = [];
    for (const item of obj) {
      newArray.push(processObject(item, newArray));
    }
    return newArray;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = processObject(obj[key]);
    }
    if (parentArray) {
      const index = parentArray.findIndex((element) => JSON.stringify(element) === JSON.stringify(newObj));
      if (index !== -1) {
        return index;
      } else {
        parentArray.push(newObj);
        return parentArray.length - 1;
      }
    }
    return newObj;
  }
  return obj;
}

    // Function to convert array of arrays into CSV
    function arraysToCsv(arrays: any[]): string {
    const csvLines = arrays.map((arr) => arr.map((val) => JSON.stringify(val)).join(',')).join('\n');
    return csvLines;
    }

    function scrapAndStore(metadata: PubfundingMetadata[]): void {
    const processedData = processObject(metadata);
    const csvData = arraysToCsv(processedData);

    fs.writeFileSync('output.csv', csvData, 'utf-8');
    }

// Example usage
scrapAndStore(metadata);

}


// const  writeToGoogleSheets = (auth: any, data: any[][]) =>{
//     const sheets = google.sheets('v4');
//     const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // Replace with your spreadsheet ID

//     sheets.spreadsheets.values.append({
//         auth: auth,
//         spreadsheetId: spreadsheetId,
//         range: 'A1', // Adjust this as per your requirement
//         valueInputOption: 'RAW',
//         insertDataOption: 'INSERT_ROWS',
//         resource: {
//             values: data // Your data array here
//         }
//     }, (err, res) => {
//         if (err) return console.log(`The API returned an error: ${err}`);
//         console.log(`Appended: ${res?.data?.updates?.updatedCells} cells`);
//     });
// }

export const  agregateParser = (filePath: string)=> {
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(jsonContent) as MyObject;

    processObject(jsonData);

    // Assuming possibilitiesArray contains 2D arrays for Google Sheets
    // writeToGoogleSheets(auth, possibilitiesArray);

    fs.writeFileSync('output.json', JSON.stringify(jsonData, null, 2));
}

const auth = new google.auth.OAuth2(/* ... your credentials ... */);
