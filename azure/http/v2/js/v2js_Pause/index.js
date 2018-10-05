module.exports = function(context) {
    setTimeout(() => {
        context.bindings.res = { 
          status: 200, 
          body: 'AzureFunction_V2_JS_Pause',
          headers: {
              "Content-Type": "text/plain"
          } 
        }; 
        context.done();
   }, 100);
};
