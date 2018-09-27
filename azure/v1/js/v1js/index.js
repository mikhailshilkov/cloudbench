module.exports = function(context) {
    context.bindings.res = { 
      status: 200, 
      body: 'AzureFunction_V1_JS',
      headers: {
            "Content-Type": "text/plain"
      } 
    }; 
    context.done();
};
