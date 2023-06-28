import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import {
  EC2Client,
  DescribeRegionsCommand,
  DescribeTagsCommand,
  DescribeNetworkAclsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  StartInstancesCommand,
  Described,
} from '@aws-sdk/client-ec2';
import { IAMClient, ListRolesCommand, GetAccountSummaryCommand, ListMFADevicesCommand, ListAccessKeysCommand } from '@aws-sdk/client-iam';
import { ConfigServiceClient, DescribeComplianceByConfigRuleCommand } from '@aws-sdk/client-config-service';
import { LambdaClient, AddLayerVersionPermissionCommand } from '@aws-sdk/client-lambda';

// AWS SDK 클라이언트를 생성합니다.
const stsClient = new STSClient();
const ec2Client = new EC2Client();
const iamClient = new IAMClient();
const comClient = new ConfigServiceClient();

// AWS 계정 정보를 조회하는 함수
async function getAccountInfo() {
  const command = new GetCallerIdentityCommand({});
  const response = await stsClient.send(command);
  const account = response.Account;
  const arn = response.Arn;
  const userId = response.UserId;
  return {
    account,
    arn,
    userId,
  };
}

// 사용 가능한 리전 정보를 조회하는 함수
async function getRegions() {
  // const command = new DescribeRegionsCommand({});
  // const command = new DescribeTagsCommand({});
  // const command = new DescribeNetworkAclsCommand({});
  // const command = new DescribeSubnetsCommand({});
  const command = new StartInstancesCommand({
    InstanceIds: ['i-08cf985e011cfa51f'],
  });
  const response = await ec2Client.send(command);

  if (response.StartingInstances[0].PreviousState.Name === 'running') {
    return true;
  } else {
    return false;
  }
  // let info = [];
  // const data = response.Subnets.filter((data) => {
  //   return (
  //     data.AvailableIpAddressCount < 247 &&
  //     info.push({
  //       subnetId: data.SubnetId,
  //       availableIpAddressCount: data.AvailableIpAddressCount,
  //     })
  //   );
  // });

  // if (data) {
  //   // console.log({
  //   //   statusCode: 200,
  //   //   message: 'Those Subnets have not enough Ip Sddress Count',
  //   //   info,
  //   // });
  //   return {
  //     statusCode: 200,
  //     message: 'Those Subnets have not enough Ip Address Count',
  //     info,
  //   };
  // } else if (!data.length) {
  //   return {
  //     statusCode: 200,
  //     message: "All Subnets' Ip Address Count are enough",
  //   };
  // }

  // const regions = response.Regions.map((region) => {
  //   console.log(region);
  // });
  // const tags = response.Tags.map((tag) => {
  // if (tag.ResourceType === 'instance') {
  //   console.log(tag);
  // }
  // console.log(tag);
  // });
  // response.NetworkAcls.map((network) => {
  //   const a = network.Entries.filter((entry) => {
  //     return entry.Egress === true;
  //   });
  //   a.map((d) => {
  //     console.log(d.RuleNumber);
  //   });
  // });
  // return {
  //   tags,
  // };
}

// 사용 가능한 서비스 정보를 조회하는 함수
async function getServices() {
  // const command = new ListRolesCommand({});
  // const command = new GetAccountSummaryCommand({})
  // const command = new ListMFADevicesCommand({});
  const command = new ListAccessKeysCommand({});
  const response = await iamClient.send(command);
  console.log(
    'dd',
    response.AccessKeyMetadata.map((data) => {
      data.Status === '';
    })
  );
  // const mfaDevices = response.MFADevices;

  // console.log('mfaDevices', response);

  // const roles = response.Roles.map((role) => role.RoleName);
  // return {
  //   roles,
  // };
}

// Conpliance 관련 정보 조회하는 함수
async function getCompliances() {
  const command = new DescribeComplianceByConfigRuleCommand({});
  const complianceInfo = await comClient.send(command);
  console.log('Compliance Information', complianceInfo.ComplianceByConfigRules[0].Compliance);
}

async function runFunctions() {
  // const account = await getAccountInfo();
  const regions = await getRegions();
  // const services = await getServices();
  // const compliances = await getCompliances();
  // console.log(
  // JSON.stringify({
  // {
  // account,
  // regions,
  // services,
  // compliances,
  // }
  // })
  // );
}

runFunctions();
