const STORAGE_ACCOUNT_NAME = "cbazuresa181163d0";
const ACCESS_KEY = "jzVugXzm5wKa4HST1SL3aayehdJqBdeWSyhkc4srfazKdwEAGF4h2x6JE/OMW5FPeOgwVYlH7fsu9v8WgA3/+Q==";
const containerName = "samples";

// const {
//     Aborter,
//     BlockBlobURL,
//     ContainerURL,
//     ServiceURL,
//     SharedKeyCredential,
//     StorageURL
// } = require('@azure/storage-blob');


// const credentials = new SharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCESS_KEY);
// const pipeline = StorageURL.newPipeline(credentials);
// const serviceURL = new ServiceURL(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`, pipeline);

// const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);

// const aborter = Aborter.timeout(30 * 60 * 1000);

// async function streamToString(readableStream) {
//   return new Promise((resolve, reject) => {
//     const chunks = [];
//     readableStream.on("data", data => {
//       chunks.push(data.toString());
//     });
//     readableStream.on("end", () => {
//       resolve(chunks.join(""));
//     });
//     readableStream.on("error", reject);
//   });
// }

// async function downloadString(name) {
//     const templateURL = BlockBlobURL.fromContainerURL(containerURL, name);
//     const downloadResponse = await templateURL.download(aborter, 0);
//     return await streamToString(downloadResponse.readableStreamBody);
// } 

var azure = require('azure-storage');
var blobService = azure.createBlobService(STORAGE_ACCOUNT_NAME, ACCESS_KEY);

async function downloadString(name) {
  return new Promise((resolve, reject) => {
    blobService.getBlobToText(containerName, name, function(error, text){
      if(error){
          reject(error);
      } else {
         resolve(text);
      }
    });
    
  });
}

let qparts;
let aparts;
let ids;

module.exports = async function(context) {
    
  const instanceID = (process.env['WEBSITE_INSTANCE_ID'] || 'localinstance').substring(0, 10);
  let cold = '';

  if (!ids) {
    let qtemplate = await downloadString('question.html');
    let titleParts = qtemplate.split('%TITLE%');
    let questionParts = titleParts[1].split('%QUESTION%');
    let answersParts = questionParts[1].split('%ANSWERS%');
    qparts = [titleParts[0], questionParts[0], answersParts[0], answersParts[1]];

    let atemplate = await downloadString('answers.html');
    aparts = atemplate.split('%TEXT%');

    let idsString = await downloadString('ids.json');
    ids = idsString.split(',');

    cold = '_Cold';
  }
  

  const durations = [];
  for (let i = 0; i < 100; i++) {
    const start = process.hrtime();
    let id = ids[Math.floor(Math.random() * ids.length)];
    await downloadString(id + '.json');
    const hrtime = process.hrtime(start);
    const duration = 1000*hrtime[0] + Math.round(hrtime[1] / 1000000);
    durations.push(duration);
  }
  
  durations.sort((a, b) => a - b);
  const stats = `Min: ${durations[0]}, Median: ${durations[50]}, P90: ${durations[90]}, P95: ${durations[95]}, Max: ${durations[durations.length - 1]}`;

  return { 
    status: 200, 
    body: stats,
    headers: {
        "Content-Type": "text/html",
        "X-CB-Signature": 'Azure_JSBlob_' + instanceID + cold
    } 
  }; 
};