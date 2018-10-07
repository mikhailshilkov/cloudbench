var bcrypt = require('bcryptjs');

module.exports = function(context) {
    const randomString = Math.random().toString(36).substring(7);
    var hash = bcrypt.hashSync(randomString, 10);

    context.done();
};