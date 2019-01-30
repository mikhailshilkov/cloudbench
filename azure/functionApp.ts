import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { signedBlobReadUrl } from "./util";


export interface FunctionAppOptions {
    readonly resourceGroup: azure.core.ResourceGroup;
    readonly storageAccount: azure.storage.Account;
    readonly storageContainer: azure.storage.Container;
    readonly appInsights: azure.appinsights.Insights;
    readonly path: string;
    readonly version: string;
    readonly runtime: string;
    readonly appSettings?: object;
}

export class FunctionApp extends pulumi.ComponentResource {
    public url: pulumi.Output<string>;

    constructor(name: string, options: FunctionAppOptions) {
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
                "ApplicationInsights:InstrumentationKey": options.appInsights.instrumentationKey,
                "APPINSIGHTS_INSTRUMENTATIONKEY": options.appInsights.instrumentationKey,
                "FUNCTIONS_WORKER_RUNTIME": options.runtime,
                ...options.appSettings
            },
        
            version: options.version
        });

        this.url = v1js.defaultHostname.apply(h => {
            return `https://${h}/api/`;
        });
    }
}