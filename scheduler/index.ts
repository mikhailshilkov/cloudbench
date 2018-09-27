import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as cloud from "@pulumi/cloud";
import * as r from "request";

const name = pulumi.getStack();

const config = new pulumi.Config(name);
const appInsightsKey = config.get("appInsightsKey");
if (!appInsightsKey) console.error("AppInsights key not found!");

function ping(url: string) : Promise<void> {
    const request = require("request");
    const appInsights = require("applicationinsights");
    appInsights.setup(appInsightsKey).setUseDiskRetryCaching(false);
    const client = appInsights.defaultClient;
        
    console.log("Sending request to " + url);
      
    const start = process.hrtime();
    return new Promise(function(resolve, reject){
        request(url, function (error: any, response: r.Response, body: string) {
            if (error) {
                console.log(error);
                return reject(error);
            }

            const hrtime = process.hrtime(start);
            const duration = 1000*hrtime[0] + Math.round(hrtime[1] / 1000000);

            try {
                client.trackMetric({name: `CloudBench_Azure_${body}`, value: duration}); 
                client.flush({callback: () =>{
                    console.log(`Tracked ${body} in ${duration}ms`);
                    resolve();
                }});
            } catch (err) {
                console.log(err);
                reject(err);
            }
        });
    });
}
cloud.timer.cron("scheduler", "0 */30 * * * *", async () => {
    await ping("https://v1js-fad886ed8e.azurewebsites.net/api/v1js");
    await ping("https://v1dotnet-faf61b2cf5.azurewebsites.net/api/v1dotnet");
    await ping("https://v2js-fab09dff35.azurewebsites.net/api/v2js");
    await ping("https://v2dotnet-fa249cdc28.azurewebsites.net/api/v2dotnet");
    await ping ("https://v2java-facf684788.azurewebsites.net/api/v2java");
});

const resourceGroup = new azure.core.ResourceGroup("cloudbench", {
    location: "West Europe",
});

// Create a storage account for our images
const storageAccount = new azure.storage.Account("cloudbenchsa", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    accountReplicationType: "LRS",
    accountTier: "Standard",
});

//export let endpoint = fn.endpoint;