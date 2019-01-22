var AWS = require('aws-sdk')
var s3 = new AWS.S3();

const fs = require("fs");
var buf = fs.readFileSync("/proc/self/cgroup", "utf8").toString();
buf = buf.split("\n");
buf = buf[buf.length - 3];
buf = buf.split("/");

const state = { 
  instanceID: Math.random().toString(36).substring(3),
  r_id: buf[1],
  c_id: buf[2]
};

function downloadString (key) {
  return new Promise((resolve, reject) => {
    var params = {
        Bucket: 'tmp-cloudbench-bucket',
        Key: key
    };
    s3.getObject(params, function (err, data) {
      if (err) {
        reject(err);
      }
      else {
        resolve(data.Body.toString('utf-8'));
      };
    });
  });
}

let qtemplate;
let atemplate;
let idsString;

exports.handler = async (event) => {
  if (!idsString) {
    qtemplate = await downloadString('question.html');
    atemplate = await downloadString('answers.html');
    idsString = await downloadString('ids.json');
  }

  const ids = idsString.split(',');
  
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
  
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
      "X-CB-Signature": `AWS_JSBlob_${state.instanceID}`
    },
    body: stats
  };
  return response;
};
