#!/usr/bin/env node
import "dotenv/config";
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AwsCdkHandsOnStack } from "../lib/aws-cdk-hands-on-stack";

const app = new cdk.App();
new AwsCdkHandsOnStack(app, "AwsCdkHandsOnStack", {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
});
