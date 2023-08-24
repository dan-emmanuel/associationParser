import express, { Request, Response } from "express";
import { UserSingleton } from "./user"
import axios from "axios";
import fs from "fs";
import fastcsv from "fast-csv";
import { loginFnct } from "./login";
import { gentPubFundingList } from "./gentPubFundingList";
import { gentPubFundingListDetails } from "./gentPubFundingListDetails";
import { aggregateParser } from "./jsonPrser";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Express with TypeScript!");
});

app.post("/login", loginFnct);
app.get("/gentPubFundingList", gentPubFundingList);

app.get("/gentPubFundingListDetails", gentPubFundingListDetails);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

aggregateParser(
  "/Users/danazoulay/Desktop/asso_scrapper/src/outputs/aggregatedData/24-7-2023-aggregatedData.json"
);