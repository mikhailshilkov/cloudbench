import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { signedBlobReadUrl } from "./util";

export interface MyAppServiceOptions {
    readonly resourceGroup: azure.core.ResourceGroup;
    readonly storageAccount: azure.storage.Account;
    readonly storageContainer: azure.storage.Container;
    readonly appInsights: azure.appinsights.Insights;
    readonly path: string;
    readonly version: string;
    readonly appSettings?: object;
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
                "WEBSITE_NODE_DEFAULT_VERSION": "8.11.1",
                "ApplicationInsights:InstrumentationKey": appInsights.instrumentationKey,
                "APPINSIGHTS_INSTRUMENTATIONKEY": appInsights.instrumentationKey,
                ...options.appSettings
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

const appInsights = new azure.appinsights.Insights(`${name}-ai`, {
    resourceGroupName: resourceGroup.name,
    applicationType: 'Web',
    location: "West Europe"
});

function apps(prefix: string, deps: boolean) {
    const v1js = new MyFunctionApp(`${prefix}v1js`, {
        resourceGroup,
        storageAccount,
        storageContainer,
        appInsights,
        path: "http/v1/js",
        version: "~1"
    });

    const v1dotnet = new MyFunctionApp(`${prefix}v1dotnet`, {
        resourceGroup,
        storageAccount,
        storageContainer,
        path: "http/v1/dotnet/bin/Debug/net461/publish",
        appInsights,
        version: "~1"
    });

    const v2js = new MyFunctionApp(`${prefix}v2js`, {
        resourceGroup,
        storageAccount,
        storageContainer,
        appInsights,
        path: "http/v2/js",
        version: "beta"
    });

    const v2dotnet = new MyFunctionApp(`${prefix}v2dotnet`, {
        resourceGroup,
        storageAccount,
        storageContainer,
        appInsights,
        path: "http/v2/dotnet/bin/Debug/netstandard2.0/publish",
        version: "beta"
    });

    const v2java = new MyFunctionApp(`${prefix}v2java`, {
        resourceGroup,
        storageAccount,
        storageContainer,
        appInsights,
        path: "http/v2/java/target/azure-functions/v2java",
        version: "beta"
    });

    if (deps) {
        const v1jsdeps = new MyFunctionApp(`${prefix}v1jsdeps`, {
            resourceGroup,
            storageAccount,
            storageContainer,
            appInsights,
            path: "http/v1/jsdeps",
            version: "~1"
        });

        const v1jsdepsmax = new MyFunctionApp(`${prefix}v1jsdepsmax`, {
            resourceGroup,
            storageAccount,
            storageContainer,
            appInsights,
            path: "http/v1/jsdepsmax",
            version: "~1"
        });

        const v2jsdeps = new MyFunctionApp(`${prefix}v2jsdeps`, {
            resourceGroup,
            storageAccount,
            storageContainer,
            appInsights,
            path: "http/v2/jsdeps",
            version: "beta"
        });
    
        const v2jsdepsmax = new MyFunctionApp(`${prefix}v2jsdepsmax`, {
            resourceGroup,
            storageAccount,
            storageContainer,
            appInsights,
            path: "http/v2/jsdepsmax",
            version: "beta"
        });    

        return {
            v1js: v1js.url,
            v1jsdeps: v1jsdeps.url,
            v1jsdepsmax: v1jsdepsmax.url,
            v1dotnet: v1dotnet.url,
            v2js: v2js.url,
            v2jsdeps: v2jsdeps.url,
            v2jsdepsmax: v2jsdepsmax.url,
            v2dotnet: v2dotnet.url,
            v2java: v2java.url
        };
    } else {
        return {
            v1js: v1js.url,
            v1dotnet: v1dotnet.url,
            v2js: v2js.url,
            v2dotnet: v2dotnet.url,
            v2java: v2java.url
        };
    }
}

function queues(prefix: string) {

    const pauseQueue = new azure.storage.Queue(`${prefix}queuev2js`, {
        resourceGroupName: resourceGroup.name,
        storageAccountName: storageAccount.name
    });

    const bcryptQueue = new azure.storage.Queue(`${prefix}queuebcryptv2js`, {
        resourceGroupName: resourceGroup.name,
        storageAccountName: storageAccount.name
    });

    new MyFunctionApp(`${prefix}v2js`, {
        resourceGroup,
        storageAccount,
        storageContainer,
        appInsights,
        path: "queue/v2/js",
        version: "~2",
        appSettings: {
            "pausequeuename": pauseQueue.name,
            "bcryptqueuename": bcryptQueue.name
        }
    });
    return {
        pauseQueue: pauseQueue.name,
        bcryptQueue: bcryptQueue.name
    };
}

//exports.coldStarts = apps("", false);
//exports.fire = apps("fire", false);
exports.queues = queues("q");
