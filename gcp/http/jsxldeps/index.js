require('aws-sdk');
require('fb');
require('googleapis');
require('lodash');
require('mongodb');
require('neo4j');
require('request');
require('request-promise');

const instance = `RAND:${Math.random().toString(36).substring(3)}`;
const memory = process.env.FUNCTION_MEMORY_MB;
let count = 0;

    
exports.handler = (request, response) => {
  count += 1;

  response
    .status(200)
    .set('Content-Type', 'text/plain')
    .set('X-CB-Name', `GCP_JSXLDeps_${memory}`)
    .set('X-CB-Count', count)
    .set('X-CB-Instance', instance)
    .send(`GCP_JSXLDeps_${memory}_${instance}`);
};
