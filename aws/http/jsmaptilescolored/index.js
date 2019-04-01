const https = require('https');
const Stream = require('stream').Transform;
const Jimp = require('jimp');
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

const step = Math.random() * 20;
function rainbow() {
  var r, g, b;
  var h = step / 20;
  var i = ~~(h * 6);
  var f = h * 6 - i;
  var q = 1 - f;
  switch(i % 6){
      case 0: r = 1; g = f; b = 0; break;
      case 1: r = q; g = 1; b = 0; break;
      case 2: r = 0; g = 1; b = f; break;
      case 3: r = 0; g = q; b = 1; break;
      case 4: r = f; g = 0; b = 1; break;
      case 5: r = 1; g = 0; b = q; break;
  }
  var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
  return (c);
}
const color = rainbow();

exports.handler = async (event) => {
    count += 1;

    let route = event.pathParameters["route"];

    let image = await downloadS3(route);
    if (!image) {
      const url = `https://b.tile.openstreetmap.org/${route}`;
      image = await downloadImage(url);
      await uploadS3(route, image);
    }

    const original = await Jimp.read(image);
    //const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    let processed = await original.color([{ apply: 'mix', params: [color, 30] }])
    //processed = await processed.print(font, 100, 10, instance.substring(4));
    //processed = await processed.print(font, 100, 220, instance.substring(4));
  
    const getBufferAsync = util.promisify(processed.getBuffer.bind(processed));
    image = await getBufferAsync(Jimp.MIME_PNG);  
    
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
