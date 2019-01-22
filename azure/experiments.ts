

// function apps(prefix: string, deps: boolean) {
//     const v1js = new FunctionApp(`${prefix}v1js`, {
//         resourceGroup,
//         storageAccount,
//         storageContainer,
//         appInsights,
//         path: "http/v1/js",
//         version: "~1"
//     });

//     const v1dotnet = new FunctionApp(`${prefix}v1dotnet`, {
//         resourceGroup,
//         storageAccount,
//         storageContainer,
//         path: "http/v1/dotnet/bin/Debug/net461/publish",
//         appInsights,
//         version: "~1"
//     });

//     const v2js = new FunctionApp(`${prefix}v2js`, {
//         resourceGroup,
//         storageAccount,
//         storageContainer,
//         appInsights,
//         path: "http/v2/js",
//         version: "beta"
//     });

//     const v2dotnet = new FunctionApp(`${prefix}v2dotnet`, {
//         resourceGroup,
//         storageAccount,
//         storageContainer,
//         appInsights,
//         path: "http/v2/dotnet/bin/Debug/netstandard2.0/publish",
//         version: "beta"
//     });

//     const v2java = new FunctionApp(`${prefix}v2java`, {
//         resourceGroup,
//         storageAccount,
//         storageContainer,
//         appInsights,
//         path: "http/v2/java/target/azure-functions/v2java",
//         version: "beta"
//     });

//     if (deps) {
//         const v1jsdeps = new FunctionApp(`${prefix}v1jsdeps`, {
//             resourceGroup,
//             storageAccount,
//             storageContainer,
//             appInsights,
//             path: "http/v1/jsdeps",
//             version: "~1"
//         });

//         const v1jsdepsmax = new FunctionApp(`${prefix}v1jsdepsmax`, {
//             resourceGroup,
//             storageAccount,
//             storageContainer,
//             appInsights,
//             path: "http/v1/jsdepsmax",
//             version: "~1"
//         });

//         const v2jsdeps = new FunctionApp(`${prefix}v2jsdeps`, {
//             resourceGroup,
//             storageAccount,
//             storageContainer,
//             appInsights,
//             path: "http/v2/jsdeps",
//             version: "beta"
//         });
    
//         const v2jsdepsmax = new FunctionApp(`${prefix}v2jsdepsmax`, {
//             resourceGroup,
//             storageAccount,
//             storageContainer,
//             appInsights,
//             path: "http/v2/jsdepsmax",
//             version: "beta"
//         });    

//         return {
//             v1js: v1js.url,
//             v1jsdeps: v1jsdeps.url,
//             v1jsdepsmax: v1jsdepsmax.url,
//             v1dotnet: v1dotnet.url,
//             v2js: v2js.url,
//             v2jsdeps: v2jsdeps.url,
//             v2jsdepsmax: v2jsdepsmax.url,
//             v2dotnet: v2dotnet.url,
//             v2java: v2java.url
//         };
//     } else {
//         return {
//             v1js: v1js.url,
//             v1dotnet: v1dotnet.url,
//             v2js: v2js.url,
//             v2dotnet: v2dotnet.url,
//             v2java: v2java.url
//         };
//     }
// }

// function queues(prefix: string) {

//     const pauseQueue = new azure.storage.Queue(`${prefix}queuev2js`, {
//         resourceGroupName: resourceGroup.name,
//         storageAccountName: storageAccount.name
//     });

//     const bcryptQueue = new azure.storage.Queue(`${prefix}queuebcryptv2js`, {
//         resourceGroupName: resourceGroup.name,
//         storageAccountName: storageAccount.name
//     });

//     new FunctionApp(`${prefix}v2js`, {
//         resourceGroup,
//         storageAccount,
//         storageContainer,
//         appInsights,
//         path: "queue/v2/js",
//         version: "~2",
//         appSettings: {
//             "pausequeuename": pauseQueue.name,
//             "bcryptqueuename": bcryptQueue.name
//         }
//     });
//     return {
//         pauseQueue: pauseQueue.name,
//         bcryptQueue: bcryptQueue.name
//     };
// }

// //exports.coldStarts = apps("", false);
// //exports.fire = apps("fire", false);
// exports.queues = queues("q");


// const storageContainer = new azure.storage.Container(`${name}-c`, {
//     resourceGroupName: resourceGroup.name,
//     storageAccountName: storageAccount.name,
//     containerAccessType: "private",
// });

// const appInsights = new azure.appinsights.Insights(`${name}-ai`, {
//     resourceGroupName: resourceGroup.name,
//     applicationType: 'Web',
//     location: "West Europe"
// });

// const jspause = new FunctionApp(`${name}-jspause`, {
//     resourceGroup,
//     storageAccount,
//     storageContainer,
//     appInsights,
//     path: "http/v2/jspause",
//     version: "~2"
// });

// const jsbcrypt = new FunctionApp(`${name}-jsbcrypt`, {
//     resourceGroup,
//     storageAccount,
//     storageContainer,
//     appInsights,
//     path: "http/v2/jsbcrypt",
//     version: "~2"
// });

// const jsblob = new FunctionApp(`${name}-jsblob`, {
//     resourceGroup,
//     storageAccount,
//     storageContainer,
//     appInsights,
//     path: "http/v2/jsblob",
//     version: "~2"
// });

// const jsblobnet = new FunctionApp(`${name}-jsblobnet`, {
//     resourceGroup,
//     storageAccount,
//     storageContainer,
//     appInsights,
//     path: "http/v2/dotnet/bin/debug/netcoreapp2.1/publish",
//     version: "~2"
// });

// export const storage = storageAccount.primaryConnectionString;
// export const jspauseUrl = jspause.url;
// export const jsbcryptUrl = jsbcrypt.url;
// export const jsblobUrl = jsblob.url;
// export const jsblobnetUrl = jsblobnet.url;