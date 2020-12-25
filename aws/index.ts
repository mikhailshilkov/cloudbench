import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {SmartVpc} from './vpc';

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
    assumeRolePolicy: JSON.stringify(policy),
    tags: {
        Owner: "mikhailshilkov",
    },
});
let fullAccessLambda = new aws.iam.RolePolicyAttachment("lambda-access", {
    role: role,
    policyArn: aws.iam.ManagedPolicies.AWSLambdaFullAccess,
});
let vpcAccessLambda = new aws.iam.RolePolicyAttachment("lambda-vpc-access", {
    role: role,
    policyArn: aws.iam.ManagedPolicies.AWSLambdaVPCAccessExecutionRole,
});

function createColdStarts() {
    let vpc = new SmartVpc("lambdavpc", {
        baseCidr: "10.0.0.0/16",
        azCount: 2,
        description: "Demo",
        baseTags: {
            Owner: "mikhailshilkov",
        }
    });

    let lambdaBucket = new aws.s3.Bucket("lambdas", {
        tags: {
            Owner: "mikhailshilkov",
        },
    });
    let bucketXlDeps = new aws.s3.BucketObject("lambda-xldeps", {
        bucket: lambdaBucket,
        source: new pulumi.asset.FileAsset("./http/jsxldeps.zip")
    });
    let bucketXxxlDeps = new aws.s3.BucketObject("lambda-xxxldeps", {
        bucket: lambdaBucket,
        source: new pulumi.asset.FileAsset("./http/jsxxxldeps.zip")
    });
    let bucketGo = new aws.s3.BucketObject("lambda-go", {
        bucket: lambdaBucket,
        source: new pulumi.asset.FileAsset("./http/gonoop/main.zip")
    });
    const imageNoop = awsx.ecr.buildAndPushImage("image", {
        context: "./http/dockernoop",
        
    });
    const image100mb = awsx.ecr.buildAndPushImage("image100mb", {
        context: "./http/docker100mb",
    });

    let experiments = [
        { name: 'js', runtime: aws.lambda.NodeJS12dXRuntime, handler: 'index.handler', path: 'jsnoop', bucketKey: undefined, code: undefined, vpcConfig: undefined, environment: undefined },
        { name: 'docker', packageType: "Image", imageUri: imageNoop.imageValue },
        { name: 'docker100', packageType: "Image", imageUri: image100mb.imageValue },
        { name: 'python', runtime: aws.lambda.Python3d8Runtime, handler: 'handler.handler', path: 'pythonnoop' },
        { name: 'cs', runtime: aws.lambda.DotnetCore2d1Runtime, handler: 'app::app.Functions::GetAsync', path: 'csnoop/bin/Release/netcoreapp2.1/publish' },
        {
            name: 'vpc',
            runtime: aws.lambda.NodeJS12dXRuntime,
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
        { name: 'jsxldeps', runtime: aws.lambda.NodeJS12dXRuntime, handler: 'index.handler', bucketKey: bucketXlDeps.key },
        { name: 'jsxxxldeps', runtime: aws.lambda.NodeJS12dXRuntime, handler: 'index.handler', bucketKey: bucketXxxlDeps.key },
        { name: 'java', runtime: aws.lambda.Java11Runtime, handler: 'example.Hello',
        code: new pulumi.asset.AssetArchive({
                "lib/lambda-java-example-1.0-SNAPSHOT.jar": new pulumi.asset.FileAsset("./http/javanoop/target/lambda-java-example-1.0-SNAPSHOT.jar"),
            })
        },
        { name: 'ruby', runtime: aws.lambda.Ruby2d7Runtime, handler: 'lambda_function.lambda_handler', path: 'rubynoop' },
        { name: 'go', runtime: aws.lambda.Go1dxRuntime, handler: 'main', bucketKey: bucketGo.key },
    ];

    let lambdas =
        experiments.map(exp => {
        return [128, 256, 512, 1024, 2048, 4096, 8192].map(memory => {
                let name = memory == 128 ? `${exp.name}cold-lambda` : `${exp.name}cold-lambda-${memory}`;

                let lambda = new aws.lambda.Function(name, {
                    runtime: exp.runtime,
                    code: exp.code || (exp.path ? new pulumi.asset.AssetArchive({ ".": new pulumi.asset.FileArchive(`./http/${exp.path}`) }) : undefined),
                    s3Bucket: exp.bucketKey ? lambdaBucket.bucket : undefined,
                    s3Key: exp.bucketKey,
                    timeout: 30,
                    handler: exp.handler,
                    role: role.arn,
                    memorySize: memory,
                    vpcConfig: exp.vpcConfig,
                    environment: exp.environment,
                    packageType: exp.packageType,
                    imageUri: exp.imageUri,
                    tags: {
                        Owner: "mikhailshilkov",
                    },
                }, { dependsOn: exp.vpcConfig ? [fullAccessLambda, vpcAccessLambda] : [fullAccessLambda] });

                return {
                    code: `${exp.name}${memory}`,
                    lambda,
                    path: `${exp.name}cold${memory}`
                };
            })
        }).reduce((x,y) => x.concat(y), []);

    const api = new awsx.apigateway.API(`http-loadtest`, {
        routes: lambdas.map (i => {
            return <awsx.apigateway.Route>{ method: "GET", path: "/" + i.path, eventHandler: i.lambda };
        }),
        restApiArgs: <any>{
            tags: {
                Owner: "mikhailshilkov",
            },
        },
        stageArgs: {
            tags: {
                Owner: "mikhailshilkov",
            },
        },
    });

    type A = [string, pulumi.Output<string>];
    const items = lambdas.map(l => <A>[l.code, pulumi.interpolate`${api.url}${l.path}`]);
    return Object.assign.apply(null, items.map(([key, val]) => { return { [key]: val } }))
}

export const coldStartEndpoint = pulumi.output(createColdStarts()).apply(v => JSON.stringify(v, undefined, 2));
