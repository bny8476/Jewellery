const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../../frontend/src/utils/localData.ts');
const destDir = path.resolve(__dirname, '../src/data');
const destPath = path.join(destDir, 'seedInventory.ts');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let content = fs.readFileSync(srcPath, 'utf8');
content = content.replace(
  "import { JewelryItem } from '../lib/supabase';",
  "export interface JewelryItem {\n  [key: string]: any;\n}"
);

fs.writeFileSync(destPath, content, 'utf8');
console.log('Successfully created seedInventory.ts with ' + content.length + ' bytes');
