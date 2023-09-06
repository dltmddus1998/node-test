import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import express from 'express';
import { ConfigServiceClient, PutConformancePackCommand, DescribeConformancePackStatusCommand } from '@aws-sdk/client-config-service';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import Fuse from 'fuse.js';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.post('/conformance', async (req, res) => {
  const { conformancePackName, conformanceType } = req.body;

  const stsClient = new STSClient({
    region: 'ap-northeast-2',
  });

  const stsCommand = new AssumeRoleCommand({
    RoleArn: process.env.ROLE_ARN,
    RoleSessionName: process.env.ROLE_SESSION_NAME,
    ExternalId: process.env.EXTERNAL_ID,
  });

  const stsRsp = await stsClient.send(stsCommand);
  const __dirname = resolve();

  const parentFolderPath = join(__dirname, './templates');
  const yamlFilePath = join(parentFolderPath, 'Operational-Best-Practices-for-KISMS.yaml');

  const yamlData = readFileSync(yamlFilePath, 'utf-8');

  const configServiceClient = new ConfigServiceClient({
    region: 'ap-northeast-2',
    credentials: {
      accessKeyId: stsRsp.Credentials.AccessKeyId,
      secretAccessKey: stsRsp.Credentials.SecretAccessKey,
      sessionToken: stsRsp.Credentials.SessionToken,
    },
  });

  const command = new PutConformancePackCommand({
    // ConformancePackName: 'HYBRIX-CONF-TEST-SY',
    ConformancePackName: conformancePackName,
    TemplateBody: yamlData,
  });

  const listCommand = new DescribeConformancePackStatusCommand({
    ConformancePackNames: [conformancePackName],
  });

  if (listCommand) {
    const listRsp = await configServiceClient.send(listCommand);
    console.log(listRsp.ConformancePackStatusDetails[0].ConformancePackState);
  } else {
    console.log('No!!');
  }

  // Conformance Pack
  try {
    // const response = await configServiceClient.send(command);
    return res.json({
      message: 'Conformance Pack deploying Succeeded!',
      // response: response.ConformancePackArn,
    });
  } catch (error) {
    console.error(error);
  }
});

app.get('/conformance', async (req, res) => {
  const stsClient = new STSClient({
    region: 'ap-northeast-2',
  });

  const stsCommand = new AssumeRoleCommand({
    RoleArn: process.env.ROLE_ARN,
    RoleSessionName: process.env.ROLE_SESSION_NAME,
    ExternalId: process.env.EXTERNAL_ID,
  });

  const stsRsp = await stsClient.send(stsCommand);
  const __dirname = resolve();

  const parentFolderPath = join(__dirname, './templates');
  const yamlFilePath = join(parentFolderPath, 'Operational-Best-Practices-for-KISMS.yaml');

  const yamlData = readFileSync(yamlFilePath, 'utf-8');

  const configServiceClient = new ConfigServiceClient({
    region: 'ap-northeast-2',
    credentials: {
      accessKeyId: stsRsp.Credentials.AccessKeyId,
      secretAccessKey: stsRsp.Credentials.SecretAccessKey,
      sessionToken: stsRsp.Credentials.SessionToken,
    },
  });

  // const command = new PutConformancePackCommand({
  //   ConformancePackName: 'HYBRIX-CONF-TEST-SY',
  //   TemplateBody: yamlData,
  // });

  // const response = await configServiceClient.send(command);

  const listCommand = new ListConformancePackComplianceScoresCommand({});

  console.log(`foo = `, listCommand);
  // console.log(response);

  // if (response) {
  //   // response.ConformancePackArn
  //   // res.send('Hello, World!');
  //   res.json({
  //     message: response.ConformancePackArn,
  //     statusCode: 202,
  //   });
  // } else {
  //   res.json({
  //     message: 'error',
  //     statusCode: 400,
  //   });
  // }
});

