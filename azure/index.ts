import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { FunctionApp } from "./functionApp";

const name = pulumi.getStack();

const resourceGroup = new azure.core.ResourceGroup(`${name}-rg`, {
    location: "West Europe",
    tags: {
        Owner: "mikhailshilkov"
    },
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
    storageAccountName: storageAccount.name,
    containerAccessType: "private",
});

const appInsights = new azure.appinsights.Insights(`${name}-ai`, {
    resourceGroupName: resourceGroup.name,
    applicationType: "web",
    location: "West Europe"
});

const createColdStarts = (prefix: string) => {
    const nozipjs = new FunctionApp(`${prefix}-nozipjs`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        path: "nozip",
        version: "~3",
        runtime: "node"
    });

    const externaljs = new FunctionApp(`${prefix}-externaljs`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        path: "http/v2/jsnoopzip",
        version: "~3",
        runtime: "node"
    });

    const v2js = new FunctionApp(`${prefix}-v2js`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        //path: "http/v2/jsnoop",
        version: "~3",
        runtime: "node"
    });

    const v2jsxl = new FunctionApp(`${prefix}-v2jsxl`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        //path: "http/v2/jsxldeps",
        version: "~3",
        runtime: "node"
    });

    const v2jsxxxl = new FunctionApp(`${prefix}-v2jsxxxl`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        //path: "http/v2/jsxxxldeps",
        version: "~3",
        runtime: "node"
    });

    const v2cs = new FunctionApp(`${prefix}-v2cs`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        //path: "http/v2/csnoop/bin/Debug/netcoreapp2.1",
        version: "~3",
        runtime: "dotnet"
    });

    const appinsightscs = new FunctionApp(`${prefix}-aics`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        appInsights,
        //path: "http/v2/csnoop/bin/Debug/netcoreapp2.1",
        version: "~3",
        runtime: "dotnet"
    });

    const nozipcs = new FunctionApp(`${prefix}-nozipcs`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        path: "nozip",
        version: "~3",
        runtime: "dotnet"
    });

    const v2jsproxies = new FunctionApp(`${prefix}-v2jsproxies`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        //path: "http/v2/jsnoopproxies",
        version: "~3",
        runtime: "node"
    });

    const externalcs = new FunctionApp(`${prefix}-externalcs`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        path: "http/v2/csnoopzip/bin/Debug/netcoreapp3.1/publish",
        version: "~3",
        runtime: "dotnet"
    });

    const java = new FunctionApp(`${prefix}-java`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        //path: "http/v2/javanoop/target/azure-functions/v2java",
        version: "~3",
        runtime: "java"
    });

    const powershell = new FunctionApp(`${prefix}-ps`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        //path: "http/v2/psnoop",
        version: "~3",
        runtime: "powershell"
    });

    const jsbundle = new FunctionApp(`${prefix}-jsbundle`, {
        resourceGroup,
        storageAccount,
        storageContainer: runAsPackageContainer,
        path: "http/v2/jsbundle",
        version: "~3",
        runtime: "node"
    });

    const premiumResourceGroup = new azure.core.ResourceGroup(`${name}-prem-rg`, {
        location: "West Europe",
    });

    const premiumPlan = new azure.appservice.Plan("premium-asp", {
        resourceGroupName: premiumResourceGroup.name,
        kind: "elastic",
        sku: {
            tier: "ElasticPremium",
            size: "EP1",
        },
        maximumElasticWorkerCount: 20,
    });

    const premiumcs = new FunctionApp(`${prefix}-premiumcs`, {
        resourceGroup: premiumResourceGroup,
        storageAccount,
        plan: premiumPlan,
        storageContainer: runAsPackageContainer,
        path: "http/v2/cspremium/bin/Debug/netcoreapp3.1/publish",
        version: "~3",
        runtime: "dotnet",
    });

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

    const runAsPackageLinuxContainer = new azure.storage.Container(`${name}-cl`, {
        storageAccountName: linuxStorageAccount.name,
        containerAccessType: "private",
    });

    const linuxPlan = new azure.appservice.Plan(`${prefix}-asplinux`, {
        resourceGroupName: linuxResourceGroup.name,
        kind: "FunctionApp",
        sku: {
            tier: "Dynamic",
            size: "Y1",
        },
        reserved: true,
    });

    const csLinux = new FunctionApp(`${prefix}-cslinux`, {
        resourceGroup: linuxResourceGroup,
        storageAccount: linuxStorageAccount,
        storageContainer: runAsPackageLinuxContainer,
        plan: linuxPlan,
        //path: "http/v2/cslinux/bin/Debug/netcoreapp2.1",
        version: "~3",
        runtime: "dotnet",
    });

    const jsLinux = new FunctionApp(`${prefix}-jslinux`, {
        resourceGroup: linuxResourceGroup,
        storageAccount: linuxStorageAccount,
        storageContainer: runAsPackageLinuxContainer,
        plan: linuxPlan,
        //path: "http/v2/jslinux",
        version: "~3",
        runtime: "node",
    });

    return {
        nozipjs: nozipjs.url.apply(url => url + "http"),
        externaljs: externaljs.url.apply(url => url + "http"),
        v2js: v2js.url.apply(url => url + "http"),
        v2jsxl: v2jsxl.url.apply(url => url + "http"),
        v2jsxxl: v2jsxxxl.url.apply(url => url + "http"),
        v2cs: v2cs.url.apply(url => url + "http"),
        nozipcs: nozipcs.url.apply(url => url + "http"),
        externalcs: externalcs.url.apply(url => url + "http"),
        appinsightscs: appinsightscs.url.apply(url => url + "http"),
        v2jsproxies: v2jsproxies.url.apply(url => url + "http"),
        java: java.url.apply(url => url + "http"),
        powershell: powershell.url.apply(url => url + "http"),
        premiumcs: premiumcs.url.apply(url => url + "http"),
        jsbundle: jsbundle.url.apply(url => url + "http"),
        linuxResourceGroupName: linuxResourceGroup.name,
        linuxStorageAccountName: linuxStorageAccount.name,
        cslinux: csLinux.url.apply(url => url + "http"),
        jsLinux: jsLinux.url.apply(url => url + "http"),
    };
}

export const coldStarts = createColdStarts(`${name}-cold`);
