import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { signedBlobReadUrl } from "./util";

export interface MyAppServiceOptions {
    readonly resourceGroup: azure.core.ResourceGroup;
    readonly storageAccount: azure.storage.Account;
    readonly storageContainer: azure.storage.Container;
    readonly path: string;
    readonly version: string;
}

class MyFunctionApp extends pulumi.ComponentResource {
    public url: pulumi.Output<string>;

    constructor(name: string, options: MyAppServiceOptions) {
        super("mikhail:azure:MyFunctionApp", name);

        const resourceGroupArgs = {
            resourceGroupName: options.resourceGroup.name,
            location: options.resourceGroup.location,
        };

        const appServicePlan = new azure.appservice.Plan(`${name}-asp`, {
            ...resourceGroupArgs,
        
            kind: "FunctionApp",
        
            // https://social.msdn.microsoft.com/Forums/azure/en-US/665c365d-2b86-4a77-8cea-72ccffef216c
            sku: {
                tier: "Dynamic",
                size: "Y1",
            },
        });
                
        const blob = new azure.storage.ZipBlob(`${name}-b`, {
            resourceGroupName: options.resourceGroup.name,
            storageAccountName: options.storageAccount.name,
            storageContainerName: options.storageContainer.name,
            type: "block",
        
            content: new pulumi.asset.FileArchive(options.path)
        });
        
        const codeBlobUrl = signedBlobReadUrl(blob, options.storageAccount, options.storageContainer);
        
        const v1js = new azure.appservice.FunctionApp(`${name}-fa`, {
            ...resourceGroupArgs,
        
            appServicePlanId: appServicePlan.id,
            storageConnectionString: options.storageAccount.primaryConnectionString,
        
            appSettings: {
                "WEBSITE_RUN_FROM_ZIP": codeBlobUrl,
                "FUNCTIONS_EXTENSION_VERSION": "~2",
                "WEBSITE_NODE_DEFAULT_VERSION": "8.11.1"
            },
        
            version: options.version
        });

        this.url = v1js.defaultHostname.apply(h => {
            return `https://${h}/api/${name}`;
        });
    }
}

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

const v1js = new MyFunctionApp("v1js", {
    resourceGroup,
    storageAccount,
    storageContainer,
    path: "v1/js",
    version: "~1"
});

const v1dotnet = new MyFunctionApp("v1dotnet", {
    resourceGroup,
    storageAccount,
    storageContainer,
    path: "v1/dotnet/bin/Debug/net461/publish",
    version: "~1"
});

const v2js = new MyFunctionApp("v2js", {
    resourceGroup,
    storageAccount,
    storageContainer,
    path: "v2/js",
    version: "beta"
});

const v2dotnet = new MyFunctionApp("v2dotnet", {
    resourceGroup,
    storageAccount,
    storageContainer,
    path: "v2/dotnet/bin/Debug/netstandard2.0/publish",
    version: "beta"
});

const v2java = new MyFunctionApp("v2java", {
    resourceGroup,
    storageAccount,
    storageContainer,
    path: "v2/java/target/azure-functions/v2java",
    version: "beta"
});

exports.v1js = v1js.url;
exports.v1dotnet = v1dotnet.url;
exports.v2js = v2js.url;
exports.v2dotnet = v2dotnet.url;
exports.v2java = v2java.url;
