#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Ec2DemoStack } from '../lib/ec2-demo-stack';
import { Tags } from 'aws-cdk-lib';

const app = new cdk.App();
new Ec2DemoStack(app, 'Ec2DemoStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
Tags.of(app).add("cdk-app","ec2-demo")