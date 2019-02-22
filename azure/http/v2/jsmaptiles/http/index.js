const https = require('https');
const Stream = require('stream').Transform;
const Jimp = require('jimp');
const util = require('util');
const envInstance = process.env["WEBSITE_INSTANCE_ID"];
const instance = envInstance ? `AZ:${envInstance}` : "LOCAL:LOCAL";

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


module.exports = async function(context) {
  const isCold = count == 0;
  count += 1;

  const url = 'https://b.tile.openstreetmap.org/' + context.bindingData.path;
  let image = context.bindings.inputBlob;
  if (!image) {
    image = await downloadImage(url);
    context.bindings.outputBlob = image;
  }
  if (isCold) {
    const original = await Jimp.read(image);
    const grey = await original.greyscale();
    const getBufferAsync = util.promisify(grey.getBuffer.bind(grey));
    image = await getBufferAsync(Jimp.MIME_PNG);
  }

  context.res = { 
    status: 200, 
    body: image,
    isRaw: true,
    headers: {
        "Content-Type": "image/png",
        "X-CB-Name": "Azure_JSMapTile",
        "X-CB-Count": count,
        "X-CB-Instance": instance
    } 
  }; 
};
