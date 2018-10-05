const Promise = require('bluebird');
const _ = require('lodash');
const aws = require('aws-sdk');

module.exports = function(context) {
    context.bindings.res = { 
      status: 200, 
      body: 'AzureFunction_V2_JSDepsMax',
      headers: {
            "Content-Type": "text/plain"
      } 
    }; 
    context.done();
};                                 
