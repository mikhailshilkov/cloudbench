using System;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Net;
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
            telemetry.InstrumentationKey = Environment.GetEnvironmentVariable("ApplicationInsights:InstrumentationKey", EnvironmentVariableTarget.Process);
        }

        [FunctionName("TimerFire")]
        public static async Task Run([TimerTrigger("%Schedule%")] TimerInfo info, ILogger log, CancellationToken token)
        {
            log.LogInformation($"C# Timer trigger function running at {info}");
            var urls = 
                Environment
                    .GetEnvironmentVariable("TargetUrl", EnvironmentVariableTarget.Process)
                    .Split(',');
            var url = urls[DateTime.UtcNow.Hour % urls.Length];
            
            var a = Convert.ToInt32(Environment.GetEnvironmentVariable("LinearK", EnvironmentVariableTarget.Process));
            var b = Convert.ToDouble(Environment.GetEnvironmentVariable("QuadraticK", EnvironmentVariableTarget.Process), CultureInfo.InvariantCulture);

            var overallTime = Stopwatch.StartNew();

            var totalCount = 0;

            while (overallTime.Elapsed < TimeSpan.FromSeconds(10 * 60 - 1))
            {
                var secondsPassed = overallTime.Elapsed.TotalSeconds;
                var plannedCount = (int)(a * secondsPassed + b * (secondsPassed * secondsPassed));

                var missingCount = plannedCount - totalCount;
                if (missingCount > 0)
                {
                    for (int i = 0; i < missingCount; i++) 
                    {
                        var counter = Interlocked.Read(ref ActiveRequests);
                        if (counter > 200) break;
                        Ping(url).ContinueWith(OnAsyncMethodFailed, token, TaskContinuationOptions.OnlyOnFaulted, TaskScheduler.Default);
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
                string name;
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var body = await response.Content.ReadAsStringAsync();
                    name = $"CloudBench_Fire_{body}";
                }
                else
                {
                    var hash = url.Split('/').Last();
                    name = $"CloudBench_Fire_{response.StatusCode}_{hash}";

                }
                var duration = stopwatch.ElapsedMilliseconds;
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
