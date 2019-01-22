module CloudBenchCli.Program

open Microsoft.Extensions.Configuration

type Parts = 
    | ScheduleColdStarts
    | ColdStartIntervals
    | ColdStartDurations

let impl parts = async {
    let config = 
        ConfigurationBuilder()
          .AddJsonFile("appsettings.json", true, true)
          .Build()

    let storageConnectionString = config.["AzureStorage"]
    let outputFolder = config.["OutputFolder"]

    let urlsSection = config.GetSection "Urls"
    

    let storage = Storage.make storageConnectionString "cloudbench" outputFolder
    let starter = Commands.workflowStarter (urlsSection.["Scheduler"])
    let commands = Commands.make storage starter

    for part in parts do
        match part with

        | ScheduleColdStarts ->
            let gcp = (urlsSection.GetSection "GCP").GetChildren ()
            let urls = gcp |> Seq.map (fun x -> x.Value) |> List.ofSeq
            do! commands.Trigger urls
        
        | ColdStartIntervals ->
            do! commands.ColdStartInterval "Azure"
            do! commands.ColdStartInterval "AWS"
            do! commands.ColdStartInterval "GCP"
        
        | ColdStartDurations ->
            //do! commands.ColdStartDuration "Azure_CS"
            //do! commands.ColdStartDuration "Azure_JS"
            //do! commands.ColdStartDuration "AWS_CS"
            do! commands.ColdStartDuration "AWS_JS"
}

[<EntryPoint>]
let main _ =
    Async.RunSynchronously (impl [ScheduleColdStarts])
    0
