const appInsightsKey = "905430be-f8c4-4b4f-a0e4-e085ccf9afee";

const appInsights = require("applicationinsights");
appInsights.setup(appInsightsKey).setUseDiskRetryCaching(false);
const client = appInsights.defaultClient;

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
    client.trackEvent({name: "AwsQueueJs", properties: state});

    setTimeout(() => {
        console.log(`Executed ${JSON.stringify(event, null, 2)}`);
        callback(null);
    }, 100);  

    client.flush({callback: () =>{ 
        console.log(`Tracked ${JSON.stringify(state, null, 2)}`);
    }});
};
