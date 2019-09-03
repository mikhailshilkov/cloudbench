
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

        private static Random random = new Random();
        private static string RandomString(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        static v2dotnet()
        {
            instanceID = $"RAND:{RandomString(8)}";
        }

        [FunctionName("http")]
        public static IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)]HttpRequest req, ILogger log)
        {
            count += 1;

            req.HttpContext.Response.Headers.Add("X-CB-Name", "Azure_CSLinux");
            req.HttpContext.Response.Headers.Add("X-CB-Count", count.ToString());
            req.HttpContext.Response.Headers.Add("X-CB-Instance", instanceID);
            return (ActionResult)new ContentResult
            {
                Content = $"Azure_CSLinux_{instanceID}",
                ContentType = "text/plain"
            };
        }
    }
}