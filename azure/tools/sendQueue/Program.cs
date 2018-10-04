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
            Console.WriteLine("Hello World!");
            SendStuff(0, 10000, 50, 0);
            Console.WriteLine("Done!");
        }

        private static void SendStuff(int min, int max, int parallel, int delay)
        {
            var storageAccount = CloudStorageAccount.Parse("DefaultEndpointsProtocol=https;AccountName=cloudbenchsae5279838;AccountKey=pkxoXix9vUPjfqfkPvdTmLfaZdq2oSwKoVYQRMGWkskz8r7uA/Q7WTgmGSpDD6k0oAZnIS9uMlwsSw88ryouWA==;EndpointSuffix=core.windows.net");
            var queueClient = storageAccount.CreateCloudQueueClient();
            var queue = queueClient.GetQueueReference("queuepaused72c9320");
            for (int i = min; i < max / parallel; i++)
            {
                var messages = Enumerable.Range(0, parallel).Select(j => new CloudQueueMessage((i* parallel + j).ToString()));
                var tasks = messages.Select(queue.AddMessageAsync);
                Task.WaitAll(tasks.ToArray());
                if (i * parallel % 100 == 0) Console.WriteLine(i.ToString());
                if (delay > 0) Thread.Sleep(delay);
            }
        }
    }
}
