const { Storage } = require("@google-cloud/storage");

const storage = new Storage();

const state = { 
  instanceID: Math.random().toString(36).substring(3)
};

const bucket = storage.bucket("tmp-stackoverflow-blobs");

function downloadString (key) {
  return new Promise((resolve, reject) => {
    bucket
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

function work(durations, response) {
  let id = ids[Math.floor(Math.random() * ids.length)];

  const start = process.hrtime();
  downloadString(id + '.json').then(data => {
    const hrtime = process.hrtime(start);
    const duration = 1000*hrtime[0] + Math.round(hrtime[1] / 1000000);
    durations.push(duration);

    if (durations.length > 100) {
      durations.sort((a, b) => a - b);
      const stats = `Min: ${durations[0]}, Median: ${durations[50]}, P90: ${durations[90]}, P95: ${durations[95]}, Max: ${durations[durations.length - 1]}`;
      response.set('Content-Type', 'text/html')
      response.set('X-CB-Signature', 'GCP_JSBlob_' + state.instanceID);
      response.status(200).send(stats);
    }
    else work(durations, response);
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
          work([], response);
        });
      });
    })
  }
  else {
    work([], response);
  }
};
