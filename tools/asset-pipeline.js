const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RAW_DIR = path.resolve(__dirname, '../assets/raw');
const OUTPUT_DIR = path.resolve(__dirname, '../packages/web/assets');

async function processImage(inputPath, outputPath, options = {}) {
  const { width, quality = 80 } = options;

  await sharp(inputPath)
    .resize(width)
    .jpeg({ quality })
    .toFile(outputPath);

  console.log(`处理完成: ${inputPath} -> ${outputPath}`);
}

async function processAssets() {
  if (!fs.existsSync(RAW_DIR)) {
    console.log('原始资源目录不存在，跳过处理');
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(RAW_DIR);

  for (const file of files) {
    if (file.match(/\.(png|jpg|jpeg)$/i)) {
      const inputPath = path.join(RAW_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
      await processImage(inputPath, outputPath, { width: 512 });
    }
  }

  console.log('资源处理完成!');
}

processAssets().catch(console.error);
