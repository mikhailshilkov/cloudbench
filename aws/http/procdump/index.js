const fs = require("fs");
var buf = fs.readFileSync("/proc/version", "utf8").toString();

exports.handler = async (event) => {    
    return {
        statusCode: 200,
        body: buf
    };
};