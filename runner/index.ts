import * as azure from "@pulumi/azure";
import { FunctionApp } from "./functionApp";

const resourceGroup = new azure.core.ResourceGroup("cbrunner", {
    location: "North Europe",
});

const resourceGroupArgs = {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
};

const storageAccount = new azure.storage.Account("cbrunnersa", {
    ...resourceGroupArgs,

    accountKind: "StorageV2",
    accountTier: "Standard",
    accountReplicationType: "LRS",
});

const app = new FunctionApp("cbrunnerapp", {
    resourceGroup,
    storageAccount,
    version: "~2",
    runtime: "dotnet"
});


export const appname = app.name;