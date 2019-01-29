require('aws-sdk');
require('fb');
require('googleapis');
require('lodash');
require('mongodb');
require('neo4j');
require('request');
require('request-promise');

const fs = require("fs");
var buf = fs.readFileSync("/proc/self/cgroup", "utf8").toString();
buf = buf.split("\n");
buf = buf[buf.length - 3];
buf = buf.split("/");

const instance = `AWS:${buf[1].substring(13)}`;
const memory = process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE;
const role = process.env.CLOUDBENCH_ROLE || '';
let count = 0;

exports.handler = async (event) => {
    count += 1;
    
    return {
        statusCode: 200,
        body: `AWS_JSXLDeps_${role}${memory}_${instance}`,
        headers: {
            "Content-Type": "text/plain",
            "X-CB-Name": `AWS_JSXLDeps_${role}${memory}`,
            "X-CB-Memory": memory,
            "X-CB-Count": count,
            "X-CB-Instance": instance
        },
    };
};