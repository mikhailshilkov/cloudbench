const STORAGE_ACCOUNT_NAME = "cbazuresa181163d0";
const ACCESS_KEY = "TODO";
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
  
  let id = ids[Math.floor(Math.random() * ids.length)];

  let data = await downloadString(id + '.json');
  const json = JSON.parse(data);

  const answers = json.answers.map(a => aparts[0] + a + aparts[1]).join('');
  const html = qparts[0] + json.title + qparts[1] + json.text + qparts[2] + answers + qparts[3];
  
  return { 
    status: 200, 
    body: html,
    headers: {
        "Content-Type": "text/html",
        "X-CB-Signature": 'Azure_JSBlob_' + instanceID + cold
    } 
  }; 
};
