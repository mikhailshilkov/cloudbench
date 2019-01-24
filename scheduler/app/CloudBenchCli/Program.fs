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
    let urls name =
        (urlsSection.GetSection name).GetChildren ()
        |> Seq.map (fun x -> x.Value) 
        |> List.ofSeq

    let commands = Commands.make storage starter

    for part in parts do
        match part with

        | ScheduleColdStarts ->
            do! commands.Trigger (urls "Azure") 40
            //do! commands.Trigger (urls "AWS") 120
            //do! commands.Trigger (urls "GCP") 120
        
        | ColdStartIntervals ->
            do! commands.ColdStartInterval "Azure"
            //do! commands.ColdStartInterval "AWS"
            //do! commands.ColdStartInterval "GCP"
        
        | ColdStartDurations ->
            do! commands.ColdStartDuration "Azure" ["CS"; "JS"]
            //do! commands.ColdStartDuration "AWS_CS"
            //do! commands.ColdStartDuration "AWS_JS"
}

[<EntryPoint>]
let main _ =
    Async.RunSynchronously (impl [ColdStartDurations])
    0
