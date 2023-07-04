import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import express from 'express';
import { ConfigServiceClient, PutConformancePackCommand } from '@aws-sdk/client-config-service';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
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

  // const command = new PutConformancePackCommand({
  //   // ConformancePackName: 'HYBRIX-CONF-TEST-SY',
  //   ConformancePackName: conformancePackName,
  //   TemplateBody: yamlData,
  // });

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

  const command = new PutConformancePackCommand({
    ConformancePackName: 'HYBRIX-CONF-TEST-SY',
    TemplateBody: yamlData,
  });

  const response = await configServiceClient.send(command);

  console.log(response);

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

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
