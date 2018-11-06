using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Amazon;
using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Amazon.Runtime;
using Amazon.SQS;
using Amazon.SQS.Model;
using Newtonsoft.Json.Linq;

namespace sendQueue
{
    class Program
    {
        static void Main(string[] args)
        {
            var queue = "https://sqs.eu-central-1.amazonaws.com/994380653032/cloudbench-aws-bcrypt-queue-3542b30";
            //SendStuff(queue, 0, 100000, 10, 20).Wait();
            //DumpLogs("bcrypt-lambda-c980028", DateTime.UtcNow.AddMinutes(-10)).Wait();
            Stats();
            Console.WriteLine("Done!");
        }

        private static void StatsBin(int x)
        {
            File.AppendAllLines("stats.txt", new[] { $"{x} second bins:" });
            var logs = File.ReadAllLines("logs.txt");
            var entries = 
                logs
                    .Select(l => l.Split(','))
                    .Select(parts => new Entry 
                    { 
                        Time = DateTime.Parse(parts[0]), 
                        Instance = parts[2], 
                        VM = parts[1]
                    })
                    .ToList();

            var startTime = entries[0].Time;
            var stats = 
               (from e in entries
                let bin = (int)((e.Time - startTime).TotalSeconds / x)
                group e by bin into g
                let count = g.Count()
                let instances = g.Select(i => i.Instance).Distinct().Count()
                select $"{g.Key},{count},{instances}"
                ).ToList();
            File.AppendAllLines("stats.txt", stats);
            File.AppendAllLines("stats.txt", new[] { $"Written {stats.Count}\n" });
        }
        private static void Stats()
        {
            StatsBin(60);
            StatsBin(6);            
        }

        private static async Task DumpLogs(string lambda, DateTime since)
        {
            var config = new AmazonCloudWatchLogsConfig();
            config.RegionEndpoint = RegionEndpoint.EUCentral1;
            var client = new AmazonCloudWatchLogsClient(config);
            
            var logGroupsRequest = new DescribeLogGroupsRequest
            {
                LogGroupNamePrefix = $"/aws/lambda/{lambda}"
            };
            var groups = await client.DescribeLogGroupsAsync(logGroupsRequest);
            var streams = await client.DescribeAllLogStreamsAsync(groups.LogGroups[0].LogGroupName);

            var events = new List<OutputLogEvent>();
            int i = 0;
            foreach (var s in streams)
            {
                events.AddRange(await client.GetAllLogEventsAsync(groups.LogGroups[0].LogGroupName, s.LogStreamName, since));
                Console.WriteLine($"Loaded {++i} out of {streams.Count}");
            }
            var logs = events
                .Where(m => m.Message.Contains("[STATE]"))
                .Select(m => Parse(m.Message, m.Timestamp))
                .OrderBy(e => e.Time)
                .Select(e => $"{e.Time},{e.VM},{e.Instance}")
                .ToList();

            File.WriteAllLines("logs.txt", logs);
        }

        private static Entry Parse(string message, DateTime time)
        {
            var json = message.Split(new[] { "[STATE]", "[ENDSTATE]" }, StringSplitOptions.RemoveEmptyEntries)[1];
            dynamic d = JObject.Parse(json);
            return new Entry { Time = time, Instance = d.instanceID, VM = d.r_id };
        }

        public class Entry
        {
            public DateTime Time { get; set; }
            public string Instance { get; set; }
            public string VM { get; set; }
        }

        private static async Task SendStuff(string queueUrl, int min, int max, int batchSize, int parallel)
        {
            var config = new AmazonSQSConfig();
            config.RegionEndpoint = RegionEndpoint.EUCentral1;
            var client = new AmazonSQSClient(config);
            
            for (int step = min; step < max; step += batchSize * parallel)
            {
                var bases = Enumerable.Range(0, parallel).Select(j => step + j * batchSize);
                var tasks = bases.Select(b => 
                {
                    var request = new SendMessageBatchRequest
                    {
                        Entries = 
                            Enumerable.Range(0, batchSize)
                                .Select(i => b + i)
                                .Select(i => new SendMessageBatchRequestEntry(i.ToString(), i.ToString()))
                                .ToList(),
                        QueueUrl = queueUrl
                    };
                    return client.SendMessageBatchAsync(request);
                });
                var responses = await Task.WhenAll(tasks);

                Console.WriteLine($"Batches sent {step}");
                foreach (var response in responses)
                foreach (var failure in response.Failed)
                {
                    Console.WriteLine($"Failed Id={failure.Id}, Faule={failure.SenderFault}");
                }
            }
        }
    }

    public static class ClientExtensions
    {
        public static async Task<List<LogStream>> DescribeAllLogStreamsAsync(this AmazonCloudWatchLogsClient client, string logGroupName)
        {
            var logStreamsRequest = new DescribeLogStreamsRequest
            {
                LogGroupName = logGroupName
            };

            List<LogStream> allStreams = new List<LogStream>();
            while (true)
            {
                var streams = await client.DescribeLogStreamsAsync(logStreamsRequest);
                allStreams.AddRange(streams.LogStreams);
                if (streams.NextToken == null) break;
                logStreamsRequest.NextToken = streams.NextToken;                
            }
            return allStreams;
        }

        public static async Task<List<OutputLogEvent>> GetAllLogEventsAsync(this AmazonCloudWatchLogsClient client, string logGroupName, string logStreamName, DateTime since)
        {
            var getEventsRequest = new GetLogEventsRequest
            {
                LogGroupName = logGroupName,
                LogStreamName = logStreamName,
                StartTime = since
            };

            List<OutputLogEvent> allEvents = new List<OutputLogEvent>();
            while (true)
            {
                try
                {
                    var events = await client.GetLogEventsAsync(getEventsRequest);
                    allEvents.AddRange(events.Events);
                    if (events.NextBackwardToken == getEventsRequest.NextToken
                        || events.Events.Count < 50) break;
                    getEventsRequest.NextToken = events.NextBackwardToken;                
                }
                catch (AmazonCloudWatchLogsException)
                {
                    await Task.Delay(1000);
                }
                catch (AmazonUnmarshallingException)
                {
                    await Task.Delay(5000);
                }
            }
            return allEvents;
        }
    }
}
