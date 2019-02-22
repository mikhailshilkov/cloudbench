import * as azure from "@pulumi/azure";

const resourceGroup = new azure.core.ResourceGroup("cloudbench", {
    location: "North Europe",
});

const appInsights = new azure.appinsights.Insights(`cloudbench-ai`, {
    resourceGroupName: resourceGroup.name,
    applicationType: 'Web',
    location: "North Europe"
});

export const appInsightsKey = appInsights.instrumentationKey;