const { Storage } = require("@google-cloud/storage");

const storage = new Storage();

const state = { 
  instanceID: Math.random().toString(36).substring(3)
};

function downloadString (key) {
  return new Promise((resolve, reject) => {
    storage
      .bucket("tmp-stackoverflow-blobs")
      .file(key)
      .download(function(err, contents) {
        if (err) {
          reject(err);
        }
        else {
          resolve(contents.toString());
        };
      });
  });
}
let qparts;
let aparts;
let ids;

function work(response) {
  let id = ids[Math.floor(Math.random() * ids.length)];

  downloadString(id + '.json').then(data => {
    const json = JSON.parse(data);

    const answers = json.answers.map(a => aparts[0] + a + aparts[1]).join('');
    const html = qparts[0] + json.title + qparts[1] + json.text + qparts[2] + answers + qparts[3];

    response.set('Content-Type', 'text/html')
    response.set('X-CB-Signature', 'GCP_JSBlob_' + state.instanceID);
    response.status(200).send(html);
  });
}

exports.handler = (request, response) => {
  if (!ids) {
    downloadString('question.html').then(qtemplate => {
      let titleParts = qtemplate.split('%TITLE%');
      let questionParts = titleParts[1].split('%QUESTION%');
      let answersParts = questionParts[1].split('%ANSWERS%');
      qparts = [titleParts[0], questionParts[0], answersParts[0], answersParts[1]];

      downloadString('answers.html').then(atemplate => {
        aparts = atemplate.split('%TEXT%');

        downloadString('ids.json').then(idsString => {
          ids = idsString.split(',');
          work(response);
        });
      });
    })
  }
  else {
    work(response);
  }
};
