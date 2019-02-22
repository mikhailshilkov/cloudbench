module CloudBenchFlow.Data

open System
open Newtonsoft.Json

type PingResponse = {
    Name: string
    Instance: string
    Count: int
    Time: DateTime
    Latency: TimeSpan
}
with member x.StartTime = x.Time - x.Latency
     member x.IsCold = x.Count = 1

type Warmness = Cold | Warm

type ColdOrWarm = {
    Interval: TimeSpan
    State: Warmness
}

let coldStartIntervals (responses: PingResponse list) =
    responses
    |> List.sortBy (fun response -> response.Time)
    |> List.pairwise
    |> List.map (fun (previous, next) -> 
        { Interval = next.StartTime - previous.Time
          State = if next.IsCold then Cold else Warm })

let probabilityChart (items: ColdOrWarm list) =
    [0..40]
    |> List.map (fun m -> 
                    let timespan = TimeSpan.FromMinutes (float m)
                    let colds = 
                        items 
                        |> List.filter (fun x -> x.Interval < timespan)
                        |> List.filter (fun x -> match x.State with | Cold -> true | Warm -> false) 
                        |> List.length
                    let warms = 
                        items 
                        |> List.filter (fun x -> x.Interval > timespan)
                        |> List.filter (fun x -> match x.State with | Cold -> false | Warm -> true) 
                        |> List.length
                    m, (float colds / float (colds + warms))
                )
    |> List.map (fun (t, v) -> [t :> obj; v :> obj])
    |> fun xs -> ["Time" :> obj; "Probability" :> obj] :: xs
    |> JsonConvert.SerializeObject

let coldStartDurations (responses: PingResponse list) =
    responses
    |> List.filter (fun x -> x.IsCold)
    |> List.map (fun x -> x.Latency.TotalSeconds)
    |> List.map (fun v -> [v :> obj])
    |> fun xs -> ["Duration (sec)" :> obj] :: xs
    |> JsonConvert.SerializeObject
