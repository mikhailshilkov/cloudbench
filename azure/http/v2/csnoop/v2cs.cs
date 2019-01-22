
using System;
using System.Linq;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using System.Text;
using Newtonsoft.Json.Linq;

namespace dotnet
{
    public static class v2dotnet
    {
        private static string instanceID;
        private static int count = 0;

        static v2dotnet()
        {
            var envInstance = Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID"); 
            instanceID = !String.IsNullOrEmpty(envInstance) ? $"AZ:{envInstance}" : "LOCAL:LOCAL";
        }

        [FunctionName("http")]
        public static IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)]HttpRequest req, ILogger log)
        {
            count += 1;

            req.HttpContext.Response.Headers.Add("X-CB-Name", "Azure_CSNoop");
            req.HttpContext.Response.Headers.Add("X-CB-Count", count.ToString());
            req.HttpContext.Response.Headers.Add("X-CB-Instance", instanceID);
            return (ActionResult)new ContentResult
            { 
                Content = $"Azure_CSNoop_{instanceID}", 
                ContentType = "text/plain" 
            };
        }
    }
}