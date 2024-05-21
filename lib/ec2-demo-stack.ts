import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { KeyPair } from 'cdk-ec2-key-pair';
import { Construct } from 'constructs';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';


const vpcId='vpc-1d4ad478';
const availabilityZone = "eu-west-1a";
const privateSubnetCidrBlock = "172.31.100.0/24";
const squidPort=3128;
const amiId='ami-07c03c1903dca264a'; // Centos Stream 9 / eu-west-1

export class Ec2DemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this,"VPC",{vpcId:vpcId});

    // Key pair
    const key = new KeyPair(
      this,
      `${ id }key`,
      {
        keyPairName: `${ id }Key`,
        description: `Key pair for bastion of stack ${ id }`
    });
    new cdk.CfnOutput(this,'BastionKeyName',{ value: key.keyPairName });
 
    // bastion instance
    const bastion = new ec2.BastionHostLinux(
      this,
      `${ id }Bastion`,
      {
        vpc: vpc,
        availabilityZone: availabilityZone,
        subnetSelection: {
          subnetType: ec2.SubnetType.PUBLIC
        }
      }
    );
    bastion.allowSshAccessFrom(ec2.Peer.anyIpv4());
    bastion.instance.instance.addPropertyOverride('KeyName',key.keyPairName);
    new cdk.CfnOutput(this,'BastionId',{ value: bastion.instanceId});
    new cdk.CfnOutput(this, 'BastionPublicDNS', { value: bastion.instancePublicDnsName });
    new cdk.CfnOutput(this, 'BastionPublicIP', { value:bastion.instancePublicIp });    
 
    // proxy instance
    const proxySecurityGroup = new ec2.SecurityGroup(
      this,
      `${ id }ProxySecurityGroup`,
      {
        vpc: vpc,
        allowAllOutbound: true
      }
    )

    proxySecurityGroup.addIngressRule(
      ec2.Peer.ipv4(`${bastion.instancePrivateIp}/32`),
      ec2.Port.tcp(22),
      'Allow SSH access from bastion'
    );
    proxySecurityGroup.addIngressRule(
      ec2.Peer.ipv4(privateSubnetCidrBlock),
      ec2.Port.tcp(squidPort),
      'Allow squid access from workers'
    )

    const proxy = new ec2.Instance(
      this,
      `${id}Proxy`,
      {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2,ec2.InstanceSize.NANO),
        machineImage: new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
        }),
        vpc: vpc,
        availabilityZone: availabilityZone,
        keyName: key.keyPairName,
        securityGroup: proxySecurityGroup,
        vpcSubnets: {
          subnetType: SubnetType.PUBLIC
        }
      }
    )

    new cdk.CfnOutput(this,'ProxyIP',{value: proxy.instancePrivateIp})  

    // workers
    const privateSubnet = new ec2.PrivateSubnet(
      this,
      `${id}PrivateSubnet`,
      {
        availabilityZone: availabilityZone,
        cidrBlock: privateSubnetCidrBlock,
        vpcId: vpcId
      }
    );

    const securityGroup = new ec2.SecurityGroup(
      this,
      `${ id }SecurityGroup`,
      {
        vpc: vpc,
        allowAllOutbound: false
      }
    )
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(`${bastion.instancePrivateIp}/32`),
      ec2.Port.tcp(22),
      'Allow SSH access from bastion'
    );
    securityGroup.addEgressRule(
      ec2.Peer.ipv4(`${proxy.instancePrivateIp}/32`),
      ec2.Port.tcp(squidPort),
      'Allow access to proxy'
    );

    const instance1 = new ec2.Instance(
      this,
      `${id}Instance1`,
      {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2,ec2.InstanceSize.NANO),
        machineImage: ec2.MachineImage.genericLinux({
          'eu-west-1': amiId
        })/*new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
        })*/,
        vpc: vpc,
        availabilityZone: availabilityZone,
        keyName: key.keyPairName,
        securityGroup: securityGroup,
        vpcSubnets: {
          subnets:[privateSubnet]
        }
      }
    )
    new cdk.CfnOutput(this,'Instance1PrivateDNS',{value: instance1.instancePrivateDnsName})
    new cdk.CfnOutput(this,'Instance1IP',{value: instance1.instancePrivateIp})  

    
    const endpoint = vpc.addGatewayEndpoint(`${id}GatewayEndpoint`,{
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{subnets:[privateSubnet]}]
    });
    endpoint.addToPolicy(
      new iam.PolicyStatement({
        principals: [new iam.AnyPrincipal()],
        actions: ["s3:GetObject"], 
        resources: [
          "arn:aws:s3:::amazonlinux.eu-west-1.amazonaws.com/*",
          "arn:aws:s3:::amazonlinux-2-repos-eu-west-1/*"
        ],
        effect: iam.Effect.ALLOW
      })
    );
    

    

    
  }
}
