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

const instance = `RAND:${Math.random().toString(36).substring(3)}`;
const memory = process.env.FUNCTION_MEMORY_MB;
let count = 0;

    
exports.handler = (request, response) => {
  count += 1;

  response
    .status(200)
    .set('Content-Type', 'text/plain')
    .set('X-CB-Name', `GCP_JSXXXLDeps_${memory}`)
    .set('X-CB-Count', count)
    .set('X-CB-Instance', instance)
    .send(`GCP_JSXXXLDeps_${memory}_${instance}`);
};
