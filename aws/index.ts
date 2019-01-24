import { asset } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as serverless from "@pulumi/aws-serverless";
import {SmartVpc} from './vpc';

// Policy infra
const policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
            "Effect": "Allow",
            "Sid": "",
        }
    ],
};
const role = new aws.iam.Role("lambda-role", {
    assumeRolePolicy: JSON.stringify(policy)
});
let fullAccessLambda = new aws.iam.RolePolicyAttachment("lambda-access", {
    role: role,
    policyArn: aws.iam.AWSLambdaFullAccess,
});

// Looks like it's not needed?
// let fullAccessVpc = new aws.iam.RolePolicyAttachment("vpc-access", {
//     role: role,
//     policyArn: aws.iam.AmazonVPCFullAccess,
// });

let vpc = new SmartVpc("lambdavpc", {
    baseCidr: "10.0.0.0/16",
    azCount: 2,
    description: "Demo",
    baseTags: {
        Project: "Pulumi VPC"
    }
});

let experiments = [
    { name: 'js', runtime: aws.lambda.NodeJS8d10Runtime, handler: 'index.handler', path: 'jsnoop' },
    { name: 'python', runtime: aws.lambda.Python3d6Runtime, handler: 'handler.handler', path: 'pythonnoop' },
    { name: 'cs', runtime: aws.lambda.DotnetCore2d0Runtime, handler: 'app::app.Functions::GetAsync', path: 'csnoop/bin/Debug/netcoreapp2.0/publish' },
    { 
        name: 'vpc', 
        runtime: aws.lambda.NodeJS8d10Runtime, 
        handler: 'index.handler', 
        path: 'jsnoop', 
        environment: {
            variables:  {
                'CLOUDBENCH_ROLE': 'VPC'
            }
        }, 
        vpcConfig: {
            securityGroupIds: [vpc.defaultSecurityGroupId],
            subnetIds: vpc.privateSubnetIds
        } 
    },
];

let lambdas =
    experiments.map(exp => {        
        return [128, 256, 512, 1024, 2048].map(memory => {
            let name = memory == 128 ? `${exp.name}cold-lambda` : `${exp.name}cold-lambda-${memory}`;

            let lambda = new aws.lambda.Function(name, {
                runtime: exp.runtime,
                code: new asset.AssetArchive({
                    ".": new asset.FileArchive(`./http/${exp.path}`),
                }),
                timeout: 5,
                handler: exp.handler,
                role: role.arn,
                memorySize: memory,
                vpcConfig: exp.vpcConfig,
                environment: exp.environment
            }, { dependsOn: [fullAccessLambda] });

            return {
                lambda,
                path: `/${exp.name}cold${memory}`
            };
        })
    }).reduce((x,y) => x.concat(y), []);

const api = new serverless.apigateway.API(`http-loadtest`, {
    routes: lambdas.map (i => {
        return <serverless.apigateway.Route>{ method: "GET", path: i.path, handler: i.lambda };
    })
});

let lambda = new aws.lambda.Function("procdump", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/procdump"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 512
}, { dependsOn: [fullAccessLambda] });

const api2 = new serverless.apigateway.API(`http-dump`, {
    routes: [{ method: "GET", path: "dump", handler: lambda }]
});

export const apiEndpoint = api.url;
export const api2Endpoint = api2.url.apply(url => url + "dump");
