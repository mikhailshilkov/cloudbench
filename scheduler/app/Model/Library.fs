module CloudBench.Model

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
    Latency: TimeSpan
    Time: DateTime
    State: Warmness
}

let coldStartIntervals (responses: PingResponse list) =
    responses
    |> List.pairwise
    |> List.map (fun (previous, next) -> 
        { Interval = next.StartTime - previous.Time
          Latency = next.Latency
          Time = next.Time
          State = if next.IsCold then Cold else Warm })

type ChartRoot = {
    points: obj list list
}

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
    |> fun xs -> { points = ["Time" :> obj; "Probability" :> obj] :: xs }
    |> JsonConvert.SerializeObject

let scatterChart (items: ColdOrWarm list) =
    let color x =
        match x with
        | Cold -> "blue"
        | Warm -> "red"
        |> sprintf "point {fill-color: %s}"
    items
    |> List.sortByDescending (fun x -> x.State)
    |> List.map (fun x -> x.Interval.TotalMinutes, x.Latency.TotalSeconds, color x.State, x.Time.ToString ("o"))
    |> List.filter (fun (i, _, _, _) -> i < 120.0)
    |> List.map (fun (t, v, c, dt) -> [t :> obj; v :> obj; c :> obj; dt :> obj])
    |> fun xs -> { points = xs }
    |> JsonConvert.SerializeObject

let coldStartDurations (responses: PingResponse list) =
    let (cold, warm) = responses |> List.partition (fun x -> x.IsCold)

    let averageWarm = warm |> List.averageBy (fun x -> x.Latency.TotalSeconds)

    cold
    |> List.map (fun x -> x.Latency.TotalSeconds - averageWarm)
    |> List.map (fun v -> if v >= 0.0 then v else 0.0)
    |> List.map (fun v -> [v :> obj])
    |> fun xs -> { points = ["Duration (sec)" :> obj] :: xs }
    |> JsonConvert.SerializeObject
