import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { signedBlobReadUrl } from "./util";


export interface FunctionAppOptions {
    readonly resourceGroup: azure.core.ResourceGroup;
    readonly storageAccount: azure.storage.Account;
    readonly storageContainer?: azure.storage.Container;
    readonly appInsights?: azure.appinsights.Insights;
    readonly version: string;
    readonly runtime: string;
    readonly appSettings?: object;
}

export class FunctionApp extends pulumi.ComponentResource {
    public name: pulumi.Output<string>;
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

        const app = new azure.appservice.FunctionApp(`${name}-fa`, {
            ...resourceGroupArgs,
        
            appServicePlanId: appServicePlan.id,
            storageConnectionString: options.storageAccount.primaryConnectionString,
        
            appSettings: {
                "FUNCTIONS_EXTENSION_VERSION": "~2",
                "WEBSITE_NODE_DEFAULT_VERSION": "8.11.1",
                "FUNCTIONS_WORKER_RUNTIME": options.runtime,
                ...options.appSettings
            },
        
            version: options.version
        });

        this.name = app.name;
        this.url = app.defaultHostname.apply(h => {
            return `https://${h}/api/`;
        });
    }
}