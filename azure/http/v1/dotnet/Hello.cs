using System.Net;
using System.Net.Http;
using System.Text;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;

namespace v1cs
{
    public static class Function1
    {
        [FunctionName("v1dotnet")]
        public static HttpResponseMessage Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")]HttpRequestMessage req)
        {
            return new HttpResponseMessage(HttpStatusCode.OK) 
            {
                Content = new StringContent("AzureFunction_V1_DotNet", Encoding.UTF8, "text/plain")
            };
        }
    }
}