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

const runAsPackageContainer = new azure.storage.Container(`${name}-c`, {
    resourceGroupName: resourceGroup.name,
    storageAccountName: storageAccount.name,
    containerAccessType: "private",
});

const appInsights = new azure.appinsights.Insights(`${name}-ai`, {
    resourceGroupName: resourceGroup.name,
    applicationType: 'Web',
    location: "West Europe"
});

const createColdStarts = (prefix: string) => {
    const v2js = new FunctionApp(`${prefix}-v2js`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        appInsights,
        path: "http/v2/jsnoop",
        version: "~2",
        runtime: "node"
    });

    const v2jsxl = new FunctionApp(`${prefix}-v2jsxl`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        appInsights,
        path: "http/v2/jsxldeps",
        version: "~2",
        runtime: "node"
    });

    const v2jsxxxl = new FunctionApp(`${prefix}-v2jsxxxl`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        appInsights,
        path: "http/v2/jsxxxldeps",
        version: "~2",
        runtime: "node"
    });

    const v2cs = new FunctionApp(`${prefix}-v2cs`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        appInsights,
        path: "http/v2/csnoop/bin/Debug/netcoreapp2.1",
        version: "~2",
        runtime: "dotnet"
    });

    const java = new FunctionApp(`${prefix}-java`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        appInsights,
        path: "http/v2/javanoop/target/azure-functions/v2java",
        version: "~2",
        runtime: "java"
    });

    const v1js = new FunctionApp(`${prefix}-v1js`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        appInsights,
        path: "http/v1/jsnoop",
        version: "~1",
        runtime: "node"
    });

    const v1cs = new FunctionApp(`${prefix}-v1cs`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        appInsights,
        path: "http/v1/csnoop/bin/Debug/net461",
        version: "~1",
        runtime: "dotnet"
    });

    return {
        v2js: v2js.url.apply(url => url + "http"),
        v2jsxl: v2jsxl.url.apply(url => url + "http"),
        v2jsxxl: v2jsxxxl.url.apply(url => url + "http"),
        v2cs: v2cs.url.apply(url => url + "http"),
        java: java.url.apply(url => url + "http"),
        v1js: v1js.url.apply(url => url + "http"),
        v1cs: v1cs.url.apply(url => url + "http"),
    };
}

const linuxResourceGroup = new azure.core.ResourceGroup('cb-linux-rg', {
    location: "West Europe",
});

const linuxStorageAccount = new azure.storage.Account('cblinuxsa', {
    resourceGroupName: linuxResourceGroup.name,
    location: linuxResourceGroup.location,
    accountKind: "StorageV2",
    accountTier: "Standard",
    accountReplicationType: "LRS",
});

export const coldStarts = createColdStarts(`${name}-cold`);
export const linuxResourceGroupName = linuxResourceGroup.name;
export const linuxStorageAccountName = linuxStorageAccount.name;