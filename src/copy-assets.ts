import * as fs from 'fs';
import * as path from 'path';

function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  const files = fs.readdirSync(from);

  for (const file of files) {
    const fromPath = path.join(from, file);
    const toPath = path.join(to, file);
    const stat = fs.statSync(fromPath);

    if (stat.isDirectory()) copyFolderSync(fromPath, toPath);
    else fs.copyFileSync(fromPath, toPath);
  }
}

// Assuming 'public' and 'outputs' are in the same directory as your `package.json` 
copyFolderSync(path.join(__dirname, 'public'), path.join(__dirname, "..", 'dist', 'public'));
copyFolderSync(path.join(__dirname, 'outputs'), path.join(__dirname, "..", 'dist', 'outputs'));
