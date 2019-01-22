import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { signedBlobReadUrl } from "../azure/util";
import { FunctionApp } from "../azure/functionApp";

const name = pulumi.getStack().substring(0, 8);

const config = new pulumi.Config("cloudbench-scheduler");//name);

const resourceGroup = new azure.core.ResourceGroup("cloudbench", {
    location: "North Europe",
});

const appInsights = new azure.appinsights.Insights(`cloudbench-ai`, {
    resourceGroupName: resourceGroup.name,
    applicationType: 'Web',
    location: "North Europe"
});

const appInsightsKey = appInsights.instrumentationKey;

//----------- MONITOR C#

const resourceGroupMonitor = new azure.core.ResourceGroup("cbmonitorrg", {
    location: "North Europe",
});

const resourceGroupArgs = {
    resourceGroupName: resourceGroupMonitor.name,
    location: resourceGroupMonitor.location,
};

// Create a storage account for our images
const storageAccount = new azure.storage.Account("cbmonitorsa", {
    ...resourceGroupArgs,
    accountReplicationType: "LRS",
    accountTier: "Standard",
});

const appServicePlan = new azure.appservice.Plan("cbcsmonitor", {
    ...resourceGroupArgs,

    kind: "FunctionApp",

    sku: {
        tier: "Dynamic",
        size: "Y1",
    },
});

const storageContainer = new azure.storage.Container("cbcsmonitor-c", {
    resourceGroupName: resourceGroupMonitor.name,
    storageAccountName: storageAccount.name,
    containerAccessType: "private",
});
        
const blob = new azure.storage.ZipBlob(`${name}-b`, {
    resourceGroupName: resourceGroupMonitor.name,
    storageAccountName: storageAccount.name,
    storageContainerName: storageContainer.name,
    type: "block",

    content: new pulumi.asset.FileArchive("../azure/monitor/timer/bin/Debug/netstandard2.0/publish")
});

const codeBlobUrl = signedBlobReadUrl(blob, storageAccount, storageContainer);

const urls = [
    // "https://4j8c68lsx6.execute-api.eu-central-1.amazonaws.com/stage/pause",
    // "https://4j8c68lsx6.execute-api.eu-central-1.amazonaws.com/stage/bcrypt",
    //"https://4j8c68lsx6.execute-api.eu-central-1.amazonaws.com/stage/blob",
    // "https://us-central1-cloudbench-221016.cloudfunctions.net/cloudbench-gcp-pause-func-fab8dec",
    // "https://us-central1-cloudbench-221016.cloudfunctions.net/cloudbench-gcp-bcrypt-func-28577e8",
    //"https://cbazure-jspause-fa98563d9f.azurewebsites.net/api/v2js_Pause",
    //"https://cbazure-jsbcrypt-fa2f48fa29.azurewebsites.net/api/v2js_Bcrypt",
    "https://cbazure-jsblob-fafb96dd97.azurewebsites.net/api/Html",
    //"https://cbazure-jsblobnet-fa54b0482b.azurewebsites.net/api/v2dotnetbblob",
    //"https://us-central1-cloudbench-221016.cloudfunctions.net/cloudbench-gcp-blob-func-f315077"
];

function addMonitor(minute: number, name?: string) { 
    new azure.appservice.FunctionApp(`cbcsmonitor-fa${name || minute.toString()}`, {
        ...resourceGroupArgs,

        appServicePlanId: appServicePlan.id,
        storageConnectionString: storageAccount.primaryConnectionString,

        appSettings: {
            "WEBSITE_RUN_FROM_ZIP": codeBlobUrl,
            "FUNCTIONS_EXTENSION_VERSION": "~2",
            "WEBSITE_NODE_DEFAULT_VERSION": "8.11.1",
            "ApplicationInsights:InstrumentationKey": appInsightsKey,
            "APPINSIGHTS_INSTRUMENTATIONKEY": appInsightsKey,
            "Schedule": `0 5${minute%10} 9 31 * *`,
            "LinearK": "25",
            "QuadraticK": "0",
            "TargetUrl": urls.join(",")
        },

        version: "~2"
    });
}

for (let i = 0; i < 40; i++) {
    addMonitor(i);    
}

// SCHEDULER DURABLE APP
const durable = new FunctionApp(`cbscheduler-durable`, {
    resourceGroup: resourceGroupMonitor,
    storageAccount,
    storageContainer,
    appInsights,
    path: "app/CloudBenchFlow/bin/Debug/netcoreapp2.1/",
    version: "~2"
});

export const appUrl = durable.url;