const envInstance = process.env["WEBSITE_INSTANCE_ID"];
const instance = envInstance ? `AZ:${envInstance}` : "LOCAL:LOCAL";

let count = 0;

module.exports = function(context) {
    count += 1;

    context.bindings.res = { 
      status: 200, 
      body: `AzureV1_JSNoop_${instance}`,
      headers: {
          "Content-Type": "text/plain",
          "X-CB-Name": "AzureV1_JSNoop",
          "X-CB-Count": count,
          "X-CB-Instance": instance
      } 
    }; 
    context.done();
};

