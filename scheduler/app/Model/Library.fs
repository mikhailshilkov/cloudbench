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

type LegendItem = {
    Label: string
    Order: int
    Color: string option
}

let serializePoints xs = 
    { points = xs }
    |> JsonConvert.SerializeObject

let percentile (xs: float list) (p: float) = 
    Statistics.Quantile(xs |> Seq.ofList, p / 100.)

let probabilityChart (items: ResponseAfterInterval list) =
    [0..600]
    |> List.map (fun x -> float x / 5.)
    |> List.choose (fun m -> 
                    let timespan = TimeSpan.FromMinutes m
                    let colds = 
                        items 
                        |> List.filter (fun x -> x.Interval <= timespan)
                        |> List.filter (fun x -> match x.State with | Cold -> true | Warm -> false) 
                        |> List.length
                    let warms = 
                        items 
                        |> List.filter (fun x -> x.Interval >= timespan)
                        |> List.filter (fun x -> match x.State with | Cold -> false | Warm -> true) 
                        |> List.length
                    if colds = 0 && warms = 0 then None
                    else Some (m, (float colds / float (colds + warms)))
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

let coldStartComparison (responseMap: Map<LegendItem, PingResponse list>) = 
    let calculateStats (item: LegendItem, responses: PingResponse list) = 
        let durations = 
            responses
            |> List.filter (fun x -> x.IsCold)
            |> List.map (fun x -> x.Latency.TotalSeconds)            
        let percentiles = percentile durations
        let color = 
            item.Color 
            |> Option.map (fun color -> sprintf "{color: %s; fill-color: %s}" color color)
            |> Option.defaultValue ""
        [
            item.Label :> obj
            percentiles 50. :> obj
            percentiles 2.5 :> obj
            percentiles 97.5 :> obj
            percentiles 16. :> obj
            percentiles 84. :> obj
            color :> obj
        ]
    
    responseMap
    |> Map.toList
    |> List.sortBy (fun (x, _) -> x.Order)
    |> List.map calculateStats
    |> serializePoints