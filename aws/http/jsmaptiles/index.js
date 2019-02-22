const https = require('https');
const Stream = require('stream').Transform;
const Jimp = require('jimp');
const util = require('util');
const fs = require("fs");

var buf = fs.readFileSync("/proc/self/cgroup", "utf8").toString();
buf = buf.split("\n");
buf = buf[buf.length - 3];
buf = buf.split("/");

const instance = `AWS:${buf[1].substring(13)}`;
const memory = process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE;
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

exports.handler = async (event) => {
    const isCold = count == 0;
    count += 1;

    const url = 'https://b.tile.openstreetmap.org/5/6/7.png';
    let image = null;
    if (!image) {
      image = await downloadImage(url);
      //context.bindings.outputBlob = image;
    }
    if (isCold) {
      const original = await Jimp.read(image);
      const grey = await original.greyscale();
      const getBufferAsync = util.promisify(grey.getBuffer.bind(grey));
      image = await getBufferAsync(Jimp.MIME_PNG);
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
