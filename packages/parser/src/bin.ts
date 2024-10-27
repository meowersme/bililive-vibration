import { join } from 'path';
import { readdir, readFile, writeFile } from 'fs/promises';
import { parseVibrationData } from './parser';

/**
 * 遍历目录下的所有 MP4 文件，并输出对应的包含震动数据的 JSON 文件。
 */
async function main() {
  const directory = process.argv[2];

  if (!directory) {
    console.error('usage: node dist/bin.js <directory>');
    process.exit(1);
  }

  console.log('开始处理目录下的视频:', directory);
  const files = await readdir(directory);

  for (const file of files) {
    if (file.endsWith('.mp4')) {
      const jsonFile = file.replace('.mp4', '.json');
      await generateVibrationFile(join(directory, file), join(directory, jsonFile));
      console.log('处理完成:', jsonFile);
    }
  }
}

async function generateVibrationFile(input: string, output: string) {
  const buffer = await readFile(input);
  const data = await parseVibrationData(buffer);
  await writeFile(output, JSON.stringify(data));
}

main();
