import axios from "axios";
import * as cheerio from 'cheerio';
import { Logger } from "../logger";
import { outputDirPath } from "./outputDirPath";
import path from "path";
const logger = new Logger("aggregateParser");
import fs from "fs";


export async function scrapePaginationUrls(): Promise<string[]> {
  try {
    const baseUrl = 'https://www.appelaprojets.org/appelprojet'
    const response = await axios.get(baseUrl);
    const $ = cheerio.load(response.data);
    const paginationDiv = $('#pagination');
    const listsurls: string[] = [];
    paginationDiv.find('a').each((index, element) => {
      const url = $(element).attr('href');
      if (url) listsurls.push(url);
    });
    listsurls[0] = `${baseUrl}/0`;
    return listsurls;
  } catch (error) {
    logger.error(error);
    return [];
  }
}

const gettAlsubsDetailUrlsOfAPage = async (url: string) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const projectUrls: string[] = [];
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      // Check if the href starts with the specified string
      if (href && href.startsWith('https://www.appelaprojets.org/appelprojet/display')) {
        projectUrls.push(href);
      }
    });
    return projectUrls;
  } catch (error) {
    return []
  }
}


export const getAllSubsDetails = async (pages: string[]) => Promise.all(pages.map(gettAlsubsDetailUrlsOfAPage));


interface PageData {
  name: string;
  [key: string]: string | string[];
}

async function scrapePage(url: string): Promise<PageData | null> {
  try {
    // Fetch the webpage
    const response = await axios.get(url);
    // Load the HTML response into cheerio
    const $ = cheerio.load(response.data);

    // Create an object to hold the scraped data
    const pageData: PageData = {
      name: $('h1').text().replace(/[\n\t\r"\'\\]|\\\"/g, ''),
    };

    // Navigate to the second "half" div
    const secondHalfDiv = $('.flex .half').eq(1);

    // Iterate over each h2 element within the second "half" div
    secondHalfDiv.find('h2').each((index, element) => {
      const key = $(element).text().slice(0, -1);  // Remove trailing colon

      if (key.includes("'échéance")) {
        // Get the text immediately following the h2 element  

        pageData[key] = $(element).parent().text().split("échéance :")[1].replace(/[\n\t\r"\'\\]|\\\"/g, '');
      } else {
        // Get the text of each li element within the following ul
        const values = $(element).next('ul').find('li').map((index, element) => {
          return $(element).text().replace(/[\n\t\r"\'\\]|\\\"/g, '');
        }).get();  // Convert to plain array
        pageData[key] = values;
      }
    });

    return pageData;

  } catch (error) {
    logger.error(error);
    return null;
  }
}

export const scrapAllProjectDetails = async (urlsProjet: string[]) => {
  const projectsDatas = await Promise.all(urlsProjet.map(async (url) => ({
    ... await scrapePage(url),
    url
  })));
  return projectsDatas;
}


export const dataScrapper = async () => {
  const pages = await scrapePaginationUrls()
  const urlsProject = (await Promise.all(pages.map(gettAlsubsDetailUrlsOfAPage))).flatMap((item) => item);
  const data = await scrapAllProjectDetails(urlsProject);
  const date = new Date();
  const timeStamp = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
  if (!fs.existsSync(path.join(outputDirPath, "BrutData"))) {
    fs.mkdirSync(path.join(outputDirPath, "BrutData"));
  }
  const jsonPath = path.join(outputDirPath, `BrutData/${timeStamp}-BrutData.json`);
  logger.info(`Writing ${jsonPath}`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  return {
    jsonPath
  };
}


// saveData().then(urls => {
//   logger.info(urls);  // log all scraped URLs
// });