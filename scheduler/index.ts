import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as cloud from "@pulumi/cloud";
import * as serverless from "@pulumi/azure-serverless";
import * as r from "request";
import { signedBlobReadUrl } from "../azure/util";

const name = pulumi.getStack();

const config = new pulumi.Config(name);
const appInsightsKey = config.get("appInsightsKey");
if (!appInsightsKey) console.error("AppInsights key not found!");

function ping(request: any, httpAgent: any, client: any, metricName: string, url: string) : Promise<void> {        
    console.log("Sending request to " + url);
      
    const start = process.hrtime();
    return new Promise(function(resolve, reject){
        request({ url: url, pool: httpAgent }, function (error: any, response: r.Response, body: string) {
            if (error) {
                console.log(error);
                client.trackException({ exception: error });
                return resolve(); // still resolve not to fail the container function
            }

            const hrtime = process.hrtime(start);
            const duration = 1000*hrtime[0] + Math.round(hrtime[1] / 1000000);

            try {
                client.trackMetric({name: `CloudBench_${metricName}_${body}`, value: duration}); 
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

// function sendToQueue(queueSvc: any, message: any) {
//     return new Promise(function(resolve, reject){
//         const json = JSON.stringify(message);
//         queueSvc.createMessage(queue.name.get(), Buffer.from(json).toString('base64'), 
//             (error: any, results: any, response: any) => {
//                 if(error){
//                 reject(error);
//                 } else {
//                     console.log("Sent a message " + json);
//                     resolve();
//                 }            
//         });
//     });
// }
cloud.timer.cron("scheduler", "0 */30 * * * *", async () => {
    const http = require("http");
    const httpAgent = new http.Agent({ keepAlive: true });

    const request = require("request");
    const appInsights = require("applicationinsights");
    appInsights.setup(appInsightsKey).setUseDiskRetryCaching(false);
    const client = appInsights.defaultClient;

    function pingCold(url: string) {
        return ping(request, httpAgent, client, "ColdStart", url);
    }

    await pingCold("https://v1js-fad886ed8e.azurewebsites.net/api/v1js");
    await pingCold("https://v1dotnet-faf61b2cf5.azurewebsites.net/api/v1dotnet");
    await pingCold("https://v2js-fab09dff35.azurewebsites.net/api/v2js");
    await pingCold("https://v2dotnet-fa249cdc28.azurewebsites.net/api/v2dotnet");
    await pingCold("https://v2java-facf684788.azurewebsites.net/api/v2java");
});

// interface FireMessage {
//     url: string;
//     parallel: number;
//     times: number;
//     timestamp: string;
// }

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

// const queue = new azure.storage.Queue("fire", {
//     storageAccountName: storageAccount.name,
//     resourceGroupName: resourceGroup.name
// })

// const subscription = serverless.storage.onQueueMessage("firesub", storageAccount, {
//     queueName: queue.name,
//     resourceGroup: resourceGroup,
//     func: async (context, data) => {
//         const http = require("http");
//         const httpAgent = new http.Agent({ keepAlive: true });

//         const request = require("request");
//         const appInsights = require("applicationinsights");
//         appInsights.setup(appInsightsKey).setUseDiskRetryCaching(false);
//         const client = appInsights.defaultClient;
    
//         const text = data.toString('utf8');
//         const message: FireMessage = JSON.parse(text);
//         for (let i = 0; i < message.times; i++) {
//             const promises = new Array(message.parallel).fill(0).map(_ => ping(request, httpAgent, client, "Fire", message.url));
//             await Promise.all(promises);
//         }
//     }
// });

//const topic = new cloud.Topic("fire");
// topic.subscribe("dofire", async (item: FireMessage) => {
//     //for (let i = 0; i < item.times; i++) {
//       //  await ping(item.url);
//    // }
// });



// cloud.timer.cron("fireschedulev2", "*/10 00-10 * * * *", async () => {
//     // + v1dotnet: "https://firev1dotnet-faa5972405.azurewebsites.net/api/v1dotnet"
//     // + v1js    : "https://firev1js-fa999eab36.azurewebsites.net/api/v1js"
//     // + v2dotnet: "https://firev2dotnet-faea395a1f.azurewebsites.net/api/v2dotnet"
//     // + v2java  : "https://firev2java-fa76044f0f.azurewebsites.net/api/v2java"
//     // + v2js    : "https://firev2js-fa0d76b5b4.azurewebsites.net/api/v2js"

//     const storage = require("azure-storage");

//     var queueSvc = storage.createQueueService(storageAccount.primaryConnectionString.get());

//     const hours = new Date().getHours();
//     const minutes = new Date().getMinutes();

//     const message: FireMessage = {
//         url: "https://firev2dotnet-faea395a1f.azurewebsites.net/api/v2dotnet", 
//         parallel: Math.ceil(5 / Math.pow(Math.abs(5.5-minutes), 1.25)),
//         times: 20,
//         timestamp: new Date().toISOString()
//     };
    
//     for (let i = 0; i < hours; i++) {
//         await sendToQueue(queueSvc, message);
//     }
// //    topic.publish();
// });

// cloud.timer.cron("fireschedulev1", "*/10 30-40 * * * *", async () => {
//     const storage = require("azure-storage");

//     var queueSvc = storage.createQueueService(storageAccount.primaryConnectionString.get());

//     const hours = new Date().getHours();
//     const minutes = new Date().getMinutes();

//     const message: FireMessage = {
//         url: "https://firev1dotnet-faa5972405.azurewebsites.net/api/v1dotnet", 
//         parallel: Math.ceil(5 / Math.pow(Math.abs(35.5-minutes), 1.25)),
//         times: 20,
//         timestamp: new Date().toISOString()
//     };
    
//     for (let i = 0; i < hours; i++) {
//         await sendToQueue(queueSvc, message);
//     }
// });

//----------- MONITOR C#

const resourceGroupArgs = {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
};

const appServicePlan = new azure.appservice.Plan("cbcsmonitor", {
    ...resourceGroupArgs,

    kind: "FunctionApp",

    // https://social.msdn.microsoft.com/Forums/azure/en-US/665c365d-2b86-4a77-8cea-72ccffef216c
    sku: {
        tier: "Dynamic",
        size: "Y1",
    },
});

const storageContainer = new azure.storage.Container("cbcsmonitor-c", {
    resourceGroupName: resourceGroup.name,
    storageAccountName: storageAccount.name,
    containerAccessType: "private",
});
        
const blob = new azure.storage.ZipBlob(`${name}-b`, {
    resourceGroupName: resourceGroup.name,
    storageAccountName: storageAccount.name,
    storageContainerName: storageContainer.name,
    type: "block",

    content: new pulumi.asset.FileArchive("../azure/monitor/timer/bin/Debug/netstandard2.0/publish")
});

const codeBlobUrl = signedBlobReadUrl(blob, storageAccount, storageContainer);

const csharpmonitor = new azure.appservice.FunctionApp("cbcsmonitor-fa", {
    ...resourceGroupArgs,

    appServicePlanId: appServicePlan.id,
    storageConnectionString: storageAccount.primaryConnectionString,

    appSettings: {
        "WEBSITE_RUN_FROM_ZIP": codeBlobUrl,
        "FUNCTIONS_EXTENSION_VERSION": "~2",
        "WEBSITE_NODE_DEFAULT_VERSION": "8.11.1",
        "ApplicationInsights:InstrumentationKey": appInsightsKey,
        "APPINSIGHTS_INSTRUMENTATIONKEY": appInsightsKey,
        "TargetUrl": "https://firev2dotnet-faea395a1f.azurewebsites.net/api/v2dotnet"
    },

    version: "beta"
});


//export let endpoint = fn.endpoint;