using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Net;
using System.Threading.Tasks;

using Amazon;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;


[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]
namespace app
{
    public class Functions
    {
        private static string instance;
        private static string memory;
        private static int count = 0;

        public Functions()
        {
            var buf = File.ReadAllText("/proc/self/cgroup");
            var lines = buf.Split('\n');
            var line = lines[lines.Length - 3];
            var parts = line.Split('/');
            instance = $"AWS:{parts[1].Substring(13)}";
            memory = Environment.GetEnvironmentVariable("AWS_LAMBDA_FUNCTION_MEMORY_SIZE");
        }

        public async Task<APIGatewayProxyResponse> GetAsync(APIGatewayProxyRequest request, ILambdaContext context)
        {
            count += 1;

            return new APIGatewayProxyResponse
            {
                StatusCode = (int)HttpStatusCode.OK,
                Headers = new Dictionary<string, string>()
                {
                    { "Content-Type", "text/plain" },
                    { "X-CB-Name", $"AWS_CSNoop_{memory}" },
                    { "X-CB-Count", count.ToString() },
                    { "X-CB-Instance", instance },
                },
                Body = $"AWS_CSNoop_{memory}_{instance}"
            };
        }
    }
}
