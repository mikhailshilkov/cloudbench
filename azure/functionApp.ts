import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";


export interface FunctionAppOptions {
    readonly resourceGroup: azure.core.ResourceGroup;
    readonly storageAccount: azure.storage.Account;
    readonly storageContainer: azure.storage.Container;
    readonly appInsights?: azure.appinsights.Insights;
    readonly path?: string;
    readonly osType?: string;
    readonly version: string;
    readonly runtime: string;
    readonly appSettings?: {
        [key: string]: pulumi.Input<string>;
    };
    readonly plan?: azure.appservice.Plan;
}

export class FunctionApp extends pulumi.ComponentResource {
    public url: pulumi.Output<string>;

    constructor(name: string, options: FunctionAppOptions) {
        super("mikhail:azure:MyFunctionApp", name);

        const resourceGroupArgs = {
            resourceGroupName: options.resourceGroup.name,
            location: options.resourceGroup.location,
        };

        const appServicePlan = options.plan || new azure.appservice.Plan(`${name}-asp`, {
            ...resourceGroupArgs,

            kind: "FunctionApp",

            // https://social.msdn.microsoft.com/Forums/azure/en-US/665c365d-2b86-4a77-8cea-72ccffef216c
            sku: {
                tier: "Dynamic",
                size: "Y1",
            },
        });

        let runFromPackage: pulumi.Input<string> = "1";
        if (options.path === "nozip") {
            runFromPackage = "";
        } else if (options.path) {
            const blob = new azure.storage.Blob(`${name}-b`, {
                storageAccountName: options.storageAccount.name,
                storageContainerName: options.storageContainer.name,
                type: "Block",

                source: new pulumi.asset.FileArchive(options.path)
            });
            runFromPackage = azure.storage.signedBlobReadUrl(blob, options.storageAccount);
        }

        const appInsightsKey = options.appInsights ? options.appInsights.instrumentationKey : "";
        const appSettings = {
            "WEBSITE_NODE_DEFAULT_VERSION": "8.11.1",
            "APPINSIGHTS_INSTRUMENTATIONKEY": appInsightsKey,
            "FUNCTIONS_WORKER_RUNTIME": options.runtime,
            "WEBSITE_RUN_FROM_PACKAGE": runFromPackage,
            ...options.appSettings
        };

        const app = new azure.appservice.FunctionApp(`${name}-fa`, {
            ...resourceGroupArgs,

            appServicePlanId: appServicePlan.id,
            storageConnectionString: options.storageAccount.primaryConnectionString,
            appSettings,
            osType: options.osType,
            version: options.version,
        });

        this.url = app.defaultHostname.apply(h => {
            return `https://${h}/api/`;
        });
    }
}