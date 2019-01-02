import { asset } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as serverless from "@pulumi/aws-serverless";

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
let fullAccessS3 = new aws.iam.RolePolicyAttachment("s3-access", {
    role: role,
    policyArn: aws.iam.AmazonS3FullAccess,
});

// Pause lambda
let pauseLambda = new aws.lambda.Function("pause-lambda", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jspause"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 128
}, { dependsOn: [fullAccessLambda] });

// Bcrypt lambda
let bcryptLambda = new aws.lambda.Function("bcrypt-lambda", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsbcrypt"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 512
}, { dependsOn: [fullAccessLambda] });

// Blob lambda
let blobLambda = new aws.lambda.Function("blob-lambda", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsblob"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 512
}, { dependsOn: [fullAccessLambda, fullAccessS3] });

const api = new serverless.apigateway.API(`http-loadtest`, {
    routes: [
        { method: "GET", path: `/pause`, handler: pauseLambda },
        { method: "GET", path: `/bcrypt`, handler: bcryptLambda },
        { method: "GET", path: `/blob`, handler: blobLambda }
    ]
});

export const apiEndpoint = api.url;