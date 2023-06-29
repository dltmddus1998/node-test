import {
  ConfigServiceClient,
  PutConformancePackCommand,
  GetConformancePackComplianceDetailsCommand,
  DeleteConformancePackCommand,
  DescribeConformancePackComplianceCommand,
  ListConformancePackComplianceScoresCommand,
  GetResourceEvaluationSummaryCommand,
} from '@aws-sdk/client-config-service';
import { count } from 'console';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const client = new ConfigServiceClient({
  region: 'ap-northeast-2',
});

const __dirname = resolve();

const parentFolderPath = join(__dirname, './templates');
const yamlFilePath = join(parentFolderPath, 'Operational-Best-Practices-for-KISMS.yaml');

const createConformancePack = async () => {
  try {
    const yamlData = readFileSync(yamlFilePath, 'utf-8');

    const command = new PutConformancePackCommand({
      ConformancePackName: process.env.CONFORMANCE_PACK_NAME,
      TemplateBody: yamlData,
    });
    client
      .send(command)
      .then((data) => {
        console.log(data);
      })
      .catch((err) => {
        console.error('err', err);
      });
  } catch (error) {
    console.error(error);
  }
};
// const deleteCommand = new DeleteConformancePackCommand({
//   ConformancePackName: 'HYBRIX-ISMS-PACK-TEST',
// });

// const response = client.send(deleteCommand);
// console.log(response);
// return response;

const getDetail = async () => {
  try {
    let NextToken = '';
    // while (true) {
    const command = new GetConformancePackComplianceDetailsCommand({
      ConformancePackName: process.env.CONFORMANCE_PACK_NAME,
      NextToken: NextToken === '' ? null : NextToken,
      Filters: {
        ComplianceType: 'COMPLIANT',
      },
    });
    const response = await client.send(command);
    NextToken = response.NextToken;
    // console.log(...response.ConformancePackRuleEvaluationResults);
    console.log(NextToken);
    // }
  } catch (err) {
    console.error(err);
  }
};

const describeConformance = async () => {
  try {
    let NextToken = '';
    const command = new DescribeConformancePackComplianceCommand({
      ConformancePackName: process.env.CONFORMANCE_PACK_NAME,
      NextToken: NextToken === '' ? null : NextToken,
    });
    const response = await client.send(command);
    NextToken = response.NextToken;
    console.log(response.ConformancePackRuleComplianceList);
  } catch (err) {
    console.error(err);
  }
};

const getNonCompliantResourceIds = async () => {
  /**
   * 1️⃣
   * noncompliant - resourceIds 조회
   *
   * result
   * nonCompliantResources [
   * {
   * ResourceId: 'i-xxxxxxxxxxxx',
   * ResourceType: 'AWS::EC2::Instance'
   * },
   * {
   *  ResourceId: 'i-xxxxxxxxx',
   * ResourceType: 'AWS::EC2::Instance'
   * },
   * { ResourceId: 'xxxxxxxx', ResourceType:
   * 'AWS::::Account' }
   * ]
   */
  try {
    let nonCompliantResources = [];
    let NextToken = '';
    const command = new GetConformancePackComplianceDetailsCommand({
      ConformancePackName: process.env.CONFORMANCE_PACK_NAME,
      Filters: {
        ComplianceType: 'NON_COMPLIANT',
      },
      NextToken: NextToken === '' ? null : NextToken,
    });

    const response = await client.send(command);
    NextToken = response.NextToken;
    response.ConformancePackRuleEvaluationResults.map((data) => {
      nonCompliantResources.push({
        ResourceId: data.EvaluationResultIdentifier.EvaluationResultQualifier.ResourceId,
        ResourceType: data.EvaluationResultIdentifier.EvaluationResultQualifier.ResourceType,
      });
    });
    console.log('nonCompliantResources', nonCompliantResources);
  } catch (err) {
    console.error(err);
  }
};

const a = async () => {
  try {
    const command = new GetConformancePackComplianceDetailsCommand({
      ConformancePackName: process.env.CONFORMANCE_PACK_NAME,
    });
  } catch (err) {
    console.error(err);
  }
};

const getConformancePackComplianceDetails = async () => {
  try {
    let nonCompliantResources = [];
    const command = new GetConformancePackComplianceDetailsCommand({
      ConformancePackName: process.env.CONFORMANCE_PACK_NAME,
    });

    const response = await client.send(command);
    console.log('rules', ...response.ConformancePackRuleEvaluationResults);
  } catch (err) {
    console.error(err);
  }
};

const listConformancePackComplianceScores = async () => {
  /**
   * Compliance Score 조회
   *
   * result
   * {
   *  ConformancePackName: process.env.CONFORMANCE_PACK_NAME,
   *  LastUpdatedTime: 2023-06-29T04:44:19.223Z,
   *  Score: '050.00'
   * }
   */
  const command = new ListConformancePackComplianceScoresCommand({
    Filters: {
      ConformancePackNames: [process.env.CONFORMANCE_PACK_NAME],
    },
  });
  const response = await client.send(command);
  console.log(...response.ConformancePackComplianceScores);
};

async function runFunctions() {
  // await createConformancePack();
  // await getDetail();
  // await describeConformance();
  await getNonCompliantResourceIds();
  // await getConformancePackComplianceDetails();
  // await listConformancePackComplianceScores();
}

runFunctions();
