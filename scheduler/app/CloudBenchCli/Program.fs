module CloudBenchCli.Program

open System
open Microsoft.Extensions.Configuration
open CloudBench.Model

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
    let outputFolders = config.["OutputFolders"].Split ',' |> List.ofArray

    let urlsSection = config.GetSection "Urls"
    

    let storage = Storage.make storageConnectionString "cloudbench" outputFolders
    let starter = Commands.workflowStarter (urlsSection.["Scheduler"])
    let urls name =
        (urlsSection.GetSection name).GetChildren ()
        |> Seq.map (fun x -> x.Value) 
        |> List.ofSeq

    let commands = Commands.make storage starter

    for part in parts do
        match part with

        | ScheduleColdStarts ->
            //do! commands.Trigger (urls "Azure") 40 200
            do! commands.Trigger (urls "AWS") 120 100
            //do! commands.Trigger (urls "GCP") 300 50
        
        | ColdStartIntervals ->
            //do! commands.ColdStartInterval "Azure"
            do! commands.ColdStartInterval "AWS_JSNoop"
            do! commands.ColdStartInterval "AWS_CSNoop"
            do! commands.ColdStartInterval "AWS_PythonNoop"
            //do! commands.ColdStartInterval "GCP"
        
        | ColdStartDurations ->
            let language (name: string) =
                if name.Contains "VPC" then None
                else 
                    let lang = ((name.Split '_').[0].Replace("Noop", ""))
                    match lang with
                    | "JS" -> { Label = "JavaScript"; Order = 1; Color = Some "#F1E05A" }
                    | "Python" -> { Label = "Python"; Order = 2; Color = Some "#3572A5" }
                    | "CS" -> { Label = "C#"; Order = 3; Color = Some "#178600" }
                    | v -> { Label = v; Order = 10; Color = None }
                    |> Some 
            let memory (name: string) =
                if name.Contains "VPC" then None
                elif name.Contains "JSNoop" then 
                    let memory = (name.Split '_').[1]
                    Some { Label = memory + " MB"; Order = Int32.Parse memory; Color = None }
                else None
            let vpc (name: string) =                
                if name.Contains "JSNoop" then 
                    if name.Contains "VPC" 
                    then { Label = "VPC"; Order = 2; Color = Some "red" }
                    else { Label = "No VPC"; Order = 1; Color = Some "green" }
                    |> Some 
                else None
            //do! commands.ColdStartDuration "Azure" ["CS"; "JS"] all
            //do! commands.ColdStartDuration "AWS" "language" language
            //do! commands.ColdStartDuration "AWS" "memory" memory
            //do! commands.ColdStartDuration "AWS" "vpc" vpc
            do! commands.ColdStartDuration "GCP" "language" language
            do! commands.ColdStartDuration "GCP" "memory" memory
}

[<EntryPoint>]
let main _ =
    Async.RunSynchronously (impl [ScheduleColdStarts])
    0
