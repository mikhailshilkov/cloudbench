var bcrypt = require('bcryptjs');

const fs = require("fs");
var buf = fs.readFileSync("/proc/self/cgroup", "utf8").toString();
buf = buf.split("\n");
buf = buf[buf.length - 3];
buf = buf.split("/");

const state = { 
  instanceID: Math.random().toString(36).substring(3),
  r_id: buf[1],
  c_id: buf[2]
};

exports.handler = (event, context, callback) => {
    console.log(`[STATE]${JSON.stringify(state)}[ENDSTATE]`);

    const randomString = Math.random().toString(36).substring(7);
    var hash = bcrypt.hashSync(randomString, 9);

    const response = {
        statusCode: 200,
        body: `AWS_JSBcrypt_${state.instanceID}`
    };
    callback(null, response);
};
