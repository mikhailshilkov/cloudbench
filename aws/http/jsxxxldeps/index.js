require('aws-sdk');
require('babel-core');
require('body-parser');
require('chalk');
require('cheerio');
require('classnames');
require('commander');
require('express');
require('fb');
require('glob');
require('googleapis');
require('imagemagick');
require('jquery');
require('mongodb');
require('neo4j');
require('node-uuid');
require('react');
require('react-dom');
require('redis');
require('redux');
require('request');
require('request-promise');
require('serverless');
require('sinon');
require('socket.io');
require('underscore');
require('webpack');
require('yeoman-generator');

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
        body: `AWS_JSXXXLDeps_${role}${memory}_${instance}`,
        headers: {
            "Content-Type": "text/plain",
            "X-CB-Name": `AWS_JSXXXLDeps_${role}${memory}`,
            "X-CB-Memory": memory,
            "X-CB-Count": count,
            "X-CB-Instance": instance
        },
    };
};