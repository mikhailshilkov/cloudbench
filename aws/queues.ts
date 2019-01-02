import { asset } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

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
let fullAccessSqs = new aws.iam.RolePolicyAttachment("sqs-access", {
    role: role,
    policyArn: aws.iam.AmazonSQSFullAccess,
});

// Pause queue + lambda
let pauseLambda = new aws.lambda.Function("pause-lambda", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./queue/jspause"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 128
}, { dependsOn: [fullAccessLambda, fullAccessSqs] });

const pauseQueue = new aws.sqs.Queue("cloudbench-aws-pause-queue", {
    visibilityTimeoutSeconds: 300,
});
pauseQueue.onEvent("cloudbench-pause-queue-onevent", pauseLambda, { batchSize: 1 });

export const pauseQueueUrl = pauseQueue.id;

// Bcrypt queue + lambda
let bcryptLambda = new aws.lambda.Function("bcrypt-lambda", {
    runtime: aws.lambda.NodeJS8d10Runtime,
    code: new asset.AssetArchive({
        ".": new asset.FileArchive("./queue/jsbcrypt"),
    }),
    timeout: 5,
    handler: "index.handler",
    role: role.arn,
    memorySize: 512
}, { dependsOn: [fullAccessLambda, fullAccessSqs] });

const bcryptQueue = new aws.sqs.Queue("cloudbench-aws-bcrypt-queue", {
    visibilityTimeoutSeconds: 300,
});
bcryptQueue.onEvent("cloudbench-pause-bcrypt-onevent", bcryptLambda, { batchSize: 1 });

export const bcryptQueueUrl = bcryptQueue.id;