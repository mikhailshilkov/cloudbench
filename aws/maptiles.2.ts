import * as https from 'https';
import * as aws from "@pulumi/aws";

var s3 = new aws.sdk.S3();
    
async function downloadHttp(url: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, _) => {
    https.request(url, response => {                                        
        var chunks: Buffer[] = [];

        response.on('data', function(chunk) {                                       
            chunks.push(<Buffer>chunk);                                                         
        });                                                                         

        response.on('end', function() {                                             
            resolve(Buffer.concat(chunks));
        });                                                                         
        }).end();
  });
}

let bucket = new aws.s3.Bucket("maptiles", {});

function downloadS3 (key: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    var params = {
        Bucket: bucket.bucket.get(),
        Key: key
    };
    s3.getObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else if (!data.Body) {
        reject('No body');
      }
      else {
        const image = (<Buffer>data.Body).toString('base64');
        resolve(image);
      };
    });
  });
}

function uploadS3 (key: string, contents: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket.bucket.get(),
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
  
let endpoint = new aws.apigateway.x.API("hello-world", {
    routes: [{
        path: "/{route+}",
        method: "GET",
        eventHandler: async (event) => {
            let route = event.pathParameters["route"];
            
            const url = `https://b.tile.openstreetmap.org/${route}`;
            let image = await downloadS3(route);
            if (!image) {
              const binary = await downloadHttp(url);
              //await uploadS3(route, binary);
              image = binary.toString('base64');
            }
        
            return <aws.apigateway.x.Response>{
                statusCode: 200,
                body: image,
                isBase64Encoded: true,
                headers: {
                    "Content-Type": "image/png",
                }        
            };
        },
    }],
});

export const tilesUrl = endpoint.url;