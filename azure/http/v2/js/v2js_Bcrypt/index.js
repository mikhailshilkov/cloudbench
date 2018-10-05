var bcrypt = require('bcryptjs');

module.exports = function(context) {
    const randomString = Math.random().toString(36).substring(7);
    var hash = bcrypt.hashSync(randomString, 9);

    context.bindings.res = { 
      status: 200, 
      body: 'AzureFunction_V2_JS_Bcrypt',
      headers: {
            "Content-Type": "text/plain"
      } 
    }; 
    context.done();
};
