namespace CloudBenchCli

open System.Net.Http
open Newtonsoft.Json
open CloudBench.Model

type ICommands =
   abstract member Trigger: name: string list -> interval: int -> count: int -> Async<unit>
   abstract member ColdStartInterval: name: string -> Async<unit>
   abstract member ColdStartDuration: cloud: string -> grouping: string -> classifier: (string -> LegendItem option) -> Async<unit>

type IWorkflowStarter =
   abstract member RunColdStart: functionUrl: string -> interval: int -> count: int -> Async<unit>


module Commands =

    let workflowStarter (schedulerUrl: string) =
        let http = new HttpClient ()

        { new IWorkflowStarter with 
            member __.RunColdStart functionUrl interval count = async {
                let url = sprintf "%s?input=%s;%i;%i" schedulerUrl functionUrl interval count
                do! http.GetAsync url |> Async.AwaitTask |> Async.Ignore
            }
        }

    let make (storage: IStorage) (starter: IWorkflowStarter) =

        let loadFile blob = async {
            let! contents = storage.Load blob
            return blob.Name, contents
        }

        let coldStartInterval name = async {
            let! blobs = storage.List (sprintf "ColdStart_%s_" name)
            let! files = Async.Parallel (blobs |> List.map loadFile)
            let files = files |> List.ofArray

            let responses = 
                files 
                |> List.map snd 
                |> List.map JsonConvert.DeserializeObject<PingResponse list>

            let intervals = 
                responses
                |> List.map (fun rs -> coldStartIntervals rs)
                |> List.concat

            let chart = probabilityChart intervals
            do storage.Save (sprintf "ColdStart_%s_Interval.json" name) chart

            let chart = scatterChart intervals
            do storage.Save (sprintf "ColdStart_%s_Scatter.json" name) chart

            do storage.Zip (sprintf "ColdStart_%s.zip" name) files
        }

        let coldStartDuration cloud grouping (classifier: string -> LegendItem option) = async {

            let prefix = sprintf "ColdStart_%s_" cloud
            let! blobs = storage.List prefix
            let relevant =
                blobs
                |> List.choose (fun blob ->
                    blob.Name.Replace (prefix, "")                    
                    |> classifier 
                    |> Option.map (fun g -> g, blob))
                |> List.groupBy fst
                |> List.map (fun (key, value) -> key, value |> List.map snd)
            let! durationsByGroup =
                relevant
                |> List.map (fun (group, blobs) -> async {
                    let! files = Async.Parallel (blobs |> List.map loadFile)
                    let files = files |> List.ofArray

                    let responses = 
                        files 
                        |> List.map snd 
                        |> List.map JsonConvert.DeserializeObject<PingResponse list>
                        |> List.concat

                    let durations = coldStartDurations responses
                    storage.Save (sprintf "ColdStart_%s_%s.json" cloud group.Name) durations

                    do storage.Zip (sprintf "ColdStart_%s_%s.zip" cloud group.Name) files

                    return group, responses
                })
                |> Async.Parallel

            let summary =
                durationsByGroup
                |> Map.ofArray
                |> coldStartComparison

            storage.Save (sprintf "ColdStart_%s_by%s.json" cloud grouping) summary
        }

        let trigger (urls: string list) interval count = async {
            for url in urls do
                do! starter.RunColdStart url interval count
        }

        { new ICommands with 
            member __.ColdStartInterval name = coldStartInterval name
            member __.ColdStartDuration cloud grouping classifier = coldStartDuration cloud grouping classifier
            member __.Trigger urls interval count = trigger urls interval count
        }

