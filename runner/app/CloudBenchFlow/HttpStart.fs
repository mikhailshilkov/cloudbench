namespace CloudBenchFlow

open System.Net.Http
open Microsoft.Azure.WebJobs
open Microsoft.Azure.WebJobs.Extensions.Http
open Microsoft.Extensions.Logging

module Starters = 

  [<FunctionName("HttpStart")>]
  let RunSync
     ([<HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "orchestrators/{functionName}")>] req: HttpRequestMessage,
      [<OrchestrationClient>] starter: DurableOrchestrationClient,
      functionName: string,
      log: ILogger) =
      let param = req.RequestUri.ParseQueryString().["input"]
      let instanceId = starter.StartNewAsync (functionName, param)

      log.LogInformation(sprintf "Started orchestration with ID = '{%s}'." instanceId.Result)
      starter.CreateCheckStatusResponse(req, instanceId.Result)

  [<FunctionName("HttpSyncStart")>]
  let RunAsync
     ([<HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "orchestrators/{functionName}/wait")>] req: HttpRequestMessage,
      [<OrchestrationClient>] starter: DurableOrchestrationClient,
      functionName: string,
      log: ILogger) =
    async {
      let param = req.RequestUri.ParseQueryString().["input"]
      let! instanceId = starter.StartNewAsync (functionName, param) |> Async.AwaitTask

      log.LogInformation(sprintf "Started orchestration with ID = '{%s}'." instanceId)

      return! starter.WaitForCompletionOrCreateCheckStatusResponseAsync(req, instanceId) |> Async.AwaitTask
    }
    |> Async.StartAsTask