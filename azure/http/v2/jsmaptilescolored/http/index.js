const https = require('https');
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

function delay(start) {
  const hrtime = process.hrtime(start);
  return 1000*hrtime[0] + Math.round(hrtime[1] / 1000000);
}

module.exports = async function(context) {
  count += 1;

  const url = 'https://b.tile.openstreetmap.org/' + context.bindingData.path;
  let image = context.bindings.inputBlob;
  if (!image) {
    image = await downloadImage(url);
    context.bindings.outputBlob = image;
  }
  const start = process.hrtime();

  const original = await Jimp.read(image);
  const duration1 = delay(start);

  let processed = await original.color([{ apply: 'mix', params: [color, 30] }])
  const duration2 = delay(start);

  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
  processed = await processed.print(font, 100, 10, instance.substring(3, 13));
  processed = await processed.print(font, 100, 220, instance.substring(3, 13));

  const getBufferAsync = util.promisify(processed.getBuffer.bind(processed));
  image = await getBufferAsync(Jimp.MIME_PNG);
  const duration3 = delay(start);

  context.res = { 
    status: 200, 
    body: image,
    isRaw: true,
    headers: {
        "Content-Type": "image/png",
        "X-CB-Name": "Azure_JSMapTile",
        "X-CB-Count": count,
        "X-CB-Instance": instance,
        "X-CB-Delay": `${duration1}-${duration2}-${duration3}`
    } 
  }; 
};
