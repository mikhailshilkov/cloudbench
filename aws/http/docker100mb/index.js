const fs = require("fs");
var cgroup = fs.readFileSync("/proc/self/cgroup", "utf8").toString();
var bufs = cgroup.split("\n");
var buf = bufs.filter(v => v.indexOf("/sandbox-root-") >= 0)[0];
buf = buf.split("/")[1];

const instance = `AWS:${buf.substring(13)}`;
const memory = process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE;
const role = process.env.CLOUDBENCH_ROLE || '';
let count = 0;

exports.handler = async (event) => {
    count += 1;
    
    return {
        statusCode: 200,
        body: `AWS_Docker100MB_${role}${memory}_${instance}`,
        headers: {
            "Content-Type": "text/plain",
            "X-CB-Name": `AWS_Docker100MB_${role}${memory}`,
            "X-CB-Memory": memory,
            "X-CB-Count": count,
            "X-CB-Instance": instance
        },
    };  
};