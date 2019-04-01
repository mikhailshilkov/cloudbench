const https = require('https');
const { Storage } = require("@google-cloud/storage");
const Jimp = require('jimp');

const storage = new Storage();

const instance = `RAND:${Math.random().toString(36).substring(3)}`;
const memory = process.env.FUNCTION_MEMORY_MB;
let count = 0;

function downloadImage(url) {
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

const bucket = storage.bucket(process.env.STORAGE_BUCKET || "tmp-stackoverflow-blobs");

function downloadFile (key) {
  return new Promise((resolve, reject) => {
    bucket
      .file(key)
      .download(function(err, contents) {
        if (err) {
          reject(err);
        }
        else {
          resolve(contents);
        };
      });
  });
}

function uploadFile (key, contents) {
  return new Promise((resolve, reject) => {
    const fileUpload = bucket.file(key);

    const uploadStream = fileUpload.createWriteStream({
        metadata: {
            contentType: "image/png"
        }
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', resolve);
    uploadStream.end(contents);
  });
}

function getBuffer (image) {
  return new Promise((resolve, reject) => {
    image.getBuffer(Jimp.MIME_PNG, (error, result) => {
      if (error) reject(error)
      else resolve(result);
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
    
exports.handler = (request, response) => {
  count += 1;

  const url = 'https://b.tile.openstreetmap.org/' + request.path;

  downloadFile(request.path).then(data => data, _ => 
    downloadImage(url).then(image => uploadFile(request.path, image).then(_ => image))
  )
  .then(Jimp.read)
  .then(original => original.color([{ apply: 'mix', params: [color, 30] }]))
  .then(original => 
    Jimp.loadFont(Jimp.FONT_SANS_16_BLACK)
    .then(font => {
      let o1 = original.print(font, 80, 10, instance.substring(5, 14));
      return o1.print(font, 80, 220, instance.substring(5, 14))
    }))
  .then(getBuffer)
  .then(image => {
    response
      .status(200)
      .set('Content-Type', 'image/png')
      .set('X-CB-Name', 'GCP_JSMapTiles')
      .set('X-CB-Count', count)
      .set('X-CB-Instance', instance)
      .send(image);
  });
};
