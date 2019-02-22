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
            //do! commands.Trigger (urls "Azure") 20 100
            do! commands.Trigger (urls "AWS") 90 100
            //do! commands.Trigger (urls "GCP") 300 50
        
        | ColdStartIntervals ->
            do! commands.ColdStartInterval "Azure" 30 (fun filename -> filename.Contains "Python" |> not)
            do! commands.ColdStartInterval "AWS" 90 (fun _ -> true)
            do! commands.ColdStartInterval "GCP" 300 (fun _ -> true)
        
        | ColdStartDurations ->
            let languageWindows (name: string) =
                if name.Contains "Deps" then None
                elif name.Contains "V1" then None
                else 
                    let lang = (name.Split '_').[1].Replace("Noop", "")
                    match lang with
                    | "CS" -> Some { Name = "CSharp"; Label = "C#"; Order = 1; Color = Some "#178600" }
                    | "JS" -> Some { Name = "JS"; Label = "JavaScript"; Order = 2; Color = Some "#F1E05A" }
                    | "Java" -> Some { Name = "Java"; Label = "Java (preview)"; Order = 3; Color = Some "#B07219" }
                    | _ -> None
            let languageGcp (name: string) =
                if name.Contains "Deps" then None
                else 
                    let lang = (name.Split '_').[1].Replace("Noop", "")
                    match lang with
                    | "JS" -> { Name = "JS"; Label = "JavaScript"; Order = 1; Color = Some "#F1E05A" }
                    | "Go" -> { Name = "Go"; Label = "Go (beta)"; Order = 2; Color = Some "#375EAB" }
                    | "Python" -> { Name = "Python"; Label = "Python (beta)"; Order = 3; Color = Some "#3572A5" }
                    | v -> { Name = v; Label = "??" + v; Order = 10; Color = None }
                    |> Some 
            let language (name: string) =
                if name.Contains "VPC" then None
                elif name.Contains "Deps" then None
                elif name.Contains "V1" then None
                else 
                    let lang = (name.Split '_').[1].Replace("Noop", "")
                    match lang with
                    | "JS" -> { Name = "JS"; Label = "JavaScript"; Order = 1; Color = Some "#F1E05A" }
                    | "Python" -> { Name = "Python"; Label = "Python"; Order = 2; Color = Some "#3572A5" }
                    | "Go" -> { Name = "Go"; Label = "Go"; Order = 3; Color = Some "#375EAB" }
                    | "Java" -> { Name = "Java"; Label = "Java"; Order = 4; Color = Some "#B07219" }
                    | "Ruby" -> { Name = "Ruby"; Label = "Ruby"; Order = 5; Color = Some "#701516" }
                    | "CS" -> { Name = "CSharp"; Label = "C#"; Order = 6; Color = Some "#178600" }
                    | v -> { Name = v; Label = "??" + v; Order = 10; Color = None }
                    |> Some 
            let cloudLanguage (name: string) =
                if name.Contains "VPC" then None
                elif name.Contains "Deps" then None
                elif name.Contains "V1" then None
                else 
                    let parts = name.Split '_'
                    let cloud = parts.[0]
                    let cloudOrder = match cloud with | "Azure" -> 20 | "GCP" -> 10 | _ -> 0
                    let lang = parts.[1].Replace("Noop", "")
                    match cloud, lang with
                    | _, "JS" -> Some { Name = "JS"; Label = "JavaScript"; Order = 1; Color = Some "#F1E05A" }
                    | _, "CS" -> Some { Name = "CSharp"; Label = "C#"; Order = 6; Color = Some "#178600" }
                    | "AWS", "Python" -> Some { Name = "Python"; Label = "Python"; Order = 2; Color = Some "#3572A5" }
                    | "AWS", "Go" -> Some { Name = "Go"; Label = "Go"; Order = 3; Color = Some "#375EAB" }
                    | "AWS", "Java" -> Some { Name = "Java"; Label = "Java"; Order = 4; Color = Some "#B07219" }
                    | "AWS", "Ruby" -> Some { Name = "Ruby"; Label = "Ruby"; Order = 5; Color = Some "#701516" }
                    | v -> None
                    |> Option.map (fun x -> { x with Name = cloud + x.Name; Label = cloud + " " + x.Label; Order = cloudOrder + x.Order })
            let v1v2 (name: string) =
                if name.Contains "Deps" then None
                elif name.Contains "Python" then None
                elif name.Contains "Java" then None
                else 
                    let lang = ((name.Split '_').[1].Replace("Noop", ""))
                    let version = if name.Contains "V1" then "V1" else "V2"
                    match lang, version with
                    | "JS", "V2" -> { Name = "V2JS"; Label = "V2 JavaScript"; Order = 4; Color = Some "#F1E05A" }
                    | "CS", "V2" -> { Name = "V2CSharp"; Label = "V2 C#"; Order = 2; Color = Some "#178600" }
                    | "JS", "V1" -> { Name = "V1JS"; Label = "V1 JavaScript"; Order = 3; Color = Some "#D8C741" }
                    | "CS", "V1" -> { Name = "V1CSharp"; Label = "V1 C#"; Order = 1; Color = Some "#005300" }
                    | v, _ -> { Name = v; Label = "??" + v; Order = 10; Color = None }
                    |> Some 
            let dependencies (name: string) =
                if name.Contains "VPC" then None
                elif name.Contains "V1" then None
                else
                    let parts = name.Split '_'
                    let cloud = parts.[0]
                    let cloudOrder = match cloud with | "Azure" -> 20 | "GCP" -> 10 | _ -> 0
                    let lang = parts.[1].Replace("Noop", "")
                    match lang with
                    | "JS" -> Some { Name = cloud + "NoDeps"; Label = cloud + " 1 KB"; Order = 1 + cloudOrder; Color = Some "#5BA3F1" }
                    | "JSXLDeps" -> Some { Name = cloud + "XLDeps"; Label = cloud + " 14 MB"; Order = 2 + cloudOrder; Color = Some "#2870BE" }
                    | "JSXXXLDeps" -> Some { Name = cloud + "XXXLDeps"; Label = cloud + " 35 MB"; Order = 3 + cloudOrder; Color = Some "#003D8B" }
                    | _ -> None                
            let memory (functionName: string) (name: string) =
                if name.Contains "VPC" then None
                elif name.Contains functionName then 
                    let memory = (name.Split '_').[2]
                    let color =
                        match memory with
                        | "128" -> Some "#5BA3F1"
                        | "256" -> Some "#428AD8"
                        | "512" -> Some "#2870BE"
                        | "1024" -> Some "#0F57A5"
                        | "2048" -> Some "#003D8B"
                        | _ -> None
                    Some { Name = memory; Label = memory + " MB"; Order = Int32.Parse memory; Color = color }
                else None
            let vpc (name: string) =                
                if name.Contains "JSNoop" then 
                    if name.Contains "VPC" 
                    then { Name = "VPC"; Label = "VPC"; Order = 2; Color = Some "red" }
                    else { Name = "NoVPC"; Label = "No VPC"; Order = 1; Color = Some "green" }
                    |> Some 
                else None
            do! commands.ColdStartDuration "Azure" "language" language
            do! commands.ColdStartDuration "Azure" "languagewindows" languageWindows
            do! commands.ColdStartDuration "Azure" "version" v1v2
            do! commands.ColdStartDuration "Azure" "dependencies" dependencies
            do! commands.ColdStartDuration "AWS" "language" language
            do! commands.ColdStartDuration "AWS" "memory" (memory "JSNoop")
            do! commands.ColdStartDuration "AWS" "memoryxl" (memory "JSXL")
            do! commands.ColdStartDuration "AWS" "memoryxxxl" (memory "JSXXXL")
            do! commands.ColdStartDuration "AWS" "vpc" vpc
            do! commands.ColdStartDuration "AWS" "dependencies" dependencies
            do! commands.ColdStartDuration "GCP" "language" languageGcp
            do! commands.ColdStartDuration "GCP" "memory" (memory "JSNoop")
            do! commands.ColdStartDuration "GCP" "memoryxl" (memory "JSXL")
            do! commands.ColdStartDuration "GCP" "memoryxxxl" (memory "JSXXXL")
            do! commands.ColdStartDuration "GCP" "dependencies" dependencies
            do! commands.ColdStartDuration "" "language" cloudLanguage
            do! commands.ColdStartDuration "" "dependencies" dependencies
}

[<EntryPoint>]
let main _ =
    Async.RunSynchronously (impl [ColdStartIntervals; ColdStartDurations])
    0
