namespace CloudBenchCli

open System.Net.Http
open Newtonsoft.Json
open CloudBench.Model

type ICommands =
   abstract member Trigger: name: string list -> interval: int -> count: int -> Async<unit>
   abstract member ColdStartInterval: name: string -> maxInterval : int -> selector: (string -> bool) -> Async<unit>
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

        let parseFile (_: string, content: string) = 
            JsonConvert.DeserializeObject<PingResponse list> content
            |> List.filter (fun r -> r.Count > 0) // remove failed requests

        let coldStartInterval cloud maxInterval (selector: string -> bool) = async {
            let! blobs = storage.List (sprintf "ColdStart_%s_" cloud)
            let matchingBlobs = blobs |> List.filter (fun blob -> selector blob.Name)
            let! files = Async.Parallel (matchingBlobs |> List.map loadFile)
            let files = files |> List.ofArray

            let responses = 
                files 
                |> List.map parseFile

            let intervals = 
                responses
                |> List.map (fun rs -> coldStartIntervals rs)
                |> List.concat

            let chart = 
                match cloud with
                | "Azure" -> probabilityChart2 maxInterval 1 intervals 
                | "GCP" -> probabilityChart2 maxInterval 20 intervals 
                | _ -> probabilityChart maxInterval intervals
            do storage.Save (sprintf "ColdStart_%s_Interval.json" cloud) chart

            let chart = scatterChart maxInterval intervals
            do storage.Save (sprintf "ColdStart_%s_Scatter.json" cloud) chart

            do storage.Zip (sprintf "ColdStart_%s.zip" cloud) files
        }

        let coldStartDuration cloud grouping (classifier: string -> LegendItem option) = async {

            let prefix = sprintf "ColdStart_%s" cloud
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
                        |> List.map parseFile
                        |> List.concat

                    let durations = coldStartDurations group.Color responses
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
            member __.ColdStartInterval name maxInterval selector = coldStartInterval name maxInterval selector
            member __.ColdStartDuration cloud grouping classifier = coldStartDuration cloud grouping classifier
            member __.Trigger urls interval count = trigger urls interval count
        }

