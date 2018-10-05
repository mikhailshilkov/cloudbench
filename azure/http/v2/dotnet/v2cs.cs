
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace dotnet
{
    public static class v2dotnet
    {
        static v2dotnet()
        {
            var stagesSetting = Environment.GetEnvironmentVariable("BcryptStages", EnvironmentVariableTarget.Process);
            BcryptStages = !String.IsNullOrEmpty(stagesSetting) ? Convert.ToInt32(stagesSetting) : 9;
        }

        [FunctionName("v2dotnet")]
        public static IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)]HttpRequest req, ILogger log)
        {
            return (ActionResult)new ContentResult
            { 
                Content = "AzureFunction_V2_DotNet", 
                ContentType = "text/plain" 
            };
        }

        [FunctionName("v2dotnetpause")]
        public static async Task<IActionResult> RunPause([HttpTrigger(AuthorizationLevel.Anonymous, "get")]HttpRequest req)
        {
            await Task.Delay(100);
            return (ActionResult)new ContentResult
            { 
                Content = "AzureFunction_V2_DotNet_Pause", 
                ContentType = "text/plain" 
            };
        }

        [FunctionName("v2dotnetbcrypt")]
        public static IActionResult RunBcrypt([HttpTrigger(AuthorizationLevel.Anonymous, "get")]HttpRequest req)
        {
            BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString(), BcryptStages);
            return (ActionResult)new ContentResult
            { 
                Content = "AzureFunction_V2_DotNet_Bcrypt", 
                ContentType = "text/plain" 
            };
        }

        private static int BcryptStages;
    }
}
