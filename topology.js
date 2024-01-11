import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import fs, { readFileSync, unlinkSync } from 'fs';
import util from 'util';
import { join, resolve } from 'path';
import { exec } from 'child_process';
dotenv.config();

import { addLayer, updateD2, generateSVG, analSvg } from './services/topology.service.js';

const execAsync = util.promisify(exec);

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.get('/d2', async (req, res) => {
  try {
    const filename = 'index2';
    // TODO: generateSVG 부분을 동기적으로 수정하니 속도가 훨씬 빨라짐 - 분석하기
    /**
     * 원래 코드
     * await updateD2(filename);
     * await generateSVG(filename)
     *
     * 문제점
     * 1) 삭제하는 시점 문제 때문에 파일을 못읽어 오는 경우 생김
     * 2)
     */

    const addLayerResult = addLayer(filename);

    if (addLayerResult) {
      await updateD2(filename);
      await generateSVG(filename);

      const __dirname = resolve();

      const parentFolderPath = join(__dirname, './d2');
      const svgFilePath = join(parentFolderPath, `${filename}.svg`);
      const svgContent = readFileSync(svgFilePath, 'utf-8');

      res.send(svgContent);
      unlinkSync(svgFilePath);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error in SVG generation');

    if (!res.headersSent) {
      res.status(500).send('Error in SVG generation');
    }
  }
});

app.get('/d2-cons', async (req, res) => {
  try {
    const filename = 'index';
    const addLayerResult = addLayer(filename);

    if (addLayerResult) {
      await updateD2(`${filename}-added`);
      await generateSVG(`${filename}-added-final`);

      const __dirname = resolve();

      const parentFolderPath = join(__dirname, './d2');
      const svgFilePath = join(parentFolderPath, `${filename}-added-final.svg`);
      const svgContent = readFileSync(svgFilePath, 'utf-8');

      // TODO: svgContent 분석해서 특정 구역에 n개 이상의 vpc가 있다면 show all hidden=false 상태로 전화... -> 이게 잘 안됨...>>
      if (svgContent.includes('box-row1.box5')) console.log('dfsafdsa');

      res.send(svgContent);
      unlinkSync(svgFilePath);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error in SVG generation');
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
