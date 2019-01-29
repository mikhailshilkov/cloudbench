require('aws-sdk');
require('fb');
require('googleapis');
require('lodash');
require('mongodb');
require('neo4j');
require('request');
require('request-promise');

const envInstance = process.env["WEBSITE_INSTANCE_ID"];
const instance = envInstance ? `AZ:${envInstance}` : "LOCAL:LOCAL";

let count = 0;

module.exports = async function(context) {
  count += 1;

  return { 
    status: 200, 
    body: `Azure_JSXLDeps_${instance}`,
    headers: {
        "Content-Type": "text/plain",
        "X-CB-Name": "Azure_JSXLDeps",
        "X-CB-Count": count,
        "X-CB-Instance": instance
    } 
  }; 
};
