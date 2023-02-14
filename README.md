# EC2 deployment demo

Usage of cdk toolkit to deploy EC2 instances

## Getting started

### Prerequisites
* aws account
* aws cli (https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
* aws CDK for TypeScript (https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

Use the _aws configure_ command to set up AWS CLI installation with the mandatory informations: Acces Key ID, Secret access key, AWS Region, and output format

Bootstrap AWS CDK is required before the first stack deployment in an AWS environment (Account/Region).

    cdk bootstrap

### Useful commands
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk destroy`     destroy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template    

### Access to EC2 instance

Connect to instance using SSH require to use a private key. The private key is store in AWS Secret Manager.
Use the below command to get the private key value:

    aws secretsmanager get-secret-value --secret-id ec2-ssh-key/Ec2DemoStackKey/private --query SecretString --output text

