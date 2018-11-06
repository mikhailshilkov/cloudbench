using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Queue;

namespace sendQueue
{
    class Program
    {
        static void Main(string[] args)
        {
            ServicePointManager.UseNagleAlgorithm = false; 
            SendStuff(0, 100000, 50);
            Console.WriteLine("Done!");
        }

        private static void SendStuff(int min, int max, int parallel)
        {
            var storageAccount = CloudStorageAccount.Parse("redacted");
            var queueClient = storageAccount.CreateCloudQueueClient();
            var name = "qqueuebcryptv2js9b0c852a";
            var queue = queueClient.GetQueueReference(name);
            for (int i = min; i < max / parallel; i++)
            {
                var messages = Enumerable.Range(0, parallel).Select(j => new CloudQueueMessage((i* parallel + j).ToString()));
                var tasks = messages.Select(queue.AddMessageAsync);
                Task.WaitAll(tasks.ToArray());
                if (i * parallel % 100 == 0) Console.WriteLine(i.ToString());
            }
        }
    }
}
