import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { signedBlobReadUrl } from "./util";


export interface FunctionAppOptions {
    readonly resourceGroup: azure.core.ResourceGroup;
    readonly storageAccount: azure.storage.Account;
    readonly storageContainer: azure.storage.Container;
    readonly appInsights?: azure.appinsights.Insights;
    readonly path?: string;
    readonly version: string;
    readonly runtime: string;
    readonly appSettings?: object;
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

        let runFromPackage: pulumi.Input<string | undefined> = "1";
        if (options.path === "nozip") {
            runFromPackage = undefined;
        } else if (options.path) {
            const blob = new azure.storage.ZipBlob(`${name}-b`, {
                resourceGroupName: options.storageAccount.resourceGroupName,
                storageAccountName: options.storageAccount.name,
                storageContainerName: options.storageContainer.name,
                type: "block",

                content: new pulumi.asset.FileArchive(options.path)
            });
            runFromPackage = signedBlobReadUrl(blob, options.storageAccount, options.storageContainer);
        }

        const appInsightsKey = options.appInsights ? options.appInsights.instrumentationKey : undefined;
        const appSettings = {
            "FUNCTIONS_EXTENSION_VERSION": "~2",
            "WEBSITE_NODE_DEFAULT_VERSION": "8.11.1",
            "ApplicationInsights:InstrumentationKey": appInsightsKey,
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
            version: options.version
        });

        this.url = app.defaultHostname.apply(h => {
            return `https://${h}/api/`;
        });
    }
}