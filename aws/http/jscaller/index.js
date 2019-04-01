const aws = require('aws-sdk');

const lambda = new aws.Lambda();

exports.handler = async (event) => {
  const lambdaParams = {
    FunctionName: 'jscold-lambda-256-86815c2',
    InvocationType: 'RequestResponse',
    LogType: 'None',
    Payload: JSON.stringify({ something: 'anything' })
  };

  const start = process.hrtime();

  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();
  await lambda.invoke(lambdaParams).promise();

  const lambdaResult = await lambda.invoke(lambdaParams).promise();

  const hrtime = process.hrtime(start);
  const duration = 1000*hrtime[0] + Math.round(hrtime[1] / 1000000);

  const resultObject = JSON.parse(lambdaResult.Payload)    
  resultObject.duration = duration;

  return {
    statusCode: 200,
    body: resultObject
  };
};