const https = require('https');
const { Storage } = require("@google-cloud/storage");

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
     
exports.handler = (request, response) => {
  count += 1;

  const url = 'https://b.tile.openstreetmap.org/' + request.path;

  downloadFile(request.path).then(data => data, _ => 
    downloadImage(url).then(image => uploadFile(request.path, image).then(_ => image))
  )
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
