import express, { Request, Response } from "express";
import path from 'path';
import { loginFnct } from "./login";
import { gentPubFundingList } from "./gentPubFundingList";
import { gentPubFundingListDetails } from "./gentPubFundingListDetails";
import { aggregateParser } from "./jsonPrser";
import { GoogleDriveManager } from "./GoogleDriveClient";
import { Logger } from "./logger";  // Assuming Logger is in the same directory
import { deleteAllContent } from "./deletecontent";

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

app.post("/exportToDayData", async (req: Request, res: Response) => {
  try {
    const loginResult: boolean = await loginFnct(req.body);
    logger.info(`loginResult: ${loginResult}`);
    if (loginResult) {
      const details = await gentPubFundingListDetails(req);
      logger.info(`details: ${JSON.stringify(details)}`);
      const aggregate = await aggregateParser(details.jsonPath);
      logger.info(`aggregate: ${aggregate}`);
      const driveManager = new GoogleDriveManager();
      logger.info(`gdriver initialized`);
      const sentFiles = await driveManager.uploadFolderAndCreateSheet(aggregate.outputDirectory);
      logger.info(`sentFiles: ${sentFiles}`);
      const agregateDataPath = path.join(__dirname, "..", "outputs/aggregatedData")
      const explodedDataaPath = path.join(__dirname, "..", "outputs/explodedData")
      const tableDataDataPath = path.join(__dirname, "..", "outputs/tableData")

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

app.post("/login", loginFnct);


app.get("/gentPubFundingList", gentPubFundingList);
app.get("/gentPubFundingListDetails", gentPubFundingListDetails);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
