module.exports = function(context) {
    setTimeout(() => {
        context.bindings.res = { 
          status: 200, 
          body: 'AzureFunction_V1_JS_Pause',
          headers: {
              "Content-Type": "text/plain"
          } 
        }; 
        context.done();
   }, 100);
};