app.get('/sec-similar-matching', async (req, res) => {
  /**
   * awsServiceCodeList.json의 [[description]]
   * ↕
   * mappedSecurityTermList.json의 [[securityTerm]]
   *
   * 똑같은 단어 및 유사한 단어까지 매칭하여 일치하는 부분 return
   */

  let securityTermArr = [];
  let resultSet;
  let result;

  // 1. awsServiceCodeList.json
  // fs.readFile('./process/awsServiceCodeList.json', 'utf8', (err, serviceCodeList) => {
  //   if (err) {
  //     console.error(err);
  //   } else {
  //     const parsedServiceCodeList = JSON.parse(serviceCodeList);
  //     parsedServiceCodeList.forEach((serviceCode) => {
  //       serviceDescriptionList.push(serviceCode['ServiceDescription']);
  //     });
  //   }
  // });

  const checkRuleNameList = fs.readFileSync('./process/awsCheckRuleNameList.json', 'utf-8');
  const securityTermList = fs.readFileSync('./process/mappedSecurityTermList.json', 'utf-8');

  if (checkRuleNameList && securityTermList) {
    const resultArr = [];

    const parsedCheckRuleNameList = JSON.parse(checkRuleNameList);
    const parsedSecurityTermList = JSON.parse(securityTermList);

    const descriptionWordList = [];

    parsedCheckRuleNameList.forEach((checkRuleName) => {
      // console.log(checkRuleName['description'].split(' '));
      descriptionWordList.push(checkRuleName['description'].split(' '));
    });

    parsedSecurityTermList.forEach((securityTerm) => {
      // console.log(securityTerm['securityTerm']);
      securityTermArr.push(securityTerm['securityTerm']);
    });

    const matchingWordOfST = [];
    const onlyWordOfST = [];

    securityTermArr.forEach((securityTerm, i) => {
      // console.log(securityTerm.split(' '));
      const eachWordOfST = securityTerm.split(' ');
      matchingWordOfST.push({
        index: i,
        eachWordOfST,
      });
      // console.log(matchingWordOfST);
      matchingWordOfST.forEach((data) => {
        // console.log(data['eachWordOfST']);
        onlyWordOfST.push(data['eachWordOfST']);
      });
      // console.log(onlyWordOfST);
    });

    const uniqueOnlyWordOfST = new Set(onlyWordOfST);
    const uniqueOnlyWordOfSTArr = [...uniqueOnlyWordOfST];

    const onlyWordArr = [];
    // console.log(`foo = `, descriptionWordList.length);
    // const uniqueDescriptionWordSet = new Set(descriptionWordList);
    // const uniqueDescriptionWordList = [...uniqueDescriptionWordSet];
    // console.log(uniqueDescriptionWordList);

    const eachDescriptionWord = [];

    descriptionWordList.forEach((word) => {
      eachDescriptionWord.push(word);
    });

    let fuse;

    descriptionWordList.forEach((descriptionWord, idx) => {
      // console.log(descriptionWord);
      fuse = new Fuse(
        descriptionWord.map((word) => {
          console.log(word, idx);
          return { name: word, idx };
        }),
        {
          shouldSort: true,
          threshold: 0.4,
          location: 0,
          distance: 100,
          keys: ['name'],
          minMatchCharLength: 1,
        }
      );
    });
    // console.log(fuse['_docs']);
    uniqueOnlyWordOfSTArr.forEach((onlyWord, idx) => {
      // console.log(onlyWord, idx);
      onlyWord.forEach((word) => {
        // console.log(word, idx);
        onlyWordArr.push({
          word,
          idx,
        });
      });
      // const fuse = new Fuse(
      // descriptionWordList.map(descriptionWord => ({name: descriptionWord})), {
      //   shouldSort: true,
      //   threshold: 0.4,
      //   location: 0,
      //   distance: 100,
      //   keys: ['name'],
      //   minMatchCharLength: 1,
      // }
      // );
      // const result = fuse.search(onlyWord)
    });

    // console.log(onlyWordArr);

    for (let onlyWord of onlyWordArr) {
      // console.log(onlyWord['word']);
      // console.log(fuse.search(onlyWord['word']));
      result = fuse.search(onlyWord['word']);
      // console.log(result);
    }
    // console.log(fuse.search('applications')[0]);

    if (result.length > 0) {
      // result.forEach((el) => {
      //   console.log(el);
      //   resultArr.push(el.item.name);
      // });
    }
    // console.log(resultArr);
  }
});

app.get('/', async (req, res) => {
  const { term } = req.body;
  const arr = [];
  const arrayData = [];
  const result = [];

  // fs.readFile('./security.txt', 'utf-8', (err, data) => {
  //   if (err) {
  //     console.error(err);
  //     return;
  //   } else {
  //     const dataArr = data.split('\n');
  //     dataArr.map((el) => {
  //       el.split(' ').forEach((e) => {
  //         if (e.split(' ') !== '\r' || e.split(' ') !== '\f\f') arrayData.push(...e.split(' '));
  //       });
  //     });
  //     const filteredArrayData = arrayData.filter((el) => {
  //       return typeof el === 'string' && el !== '';
  //     }); // security term Array

  //     filteredArrayData.map((el) => {
  //       if (typeof el === 'string') {
  //         const a = el.replace('\r', '');
  //         // console.log(a);
  //         arr.push(a);
  //       }
  //     });

  //     const termArr = term.split(' '); // req term Array

  //     const set1 = new Set(dataArr);

  //     let resultSet;

  //     dataArr.forEach((data) => {
  //       for (let w2 of termArr) {
  //         console.log('data', data);
  //         console.log('w2', w2);
  //         console.log('include', data.includes(w2));
  //         console.log('-----------------------');
  //         // console.log(`foo = `, data.includes(w2));
  //         if (!data.includes(w2)) result.push(data);
  //         resultSet = new Set(result);
  //         console.log(resultSet)
  //       }
  //     });

  //     // for (let w2 of termArr) {
  //     //   if (set1.has(w2) && w2 !== '') {
  //     //     result.push(dataArr[0]);
  //     //   }
  //     // }

  //     return res.json({
  //       result,
  //     });
  //   }
  // });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
