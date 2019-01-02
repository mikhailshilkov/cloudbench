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
  
  let id = ids[Math.floor(Math.random() * ids.length)];

  const data = await downloadString(id + '.json');
  const json = JSON.parse(data);

  const answers = json.answers.map(a => atemplate.replace('%TEXT%', a)).join('');
  const html = qtemplate.replace('%TITLE%', json.title).replace('%QUESTION%', json.text).replace('%ANSWERS%', answers);
  
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
      "X-CB-Signature": `AWS_JSBlob_${state.instanceID}`
    },
    body: html
  };
  return response;
};
