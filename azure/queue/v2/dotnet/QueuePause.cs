using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;

namespace CloudBench
{
    public static class QueuePause
    {
        [FunctionName("QueuePause")]
        public static async Task Run([QueueTrigger("%queuename%") ]string message, ILogger log)
        {
            log.LogInformation($"C# Queue trigger function processed: {message}");
            await Task.Delay(100);
        }
    }
}
