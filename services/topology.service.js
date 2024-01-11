import fs, { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { spawn } from 'child_process';
import jsdom from 'jsdom';

export const updateD2 = async (filename) => {
  let d2Data = readFileSync(`./d2/${filename}.d2`, 'utf-8');
  const topologyData = fs.readFileSync('./topology-data/vpc.json');
  const topology = JSON.parse(topologyData);

  Object.keys(topology).forEach((variable) => {
    const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
    d2Data = d2Data.replaceAll(regex, topology[variable]);
  });

  fs.writeFileSync(`./d2/${filename}-final.d2`, d2Data);
};

export const addLayer = (filename) => {
  const d2File = readFileSync(`./d2/${filename}.d2`, 'utf-8');
  let result = '';
  const lines = d2File.split('\n');

  for (let line of lines) {
    if (line.startsWith('#<<repeat:')) {
      const pattern = /#<<repeat:\((\d+),\s*(\d+)\)\[\[(.+)\]\]/s;
      const match = line.match(pattern);

      if (match) {
        const start = parseInt(match[1]);
        const repeatCnt = parseInt(match[2]);
        let textToRepeat = match[3];

        textToRepeat = textToRepeat.replace(/\\r/g, '\n');

        for (let i = 0; i < repeatCnt; i++) {
          let currentText = textToRepeat.replaceAll('{{n}}', start + i);
          result += currentText + '\n';
        }
      }
    } else {
      result += line + '\n';
    }
  }

  fs.writeFileSync(`./d2/${filename}-added.d2`, result);
  return result;
};

export const generateSVG = async (filename) => {
  const __dirname = resolve();
  const parentFolderPath = join(__dirname, './d2');
  const d2FilePath = join(parentFolderPath, `${filename}.d2`);

  return new Promise((resolve, reject) => {
    const process = spawn('D2_LAYOUT=tala d2', ['--watch', d2FilePath, '--browser', '0'], { shell: true });

    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
      console.log(`child process exited with the code ${code}`);
      resolve();
    });

    setTimeout(() => {
      process.kill();
      resolve();
    }, 5000);
  });
};

const deleteComment = (filename) => {
  const d2Data = readFileSync(`./d2/${filename}`.d2, 'utf-8');
  const lines = d2Data.split('\n');

  for (let line of lines) {
    if (line.includes('box-row1.boxN: null') && line.includes('#')) {
      line.replaceAll('#', '');
    }
  }
};

export const analSvg = (filename, svgContent) => {
  try {
    console.log(svgContent);
    if (svgContent.includes('box-row1.box5')) {
      deleteComment(filename);
    }
  } catch (error) {
    console.error(error);
  }
};
