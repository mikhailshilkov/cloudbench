var bcrypt = require('bcryptjs');

module.exports = function(context) {
    const randomString = Math.random().toString(36).substring(7);
    var hash = bcrypt.hashSync(randomString, 9);

    context.bindings.res = { 
      status: 200, 
      body: 'Azure_JSBcrypt_' + process.env['WEBSITE_INSTANCE_ID'].substring(0, 8),
      headers: {
            "Content-Type": "text/plain"
      } 
    }; 
    context.done();
};
