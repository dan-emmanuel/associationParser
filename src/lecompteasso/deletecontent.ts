import fs from 'fs';
import path from 'path';
import { Logger } from "../logger";  // Assuming Logger is in the same directory
const logger = new Logger("deleteAllContent");

export const deleteAllContent = (dirPath: string) => {
  // Check if the path exists
  if (!fs.existsSync(dirPath)) {
    logger.info("Directory path doesn't exist.");
    return;
  }

  // Read the items in the directory
  const items = fs.readdirSync(dirPath);

  // Loop through each item and delete
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // Recursively delete the content of the directory
      deleteAllContent(itemPath);

      // Delete the directory itself
      fs.rmdirSync(itemPath);
    } else {
      // Delete the file
      fs.unlinkSync(itemPath);
    }
  }
};




