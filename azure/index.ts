import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { FunctionApp } from "./functionApp";

const name = pulumi.getStack();

const resourceGroup = new azure.core.ResourceGroup(`${name}-rg`, {
        location: "West Europe",
    });

const resourceGroupArgs = {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
};

const storageAccount = new azure.storage.Account(`${name}sa`, {
    ...resourceGroupArgs,

    accountKind: "StorageV2",
    accountTier: "Standard",
    accountReplicationType: "LRS",
});

const storageContainer = new azure.storage.Container(`${name}-c`, {
    resourceGroupName: resourceGroup.name,
    storageAccountName: storageAccount.name,
    containerAccessType: "private",
});

const appInsights = new azure.appinsights.Insights(`${name}-ai`, {
    resourceGroupName: resourceGroup.name,
    applicationType: 'Web',
    location: "West Europe"
});

const jspause = new FunctionApp(`${name}-jspause`, {
    resourceGroup,
    storageAccount,
    storageContainer,
    appInsights,
    path: "http/v2/jspause",
    version: "~2"
});

const jsbcrypt = new FunctionApp(`${name}-jsbcrypt`, {
    resourceGroup,
    storageAccount,
    storageContainer,
    appInsights,
    path: "http/v2/jsbcrypt",
    version: "~2"
});

const jsblob = new FunctionApp(`${name}-jsblob`, {
    resourceGroup,
    storageAccount,
    storageContainer,
    appInsights,
    path: "http/v2/jsblob",
    version: "~2"
});

const jsblobnet = new FunctionApp(`${name}-jsblobnet`, {
    resourceGroup,
    storageAccount,
    storageContainer,
    appInsights,
    path: "http/v2/dotnet/bin/debug/netcoreapp2.1/publish",
    version: "~2"
});

export const storage = storageAccount.primaryConnectionString;
export const jspauseUrl = jspause.url;
export const jsbcryptUrl = jsbcrypt.url;
export const jsblobUrl = jsblob.url;
export const jsblobnetUrl = jsblobnet.url;