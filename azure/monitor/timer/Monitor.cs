using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.ApplicationInsights;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;

namespace CloudBench
{
    public static class Monitor
    {
        static Monitor()
        {
            telemetry.InstrumentationKey = "905430be-f8c4-4b4f-a0e4-e085ccf9afee";
        }

        [FunctionName("TimerFire")]
        public static async Task Run([TimerTrigger("0 0 * * * *")] TimerInfo info, ILogger log, CancellationToken token)
        {
            log.LogInformation($"C# Timer trigger function running at {info}");
            var url = Environment.GetEnvironmentVariable("TargetUrl");

            var overallTime = Stopwatch.StartNew();

            var totalCount = 0;

            while (overallTime.Elapsed < TimeSpan.FromSeconds(5 * 60 - 1))
            {
                var secondsPassed = overallTime.Elapsed.TotalSeconds;
                var plannedCount = secondsPassed * 10 + (secondsPassed * secondsPassed);

                var missingCount = (int)(plannedCount - totalCount);
                if (missingCount > 0)
                {
                    for (int i = 0; i < missingCount; i++) 
                    {
                        var counter = Interlocked.Read(ref ActiveRequests);
                        if (counter > 200) break;
                        Ping("").ContinueWith(OnAsyncMethodFailed, token, TaskContinuationOptions.OnlyOnFaulted, TaskScheduler.Default);
                        totalCount ++;
                    }
                }

                await Task.Delay(TimeSpan.FromMilliseconds(10));
            }
        }

        private static async Task Ping(string url)
        {
            try
            {
                Interlocked.Increment(ref ActiveRequests);
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
            finally
            {
                Interlocked.Decrement(ref ActiveRequests);
            }
        }

        private static void OnAsyncMethodFailed(Task task)
        {
            // TODO
        }

        private static HttpClient client = new HttpClient();
        private static TelemetryClient telemetry = new TelemetryClient();

        private static long ActiveRequests = 0;
    }
}
