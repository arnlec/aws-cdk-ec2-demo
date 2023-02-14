# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

# Retrieve private key

    aws secretsmanager get-secret-value --secret-id ec2-ssh-key/Ec2DemoStackKey/private --query SecretString --output text

ec2-54-246-242-71.eu-west-1.compute.amazonaws.com
ip-172-31-100-89.eu-west-1.compute.internal
