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
            SendStuff(0, 100000, 50, 0);
            Console.WriteLine("Done!");
        }

        private static void SendStuff(int min, int max, int parallel, int delay)
        {
            var storageAccount = CloudStorageAccount.Parse("redacted");
            var queueClient = storageAccount.CreateCloudQueueClient();
            //var name = "queuebcryptv2cs63c61be1";
            //var name = "queuebcryptv1cse2744d7c";
            //var name = "queuepausev1jsae76ccce";
            var name = "queuepausev2js58ae0f84";
            var queue = queueClient.GetQueueReference(name);
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
