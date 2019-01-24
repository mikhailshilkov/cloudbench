// let fullAccessS3 = new aws.iam.RolePolicyAttachment("s3-access", {
//     role: role,
//     policyArn: aws.iam.AmazonS3FullAccess,
// });

// // Pause lambda
// let pauseLambda = new aws.lambda.Function("pause-lambda", {
//     runtime: aws.lambda.NodeJS8d10Runtime,
//     code: new asset.AssetArchive({
//         ".": new asset.FileArchive("./http/jspause"),
//     }),
//     timeout: 5,
//     handler: "index.handler",
//     role: role.arn,
//     memorySize: 128
// }, { dependsOn: [fullAccessLambda] });

// // Bcrypt lambda
// let bcryptLambda = new aws.lambda.Function("bcrypt-lambda", {
//     runtime: aws.lambda.NodeJS8d10Runtime,
//     code: new asset.AssetArchive({
//         ".": new asset.FileArchive("./http/jsbcrypt"),
//     }),
//     timeout: 5,
//     handler: "index.handler",
//     role: role.arn,
//     memorySize: 512
// }, { dependsOn: [fullAccessLambda] });

// // Blob lambda
// let blobLambda = new aws.lambda.Function("blob-lambda", {
//     runtime: aws.lambda.NodeJS8d10Runtime,
//     code: new asset.AssetArchive({
//         ".": new asset.FileArchive("./http/jsblobmeasure"),
//     }),
//     timeout: 50,
//     handler: "index.handler",
//     role: role.arn,
//     memorySize: 512
// }, { dependsOn: [fullAccessLambda, fullAccessS3] });