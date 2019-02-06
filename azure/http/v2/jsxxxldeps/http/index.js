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

const envInstance = process.env["WEBSITE_INSTANCE_ID"];
const instance = envInstance ? `AZ:${envInstance}` : "LOCAL:LOCAL";

let count = 0;

module.exports = async function(context) {
  count += 1;

  return { 
    status: 200, 
    body: `Azure_JSXXXLDeps_${instance}`,
    headers: {
        "Content-Type": "text/plain",
        "X-CB-Name": "Azure_JSXXXLDeps",
        "X-CB-Count": count,
        "X-CB-Instance": instance
    } 
  }; 
};
