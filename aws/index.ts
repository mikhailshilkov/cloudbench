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
        ".": new asset.FileArchive("./http/jsblobmeasure"),
    }),
    timeout: 50,
    handler: "index.handler",
    role: role.arn,
    memorySize: 512
}, { dependsOn: [fullAccessLambda, fullAccessS3] });

// No-op JS lambda for cold starts
let jsCold128Lambda = new aws.lambda.Function("jscold-lambda", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsnoop"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 128
}, { dependsOn: [fullAccessLambda] });
let jsCold128Lambda2 = new aws.lambda.Function("jscold-lambda2", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsnoop"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 128
}, { dependsOn: [fullAccessLambda] });
let jsCold1024Lambda = new aws.lambda.Function("jscold-lambda-1024", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsnoop"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 1024
}, { dependsOn: [fullAccessLambda] });

// No-op Python lambda for cold starts
let pythonCold128Lambda = new aws.lambda.Function("pythoncold-lambda", {
    runtime: aws.lambda.Python3d6Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/pythonnoop"),
    }),
    timeout: 5,
    handler: "handler.handler",
    role: role.arn,
    memorySize: 128
}, { dependsOn: [fullAccessLambda] });

// No-op C# lambda for cold starts
let csCold128Lambda = new aws.lambda.Function("cscold-lambda", {
    runtime: aws.lambda.DotnetCore2d0Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/csnoop/bin/Debug/netcoreapp2.0/publish"),
    }),
    timeout: 5,
    handler: "app::app.Functions::GetAsync",
    role: role.arn,
    memorySize: 128
}, { dependsOn: [fullAccessLambda] });

const api = new serverless.apigateway.API(`http-loadtest`, {
    routes: [
        { method: "GET", path: `/pause`, handler: pauseLambda },
        { method: "GET", path: `/bcrypt`, handler: bcryptLambda },
        { method: "GET", path: `/blob`, handler: blobLambda },
        { method: "GET", path: `/jscold128`, handler: jsCold128Lambda },
        { method: "GET", path: `/jscold1024`, handler: jsCold1024Lambda },        
        { method: "GET", path: `/jscold1282`, handler: jsCold128Lambda2 },
        { method: "GET", path: `/pythoncold128`, handler: pythonCold128Lambda },        
        { method: "GET", path: `/cscold128`, handler: csCold128Lambda },        
    ]
});

export const apiEndpoint = api.url;