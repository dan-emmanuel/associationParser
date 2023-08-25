import express, { Request, Response } from "express";
import path from 'path';
import { loginFnct } from "./login";
import { gentPubFundingList } from "./gentPubFundingList";
import { gentPubFundingListDetails } from "./gentPubFundingListDetails";
import { aggregateParser } from "./jsonPrser";

const app = express();

app.use(express.json());

// Serve login HTML page
app.get('/login', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Your existing routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Express with TypeScript!");
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    console.log(req.body);

    const loginResult: boolean = await loginFnct(req.body);
    if (loginResult) {
      const details = await gentPubFundingListDetails(req, res);
      res.json(details);
    } else {

      res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get("/gentPubFundingList", gentPubFundingList);
app.get("/gentPubFundingListDetails", gentPubFundingListDetails);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
