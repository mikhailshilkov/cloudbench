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
    |> List.filter (fun (previous, next) -> next.IsCold || (next.Instance = previous.Instance && next.Count = previous.Count + 1))
    |> List.map (fun (previous, next) -> 
        { Interval = next.StartTime - previous.Time
          State = if next.IsCold then Cold else Warm
          Response = next })

type ChartRoot = {
    points: obj list list
    color: obj
}

type LegendItem = {
    Name: string
    Label: string
    Order: int
    Color: string option
}

let serializePointsColor c xs = 
    { points = xs; color = c }
    |> JsonConvert.SerializeObject

let serializePoints xs = serializePointsColor null xs

let percentile (xs: float list) (p: float) = 
    Statistics.Quantile(xs |> Seq.ofList, p / 100.)

let probabilityChart maxInterval (items: ResponseAfterInterval list) =
    let values =
        items 
        |> List.sortBy (fun x -> x.Interval)
        |> List.fold (fun (acc, warms) item ->
            match item.State with
            | Warm -> acc, item :: warms
            | Cold -> 
                match warms with
                | [] -> acc, warms
                | warm :: rest ->
                    if item.Interval - warm.Interval < TimeSpan.FromMinutes 2. 
                    then warm.Interval :: acc, rest
                    else acc, []) ([], [])
        |> fst

    let total = values |> List.length |> float
    [0..maxInterval]
    |> List.map (fun m -> 
                    let timespan = TimeSpan.FromMinutes (float m)
                    let count = values |> List.filter (fun x -> x < timespan) |> List.length
                    m, (float count / total)
                )
    |> List.map (fun (t, v) -> [t :> obj; v :> obj])
    |> serializePoints

let probabilityChart2 maxInterval step (items: ResponseAfterInterval list) =
    let rec smoothen = function
        | [] -> []
        | (va, a) :: rest ->
            let smaller = rest |> List.takeWhile (fun (_, x) -> x < a)
            match smaller with
            | [] -> (va, a) :: smoothen rest
            | _ ->
                let sum = a + (smaller |> List.map snd |> List.sum) |> float
                let count = List.length smaller
                let avg = sum / float (count + 1)
                List.append ((va, a) :: smaller |> List.map (fun (vx, _) -> vx, avg)) (rest |> List.skip count |> smoothen)
                
    let colds = 
        items 
        |> List.filter (fun x -> match x.State with | Cold -> true | Warm -> false)
    [1..maxInterval/step]
    |> List.map (fun x -> float (step * x))
    |> List.map (fun m -> 
        let startTime = TimeSpan.FromMinutes (m - float step / 2.)
        let time = TimeSpan.FromMinutes m
        let endTime = TimeSpan.FromMinutes (m + float step / 2.)
        let coldCount = 
            colds 
            |> List.filter (fun x -> startTime <= x.Interval && x.Interval < endTime)
            |> List.length
        let total =
            items 
            |> List.filter (fun x -> startTime <= x.Interval && x.Interval < endTime)
            |> List.length
        time.TotalMinutes, (float coldCount / float total))
    |> List.filter (fun (_, y) -> Double.IsNaN y |> not)    
    |> smoothen
    |> List.append [(0., 0.)]
    |> List.map (fun (t, v) -> [t :> obj; v :> obj])
    |> serializePoints

let scatterChart max (items: ResponseAfterInterval list) =
    let color x =
        match x with
        | Cold -> "blue"
        | Warm -> "red"
        |> sprintf "point {fill-color: %s}"
    let r = Random ()
    items
    |> List.map (fun x -> x.Interval.TotalMinutes, x.Response.Latency.TotalSeconds, color x.State)
    |> List.filter (fun (i, _, _) -> i < (float max))
    |> List.sortBy (fun _ -> r.Next())
    |> List.truncate 300
    |> List.map (fun (t, v, c) -> [t :> obj; v :> obj; c :> obj])
    |> serializePoints

let calculateColdDurations (responses: PingResponse list) = 
    let (cold, warm) = responses |> List.partition (fun x -> x.IsCold)

    let warmDelay =
        match warm with
        | [] -> 0.0
        | xs -> 
            let percentiles = percentile (xs |> List.map (fun x -> x.Latency.TotalSeconds))
            percentiles 16.
  
    cold
    |> List.map (fun x -> x.Latency.TotalSeconds - warmDelay)
    |> List.map (fun v -> if v >= 0.0 then v else 0.0)

let calculateExternalDurations (responses: PingResponse list) = 
    responses
    |> List.map (fun x -> x.Latency.TotalSeconds)
    |> List.filter (fun x -> x > 1.5)

let coldStartDurations (color: string option) (responses: PingResponse list) =
    calculateColdDurations responses
    |> List.map (fun v -> [v :> obj])
    |> serializePointsColor (Option.toObj color)

let coldStartComparison calculateDurations (responseMap: Map<LegendItem, PingResponse list>) = 
    let calculateStats (item: LegendItem, responses: PingResponse list) = 
        let durations = calculateDurations responses
        let percentiles = percentile durations
        let color = 
            item.Color 
            |> Option.map (fun color -> sprintf "{color: %s; fill-color: %s}" color color)
            |> Option.defaultValue ""
        let median = percentiles 50.
        [
            item.Label :> obj
            median :> obj
            (sprintf "Median: %.1fs" median) :> obj
            //percentiles 50. :> obj
            //percentiles 90. :> obj
            //percentiles 95. :> obj
            //percentiles 99. :> obj
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