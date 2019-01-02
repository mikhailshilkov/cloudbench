module.exports = function(context) {
    setTimeout(() => {
        context.bindings.res = { 
          status: 200, 
          body: 'Azure_JSPause_' + process.env['WEBSITE_INSTANCE_ID'].substring(0, 8),
          headers: {
              "Content-Type": "text/plain"
          } 
        }; 
        context.done();
   }, 100);
};
