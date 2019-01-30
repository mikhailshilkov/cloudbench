using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;

namespace v1cs
{
    public static class Function1
    {
        private static string instanceID;
        private static int count = 0;

        static Function1()
        {
            var envInstance = Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID"); 
            instanceID = !String.IsNullOrEmpty(envInstance) ? $"AZ:{envInstance}" : "LOCAL:LOCAL";
        }

        [FunctionName("http")]
        public static HttpResponseMessage Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")]HttpRequestMessage req)
        {
            count += 1;

            var message = new HttpResponseMessage(HttpStatusCode.OK) 
            {
                Content = new StringContent($"AzureV1_CSNoop_{instanceID}", Encoding.UTF8, "text/plain")
            };
            message.Headers.Add("X-CB-Name", "AzureV1_CSNoop");
            message.Headers.Add("X-CB-Count", count.ToString());
            message.Headers.Add("X-CB-Instance", instanceID);
            return message;
        }
    }
}