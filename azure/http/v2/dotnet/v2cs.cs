
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

        private static string storageConnectionString = "TODO";

        private static CloudStorageAccount account = CloudStorageAccount.Parse(storageConnectionString);
        private static CloudBlobClient serviceClient = account.CreateCloudBlobClient();

        private static CloudBlobContainer container = serviceClient.GetContainerReference("samples");

        private static string[] qparts;
        private static string[] aparts;
        private static int[] ids;

        private static Random r = new Random();
        private static async Task<string> downloadString(string name)
        {
            CloudBlockBlob templateBlob = container.GetBlockBlobReference(name);
            return await templateBlob.DownloadTextAsync();

        }

        [FunctionName("v2dotnetbblob")]
        public static async Task<IActionResult> RunBlob([HttpTrigger(AuthorizationLevel.Anonymous, "get")]HttpRequest req)
        {
            var cold = ids == null ? "_Cold" : "";
            if (ids == null) {
                var qtemplate = await downloadString("question.html");
                var titleParts = qtemplate.Split("%TITLE%");
                var questionParts = titleParts[1].Split("%QUESTION%");
                var answersParts = questionParts[1].Split("%ANSWERS%");
                qparts = new[] { titleParts[0], questionParts[0], answersParts[0], answersParts[1] };

                var atemplate = await downloadString("answers.html");
                aparts = atemplate.Split("%TEXT%");

                var idsString = await downloadString("ids.json");
                ids = idsString.Split(',').Select(v => int.Parse(v)).ToArray();
            }
            
            var id = ids[r.Next(ids.Length)];

            var data = await downloadString(id + ".json");

            dynamic json = JsonConvert.DeserializeObject(data);

            var answers = new StringBuilder();
            foreach (var answer in (json.answers as JArray))
            {
               answers.Append(aparts[0] + answer.ToString() + aparts[1]);
            }
            var html = qparts[0] + json.title + qparts[1] + json.text + qparts[2] + answers.ToString() + qparts[3];

            var instanceID = (Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID") ?? "localinstance").Substring(0, 10);
            req.HttpContext.Response.Headers.Add("X-CB-Signature", $"Azure_JSBlob_{instanceID}{cold}");

            return (ActionResult)new ContentResult
            { 
                Content = html,
                 
                ContentType = "text/html",

            };
        }

        private static int BcryptStages;
    }
}
