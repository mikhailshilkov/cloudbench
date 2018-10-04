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
        static Function1()
        {
            var stagesSetting = Environment.GetEnvironmentVariable("BcryptStages", EnvironmentVariableTarget.Process);
            BcryptStages = !String.IsNullOrEmpty(stagesSetting) ? Convert.ToInt32(stagesSetting) : 9;
        }

        [FunctionName("v1dotnet")]
        public static HttpResponseMessage Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")]HttpRequestMessage req)
        {
            return new HttpResponseMessage(HttpStatusCode.OK) 
            {
                Content = new StringContent("AzureFunction_V1_DotNet", Encoding.UTF8, "text/plain")
            };
        }

        [FunctionName("v1dotnetpause")]
        public static async Task<HttpResponseMessage> RunPause([HttpTrigger(AuthorizationLevel.Anonymous, "get")]HttpRequestMessage req)
        {
            await Task.Delay(100);
            return new HttpResponseMessage(HttpStatusCode.OK) 
            {
                Content = new StringContent("AzureFunction_V1_DotNet_Pause", Encoding.UTF8, "text/plain")
            };
        }

        [FunctionName("v1dotnetbcrypt")]
        public static HttpResponseMessage RunBcrypt([HttpTrigger(AuthorizationLevel.Anonymous, "get")]HttpRequestMessage req)
        {
            BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString(), BcryptStages);
            return new HttpResponseMessage(HttpStatusCode.OK) 
            {
                Content = new StringContent("AzureFunction_V1_DotNet_Bcrypt", Encoding.UTF8, "text/plain")
            };
        }

        private static int BcryptStages;
    }
}