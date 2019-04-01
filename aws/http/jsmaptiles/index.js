const https = require('https');
const Stream = require('stream').Transform;
const util = require('util');
const fs = require("fs");
const aws = require("aws-sdk");

const s3 = new aws.S3();

var buf = fs.readFileSync("/proc/self/cgroup", "utf8").toString();
buf = buf.split("\n");
buf = buf[buf.length - 3];
buf = buf.split("/");

const instance = `AWS:${buf[1].substring(13)}`;
const memory = process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE;
const bucket = process.env.S3_BUCKET;
let count = 0;

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.request(url, function(response) {                                        
      var chunks = [];

      response.on('data', function(chunk) {                                       
        chunks.push(chunk);                                                         
      });                                                                         

      response.on('end', function() {                                             
        resolve(Buffer.concat(chunks));
      });                                                                         
    }).end();
  });
}

function downloadS3 (key) {
  return new Promise((resolve, reject) => {
    var params = {
        Bucket: bucket,
        Key: key
    };
    s3.getObject(params, (err, data) => {
      if (err) {
        resolve(null);
      } else if (!data.Body) {
        reject('No body');
      }
      else {
        const image = data.Body;
        resolve(image);
      };
    });
  });
}

function uploadS3 (key, contents) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: contents,
      ContentType: "image/png"
    };
    s3.putObject(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

exports.handler = async (event) => {
    count += 1;

    let route = event.pathParameters["route"];

    let image = await downloadS3(route);
    if (!image) {
      const url = `https://b.tile.openstreetmap.org/${route}`;
      image = await downloadImage(url);
      await uploadS3(route, image);
    }

    return {
        statusCode: 200,
        body: image.toString('base64'),
        isBase64Encoded: true,
        headers: {
            "Content-Type": "image/png",
            "X-CB-Name": `AWS_JSMapTile_${memory}`,
            "X-CB-Memory": memory,
            "X-CB-Count": count,
            "X-CB-Instance": instance
        },
    };
};
