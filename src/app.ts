import express, { Request, Response } from "express";
import path from 'path';
import { loginFnct } from "./lecompteasso/login";
import { gentPubFundingList } from "./lecompteasso/gentPubFundingList";
import { gentPubFundingListDetails } from "./lecompteasso/gentPubFundingListDetails";
import { aggregateParser } from "./jsonPrser";
import { GoogleDriveManager } from "./lecompteasso/GoogleDriveClient";
import { Logger } from "./logger";  // Assuming Logger is in the same directory
import { deleteAllContent } from "./lecompteasso/deletecontent";
import { outputDirPath as lecomptAssoOutPutDirPath } from "./lecompteasso/outputDirPath";
import { outputDirPath as appelAProjetOutPutDirPath } from "./appelsaprojet/outputDirPath";

import { dataScrapper } from "./appelsaprojet/dataScrapper";

const logger = new Logger("mainLogger");
const app = express();

app.use(express.json());

// Serve dayLyExporter HTML page
app.get('/dayLyExporter', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", 'public/login.html'));
});

// Your existing routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Express with TypeScript!");
});

app.post("/lecompteAsso/exportToDayData", async (req: Request, res: Response) => {
  try {
    const loginResult: boolean = await loginFnct(req.body);
    logger.info(`loginResult: ${loginResult}`);
    if (loginResult) {
      const details = await gentPubFundingListDetails(req);
      logger.info(`details: ${JSON.stringify(details)}`);
      const aggregate = await aggregateParser(details.jsonPath, lecomptAssoOutPutDirPath);
      logger.info(`aggregate: ${aggregate}`);
      const driveManager = new GoogleDriveManager();
      logger.info(`gdriver initialized`);
      const sentFiles = await driveManager.uploadFolderAndCreateSheet(aggregate.outputDirectory);
      logger.info(`sentFiles: ${sentFiles}`);
      const agregateDataPath = path.join(lecomptAssoOutPutDirPath, "aggregatedData")
      const explodedDataaPath = path.join(lecomptAssoOutPutDirPath, "explodedData")
      const tableDataDataPath = path.join(lecomptAssoOutPutDirPath, "tableData")

      deleteAllContent(agregateDataPath)
      deleteAllContent(explodedDataaPath)
      deleteAllContent(tableDataDataPath)

      res.status(200).json({ sentFiles });
    } else {

      res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get("/appelaprojets/exportToDayData", async (req: Request, res: Response) => {
  const { jsonPath } = await dataScrapper()
  logger.info(`jsonPath: ${jsonPath}`);
  const aggregate = await aggregateParser(jsonPath, appelAProjetOutPutDirPath);

  res.status(200).json({ message: "ok" });
})

app.post("/login", loginFnct);
app.get("/gentPubFundingList", gentPubFundingList);
app.get("/gentPubFundingListDetails", gentPubFundingListDetails);

const PORT = 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
