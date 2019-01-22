module CloudBenchFlow.ColdStart

open System
open System.Diagnostics
open Microsoft.Azure.WebJobs
open Newtonsoft.Json
open DurableFunctions.FSharp
open Data
open System.Net.Http
open System.Net

let http = new HttpClient ()

let scenario =
    fun maxDelay ->
        let r = Random ()
        let seconds = maxDelay * 60
        [1 .. 100]
        |> List.map (fun _ -> r.Next seconds)
        |> List.map (fun seconds -> TimeSpan.FromSeconds (float seconds))
    |> Activity.define "Scenario"

let ping =     
    let impl (url: string) = async {
        let! _ = http.GetAsync "http://35.204.93.82/ping" |> Async.AwaitTask
        let stopwatch = Stopwatch.StartNew ()
        let! response = http.GetAsync url |> Async.AwaitTask
        let elapsed = stopwatch.Elapsed
        if response.StatusCode = HttpStatusCode.OK then
            let prop x = 
                if response.Headers.Contains x then response.Headers.GetValues x |> Seq.head
                else "-1"
            return {
                Name = prop "X-CB-Name"
                Instance = prop "X-CB-Instance"
                Count = prop "X-CB-Count" |> Int32.Parse
                Time = DateTime.UtcNow
                Latency = elapsed
            }
        else
            return {
                Name = sprintf "PingFailed %A" response.StatusCode
                Instance = url
                Count = 0
                Time = DateTime.UtcNow
                Latency = elapsed
            }
    }
    Activity.defineAsync "Ping" impl

let saveLogs =     
    let impl (responses: PingResponse list) = async {
        let first = List.head responses
        let filename = sprintf "ColdStart_%s_%s.json" first.Name (first.Time.ToString("yyyyMMddTHHmm"))
        let json = JsonConvert.SerializeObject responses
        do! Storage.save filename json
        return filename
    }
    Activity.defineAsync "SaveLogs" impl

let coldStartFlow (param: string) = orchestrator {
    let (url, maxDelay, count) =
        match param.Split(';') with
        | [|a|] -> a, 120, 100
        | [|a; b|] -> a, Int32.Parse b, 100
        | [|a; b; c|] -> a, Int32.Parse b, Int32.Parse c
        | _ -> failwith "Uknown argument of the workflow"

    let! delays = Activity.call scenario maxDelay

    let pingAndPause timespan = orchestrator {
        let! response = Activity.call ping url
        do! Orchestrator.delay timespan
        return response
    }

    let! responses =
        delays
        |> List.map pingAndPause
        |> Activity.seq

    let! filename = Activity.call saveLogs responses
    return filename
}

let testFlow (param: string) = orchestrator {
    let (url, maxDelay, count) =
        match param.Split(';') with
        | [|a|] -> a, 120, 100
        | [|a; b|] -> a, Int32.Parse b, 100
        | [|a; b; c|] -> a, Int32.Parse b, Int32.Parse c
        | _ -> failwith "Uknown argument of the workflow"

    let! delays = Activity.call scenario maxDelay

    let pingAndPause timespan = orchestrator {
        let! response = Activity.call ping url
        do! Orchestrator.delay timespan
        return response
    }

    let! responses =
        delays
        |> List.map pingAndPause
        |> Activity.seq

    let timings = responses |> List.map (fun x -> int x.Latency.TotalMilliseconds)
    return timings
}

[<FunctionName("Scenario")>]
let Scenario([<ActivityTrigger>] x : int) = Activity.run scenario x
  
[<FunctionName("Ping")>]
let Ping([<ActivityTrigger>] url) = Activity.run ping url

[<FunctionName("SaveLogs")>]
let SaveLogs([<ActivityTrigger>] responses) = Activity.run saveLogs responses

[<FunctionName("ColdStartFlow")>]
let Run ([<OrchestrationTrigger>] context: DurableOrchestrationContext) =
    Orchestrator.run (coldStartFlow, context)

[<FunctionName("TestFlow2")>]
let Run2 ([<OrchestrationTrigger>] context: DurableOrchestrationContext) =
    Orchestrator.run (testFlow, context)