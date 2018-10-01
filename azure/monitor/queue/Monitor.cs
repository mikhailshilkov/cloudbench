using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.ApplicationInsights;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;

namespace CloudBench
{
    public class FireMessage 
    {
        public string url { get; set; }
        public int parallel { get;set; }
        public int times { get;set; }
    }


    public static class Monitor
    {
        static Monitor()
        {
            telemetry.InstrumentationKey = "905430be-f8c4-4b4f-a0e4-e085ccf9afee";
        }

        [FunctionName("Monitor")]
        public static async Task Run([QueueTrigger("fire9f99b255")]FireMessage message, ILogger log)
        {
            log.LogInformation($"C# Queue trigger function processed: {message}");
            for (var i = 0; i < message.times; i++) 
            {
                var tasks = Enumerable.Range(0, message.parallel)
                    .Select(_ => Ping(message.url));
                await Task.WhenAll(tasks);
            }
        }

        private static async Task Ping(string url)
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                var response = await client.GetAsync(url);
                var duration = stopwatch.ElapsedMilliseconds;
                var body = await response.Content.ReadAsStringAsync();
                var name = $"CloudBench_Fire_{body}";
                telemetry.TrackMetric(name, duration);
            }
            catch (Exception ex)
            {
                telemetry.TrackException(ex);
            }
        }

        private static HttpClient client = new HttpClient();
        private static TelemetryClient telemetry = new TelemetryClient();
    }
}
