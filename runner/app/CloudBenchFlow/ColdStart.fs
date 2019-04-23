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

type ScenarioOptions = {
    MinDelay: TimeSpan
    MaxDelay: TimeSpan
    Count: int
}

let scenario =
    fun (options: ScenarioOptions) ->
        let r = Random ()
        let minSeconds = int options.MinDelay.TotalSeconds
        let maxSeconds = int options.MaxDelay.TotalSeconds
        [1 .. options.Count]
        |> List.map (fun _ -> minSeconds + (r.Next (maxSeconds - minSeconds)))
        |> List.map (fun seconds -> TimeSpan.FromSeconds (float seconds))
    |> Activity.define "Scenario"

let ping =     
    let impl (url: string) = async {
        let! _ = http.GetAsync "http://35.204.93.82/ping" |> Async.AwaitTask
        let stopwatch = Stopwatch.StartNew ()
        try
            let! response = http.GetAsync url |> Async.AwaitTask
            let elapsed = stopwatch.Elapsed
            let alias = url.Split '/' |> Array.last
            if response.StatusCode = HttpStatusCode.OK then
                let prop x def = 
                    if response.Headers.Contains x then response.Headers.GetValues x |> Seq.head
                    else def
                return {
                    Name = prop "X-CB-Name" alias
                    Instance = prop "X-CB-Instance" "???"
                    Count = prop "X-CB-Count" "-1" |> Int32.Parse
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
        with e ->
            let elapsed = stopwatch.Elapsed
            return {
                    Name = sprintf "PingFailed %A" e
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
    let (url, minDelay, maxDelay, count) =
        match param.Split(';') with
        | [|a|] -> a, 0, 120, 100
        | [|a; b|] -> a, 0, Int32.Parse b, 100
        | [|a; b; c|] -> a, 0, Int32.Parse b, Int32.Parse c
        | [|a; b; c; d|] -> a, Int32.Parse b, Int32.Parse c, Int32.Parse d
        | _ -> failwith "Uknown argument of the workflow"

    let parameters = 
        { MinDelay = TimeSpan.FromMinutes (float minDelay)
          MaxDelay = TimeSpan.FromMinutes (float maxDelay)
          Count = count }
    let! delays = Activity.call scenario parameters

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

[<FunctionName("Scenario")>]
let Scenario([<ActivityTrigger>] x : ScenarioOptions) = Activity.run scenario x
  
[<FunctionName("Ping")>]
let Ping([<ActivityTrigger>] url) = Activity.run ping url

[<FunctionName("SaveLogs")>]
let SaveLogs([<ActivityTrigger>] responses) = Activity.run saveLogs responses

[<FunctionName("ColdStartFlow")>]
let Run ([<OrchestrationTrigger>] context: DurableOrchestrationContext) =
    Orchestrator.run (coldStartFlow, context)