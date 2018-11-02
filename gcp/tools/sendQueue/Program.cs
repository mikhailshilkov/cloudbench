using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Google.Api.Gax;
using Google.Cloud.Monitoring.V3;
using Google.Cloud.PubSub.V1;
using Google.Protobuf;
using Newtonsoft.Json.Linq;

namespace sendQueue
{
    class Program
    {
        static void Main(string[] args)
        {
            var project = "cloudbench-221016";
            var topicPause = "cloudbench-gcp-pause-topic";
            var topicBcrypt = "cloudbench-gcp-bcrypt-topic";
            var exportSubscription = "cloudbench-gcp-logs-export-subscription-645093e";
            //SendStuff(project, topicBcrypt, 0, 100000, 500, 10).Wait();
            //DumpLogs(project, exportSubscription, 100).Wait();
            Stats();
            Console.WriteLine("Done!");
        }

        private static void Stats()
        {
            var logs = File.ReadAllLines("logs.txt");
            var entries = 
                logs
                    .Select(l => l.Split(','))
                    .Select(parts => new Entry 
                    { 
                        Time = DateTime.Parse(parts[0]), 
                        Instance = parts[2]
                    })
                    .ToList();

            var startTime = entries[0].Time;
            var stats = 
               (from e in entries
                let bin = (int)((e.Time - startTime).TotalSeconds / 60)
                group e by bin into g
                let count = g.Count()
                let instances = g.Select(i => i.Instance).Distinct().Count()
                select $"{g.Key},{count},{instances}"
                ).ToList();
            File.WriteAllLines("stats.txt", stats);
        }

        private static async Task DumpLogs(string project, string subscription, int logStep)
        {
            var token = new CancellationTokenSource();

            var name = new SubscriptionName(project, subscription);
            SubscriberClient subscriber = await SubscriberClient.CreateAsync(name);
            var entries = new ConcurrentBag<Entry>();
            int count = 0;
            // Start the subscriber listening for messages.
            subscriber.StartAsync((msg, cancellationToken) =>
            {
                var body = msg.Data.ToStringUtf8();
                dynamic json = JObject.Parse(body);
                var message = json.textPayload?.ToString() ?? "";
                if (message.Contains("[STATE]"))
                {
                    var e = Parse(message, DateTime.Parse(json.timestamp.ToString()));
                    entries.Add(e);
                    int progress = Interlocked.Increment(ref count);
                    if (progress % logStep == 0)  
                    {
                        Console.WriteLine($"Received message # {progress}: {e.Time},,{e.Instance}");
                    }
                }
                // Return Reply.Ack to indicate this message has been handled.
                return Task.FromResult(SubscriberClient.Reply.Ack);
            });
            Console.WriteLine("Press any key to quit...");
            Console.ReadKey();
            await subscriber.StopAsync(CancellationToken.None);
            Console.WriteLine("Writing logs...");
            var lines = 
                entries
                    .OrderBy(e => e.Time)
                    .Select(e => $"{e.Time},,{e.Instance}");
            File.AppendAllLines("logs.txt", lines);
        }

        private static Entry Parse(string message, DateTime time)
        {
            var json = message.Split(new[] { "[STATE]", "[ENDSTATE]" }, StringSplitOptions.RemoveEmptyEntries)[0];
            dynamic d = JObject.Parse(json);
            return new Entry { Time = time, Instance = d.instanceID };
        }

        public class Entry
        {
            public DateTime Time { get; set; }
            public string Instance { get; set; }
        }

        private static async Task SendStuff(string project, string topicName, int min, int max, int batchSize, int parallel)
        {
            // Instantiates a client
            PublisherServiceApiClient publisher = PublisherServiceApiClient.Create();

            var topic = new TopicName(project, topicName);
            
            for (int step = min; step < max; step += batchSize * parallel)
            {
                var bases = Enumerable.Range(0, parallel).Select(j => step + j * batchSize);
                var tasks = bases.Select(b => 
                {
                    var messages = Enumerable.Range(0, batchSize)
                                .Select(i => b + i)
                                .Select(i => new PubsubMessage() { Data = ByteString.CopyFrom(i.ToString(), Encoding.UTF8) })
                                .ToList();
                    return publisher.PublishAsync(topic, messages);
                });
                var responses = await Task.WhenAll(tasks);

                Console.WriteLine($"Batches sent {step}");
            }
        }
    }

    // public static class ClientExtensions
    // {
    //     public static async Task<List<LogStream>> DescribeAllLogStreamsAsync(this AmazonCloudWatchLogsClient client, string logGroupName)
    //     {
    //         var logStreamsRequest = new DescribeLogStreamsRequest
    //         {
    //             LogGroupName = logGroupName
    //         };

    //         List<LogStream> allStreams = new List<LogStream>();
    //         while (true)
    //         {
    //             var streams = await client.DescribeLogStreamsAsync(logStreamsRequest);
    //             allStreams.AddRange(streams.LogStreams);
    //             if (streams.NextToken == null) break;
    //             logStreamsRequest.NextToken = streams.NextToken;                
    //         }
    //         return allStreams;
    //     }

    //     public static async Task<List<OutputLogEvent>> GetAllLogEventsAsync(this AmazonCloudWatchLogsClient client, string logGroupName, string logStreamName, DateTime since)
    //     {
    //         var getEventsRequest = new GetLogEventsRequest
    //         {
    //             LogGroupName = logGroupName,
    //             LogStreamName = logStreamName,
    //             StartTime = since
    //         };

    //         List<OutputLogEvent> allEvents = new List<OutputLogEvent>();
    //         while (true)
    //         {
    //             try
    //             {
    //                 var events = await client.GetLogEventsAsync(getEventsRequest);
    //                 allEvents.AddRange(events.Events);
    //                 if (events.NextBackwardToken == getEventsRequest.NextToken
    //                     || events.Events.Count < 50) break;
    //                 getEventsRequest.NextToken = events.NextBackwardToken;                
    //             }
    //             catch (AmazonCloudWatchLogsException)
    //             {
    //                 await Task.Delay(1000);
    //             }
    //             catch (AmazonUnmarshallingException)
    //             {
    //                 await Task.Delay(5000);
    //             }
    //         }
    //         return allEvents;
    //     }
    // }
}
