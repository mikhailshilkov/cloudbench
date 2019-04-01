import * as aws from "@pulumi/aws";

var s3 = new aws.sdk.S3();
    
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
  
let endpoint = new aws.apigateway.x.API("hello-world", {
    routes: [{
        path: "/{route+}",
        method: "GET",
        eventHandler: async (event) => {
            let route = event.pathParameters["route"];           
            let image = await downloadS3(route);
        
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