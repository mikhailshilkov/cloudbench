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
    public static class Queues
    {
        static Queues()
        {
            var stagesSetting = Environment.GetEnvironmentVariable("BcryptStages", EnvironmentVariableTarget.Process);
            BcryptStages = !String.IsNullOrEmpty(stagesSetting) ? Convert.ToInt32(stagesSetting) : 10;
        }

        [FunctionName("V1QueuePause")]
        public static async Task RunPause([QueueTrigger("%pausequeuename%") ]string message)
        {
            await Task.Delay(500);
        }

        [FunctionName("V1QueueBcrypt")]
        public static void RunBcrypt([QueueTrigger("%bcryptqueuename%") ]string message)
        {
            BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString(), BcryptStages);
        }

        private static int BcryptStages;
    }

    }
}