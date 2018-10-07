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
    public static class Queues
    {
        static Queues()
        {
            var stagesSetting = Environment.GetEnvironmentVariable("BcryptStages", EnvironmentVariableTarget.Process);
            BcryptStages = !String.IsNullOrEmpty(stagesSetting) ? Convert.ToInt32(stagesSetting) : 10;
        }

        [FunctionName("V2QueuePause")]
        public static async Task RunPause([QueueTrigger("%pausequeuename%") ]string message, ILogger log)
        {
            await Task.Delay(500);
        }

        [FunctionName("V2QueueBcrypt")]
        public static void RunBcrypt([QueueTrigger("%bcryptqueuename%") ]string message, ILogger log)
        {
            BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString(), BcryptStages);
        }

        private static int BcryptStages;
    }
}
