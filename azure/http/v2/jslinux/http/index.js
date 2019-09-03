const envInstance = process.env["WEBSITE_INSTANCE_ID"];
const randInstance = `RAND:${Math.random().toString(36).substring(3)}`;
const instance = envInstance || randInstance;

let count = 0;

module.exports = async function(context) {
  count += 1;

  return { 
    status: 200, 
    body: `Azure_JSLinux_${instance}`,
    headers: {
        "Content-Type": "text/plain",
        "X-CB-Name": "Azure_JSLinux",
        "X-CB-Count": count,
        "X-CB-Instance": instance
    } 
  }; 
};
