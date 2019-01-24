module CloudBench.Model

open System
open Newtonsoft.Json
open MathNet.Numerics.Statistics

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

type ResponseAfterInterval = {
    Interval: TimeSpan
    State: Warmness
    Response: PingResponse
}

let coldStartIntervals (responses: PingResponse list) =
    responses
    |> List.pairwise
    |> List.filter (fun (previous, next) -> next.IsCold || next.Count = previous.Count + 1)
    |> List.map (fun (previous, next) -> 
        { Interval = next.StartTime - previous.Time
          State = if next.IsCold then Cold else Warm
          Response = next })

type ChartRoot = {
    points: obj list list
}

let palette = function
    | "CS" -> "green"
    | "JS" -> "blue"
    | _ -> "gray"

let serializePoints xs = 
    { points = xs }
    |> JsonConvert.SerializeObject

let probabilityChart (items: ResponseAfterInterval list) =
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
    |> serializePoints

let scatterChart (items: ResponseAfterInterval list) =
    let color x =
        match x with
        | Cold -> "blue"
        | Warm -> "red"
        |> sprintf "point {fill-color: %s}"
    items
    |> List.sortByDescending (fun x -> x.State)
    |> List.map (fun x -> x.Interval.TotalMinutes, x.Response.Latency.TotalSeconds, color x.State, x.Response.Time.ToString ("o"))
    |> List.filter (fun (i, _, _, _) -> i < 120.0)
    |> List.map (fun (t, v, c, dt) -> [t :> obj; v :> obj; c :> obj; dt :> obj])
    |> serializePoints

let coldStartDurations (responses: PingResponse list) =
    let (cold, warm) = responses |> List.partition (fun x -> x.IsCold)

    let averageWarm = warm |> List.averageBy (fun x -> x.Latency.TotalSeconds)

    cold
    |> List.map (fun x -> x.Latency.TotalSeconds - averageWarm)
    |> List.map (fun v -> if v >= 0.0 then v else 0.0)
    |> List.map (fun v -> [v :> obj])
    |> serializePoints

let coldStartComparison (responseMap: Map<string, PingResponse list>) = 
    let calculateStats (language, responses: PingResponse list) = 
        let durations = 
            responses
            |> List.filter (fun x -> x.IsCold)
            |> List.map (fun x -> x.Latency.TotalSeconds)            
            |> Seq.ofList
        let statistics = durations |> DescriptiveStatistics
        let color = palette language
        [
            language :> obj
            statistics.Mean :> obj
            statistics.Minimum :> obj
            statistics.Maximum :> obj
            Statistics.Percentile(durations, 16) :> obj
            Statistics.Percentile(durations, 84) :> obj
            sprintf "{color: %s; fill-color: %s}" color color :> obj
        ]
    
    responseMap
    |> Map.toList
    |> List.map calculateStats
    |> serializePoints