namespace CloudBenchCli

open System.Net.Http
open Newtonsoft.Json
open CloudBench.Model

type ICommands =
   abstract member Trigger: name: string list -> Async<unit>
   abstract member ColdStartInterval: name: string -> Async<unit>
   abstract member ColdStartDuration: name: string -> Async<unit>

type IWorkflowStarter =
   abstract member RunColdStart: functionUrl: string -> interval: int -> Async<unit>

module Commands =

    let workflowStarter (schedulerUrl: string) =
        let http = new HttpClient ()

        { new IWorkflowStarter with 
            member __.RunColdStart functionUrl interval = async {
                let url = sprintf "%s?input=%s;%i" schedulerUrl functionUrl interval
                do! http.GetAsync url |> Async.AwaitTask |> Async.Ignore
            }
        }

    let make (storage: IStorage) (starter: IWorkflowStarter) =

        let loadLogs blob = async {
            let! json = storage.Load blob
            let responses = JsonConvert.DeserializeObject<PingResponse list> json
            return responses
        }

        let coldStartInterval name = async {
            let! blobs = storage.List (sprintf "ColdStart_%s_" name)

            let! responses = Async.Parallel (blobs |> List.map loadLogs)

            let intervals = 
                responses
                |> Array.map (fun rs -> coldStartIntervals rs)
                |> List.concat

            let chart = probabilityChart intervals
            do storage.Save (sprintf "ColdStart_%s_Interval.json" name) chart

            let chart = scatterChart intervals
            do storage.Save (sprintf "ColdStart_%s_Scatter.json" name) chart
        }

        let coldStartDuration name = async {
            let! blobs = storage.List (sprintf "ColdStart_%s_" name)

            let! responses = Async.Parallel (blobs |> List.map loadLogs)
            let responses = List.concat responses

            let durations = coldStartDurations responses

            do storage.Save (sprintf "ColdStart_%s.json" name) durations
        }

        let trigger (urls: string list) = async {
            for url in urls do
                do! starter.RunColdStart url 120
        }

        { new ICommands with 
            member __.ColdStartInterval name = coldStartInterval name
            member __.ColdStartDuration name = coldStartDuration name
            member __.Trigger urls = trigger urls
        }

