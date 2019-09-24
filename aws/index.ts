import { asset } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {SmartVpc} from './vpc';
import { tilesUrl } from './maptiles';

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
let vpcAccessLambda = new aws.iam.RolePolicyAttachment("lambda-vpc-access", {
    role: role,
    policyArn: aws.iam.AWSLambdaVPCAccessExecutionRole,
});

function createColdStarts() {
    let vpc = new SmartVpc("lambdavpc", {
        baseCidr: "10.0.0.0/16",
        azCount: 2,
        description: "Demo",
        baseTags: {
            Project: "Pulumi VPC"
        }
    });

    let lambdaBucket = new aws.s3.Bucket("lambdas", {});
    let bucketXlDeps = new aws.s3.BucketObject("lambda-xldeps", {
        bucket: lambdaBucket,
        source: new asset.FileAsset("./http/jsxldeps.zip")
    });
    let bucketXxxlDeps = new aws.s3.BucketObject("lambda-xxxldeps", {
        bucket: lambdaBucket,
        source: new asset.FileAsset("./http/jsxxxldeps.zip")
    });
    let bucketGo = new aws.s3.BucketObject("lambda-go", {
        bucket: lambdaBucket,
        source: new asset.FileAsset("./http/gonoop/main.zip")
    });

    let experiments = [
        { name: 'js', runtime: aws.lambda.NodeJS8d10Runtime, handler: 'index.handler', path: 'jsnoop' },
        { name: 'python', runtime: aws.lambda.Python3d6Runtime, handler: 'handler.handler', path: 'pythonnoop' },
        { name: 'cs', runtime: aws.lambda.DotnetCore2d1Runtime, handler: 'app::app.Functions::GetAsync', path: 'csnoop/bin/Release/netcoreapp2.1/publish' },
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
        { name: 'jsxldeps', runtime: aws.lambda.NodeJS8d10Runtime, handler: 'index.handler', bucketKey: bucketXlDeps.key },
        { name: 'jsxxxldeps', runtime: aws.lambda.NodeJS8d10Runtime, handler: 'index.handler', bucketKey: bucketXxxlDeps.key },
        { name: 'java', runtime: aws.lambda.Java8Runtime, handler: 'example.Hello',
        code: new asset.AssetArchive({
                "lib/lambda-java-example-1.0-SNAPSHOT.jar": new asset.FileAsset("./http/javanoop/target/lambda-java-example-1.0-SNAPSHOT.jar"),
            })
        },
        { name: 'ruby', runtime: "ruby2.5", handler: 'lambda_function.lambda_handler', path: 'rubynoop' },
        { name: 'go', runtime: aws.lambda.Go1dxRuntime, handler: 'main', bucketKey: bucketGo.key },
    ];

    let lambdas =
        experiments.map(exp => {
            return [128, 256, 512, 1024, 2048].map(memory => {
                let name = memory == 128 ? `${exp.name}cold-lambda` : `${exp.name}cold-lambda-${memory}`;

                let lambda = new aws.lambda.Function(name, {
                    runtime: exp.runtime,
                    code: exp.code || (exp.path ? new asset.AssetArchive({ ".": new asset.FileArchive(`./http/${exp.path}`) }) : undefined),
                    s3Bucket: exp.bucketKey ? lambdaBucket.bucket : undefined,
                    s3Key: exp.bucketKey,
                    timeout: 30,
                    handler: exp.handler,
                    role: role.arn,
                    memorySize: memory,
                    vpcConfig: exp.vpcConfig,
                    environment: exp.environment
                }, { dependsOn: exp.vpcConfig ? [fullAccessLambda, vpcAccessLambda] : [fullAccessLambda] });

                return {
                    lambda,
                    path: `/${exp.name}cold${memory}`
                };
            })
        }).reduce((x,y) => x.concat(y), []);

    const api = new awsx.apigateway.API(`http-loadtest`, {
        routes: lambdas.map (i => {
            return <awsx.apigateway.Route>{ method: "GET", path: i.path, eventHandler: i.lambda };
        })
    });

    return api.url;
}

function createMapTiles() {
    let bucket = new aws.s3.Bucket("maptiles", {});

    let lambda = new aws.lambda.Function("maptiles", {
        runtime: aws.lambda.NodeJS8d10Runtime,
        code: new asset.AssetArchive({ ".": new asset.FileArchive('./http/jsmaptilescolored') }),
        timeout: 5,
        handler: 'index.handler',
        role: role.arn,
        memorySize: 2048,
        environment: {
            variables:  {
                'S3_BUCKET': bucket.bucket
            }
        }
    }, { dependsOn: [fullAccessLambda] });

    const api = new awsx.apigateway.API(`http-maptiles`, {
        routes: [{ method: "GET", path: '/{route+}', eventHandler: lambda }]
    });

    return api.url;
}
export const coldStartEndpoint = createColdStarts();
//export const mapTileEndpoint = createMapTiles();
//export const mapTiles = tilesUrl;