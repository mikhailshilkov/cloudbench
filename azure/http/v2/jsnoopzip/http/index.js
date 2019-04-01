const envInstance = process.env["WEBSITE_INSTANCE_ID"];
const instance = envInstance ? `AZ:${envInstance}` : "LOCAL:LOCAL";

let count = 0;

module.exports = async function(context) {
  count += 1;

  return { 
    status: 200, 
    body: `Azure_JSExZip_${instance}`,
    headers: {
        "Content-Type": "text/plain",
        "X-CB-Name": "Azure_JSExZip",
        "X-CB-Count": count,
        "X-CB-Instance": instance
    } 
  }; 
};
