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
            do! commands.Trigger (urls "Azure") 0 60 30
            do! commands.Trigger (urls "AWS") 0 30 20
            do! commands.Trigger (urls "GCP") 0 300 6
            //do! commands.Trigger (urls "External") 25 30 100
        
        | ColdStartIntervals ->
            do! commands.ColdStartInterval "Azure" 30 (fun filename -> (filename.Contains "Python" || filename.Contains "Premium" || filename.Contains "Linux") |> not)
            //do! commands.ColdStartInterval "Azure" 30 (fun filename -> (filename.Contains "Python" || filename.Contains "Linux"))
            do! commands.ColdStartInterval "AWS" 30 (fun _ -> true)
            do! commands.ColdStartInterval "GCP" 150 (fun filename -> true)
        
        | ColdStartDurations ->
            let languageAzureGA (name: string) =
                if name.Contains "Deps" then None
                elif name.Contains "V1" then None
                elif name.Contains "Linux" then None
                else 
                    let lang = (name.Split '_').[1].Replace("Noop", "")
                    match lang with
                    | "CS" -> Some { Name = "CSharp"; Label = "C#"; Order = 1; Color = Some "#178600" }
                    | "JS" -> Some { Name = "JS"; Label = "JavaScript"; Order = 2; Color = Some "#F1E05A" }
                    | "Java" -> Some { Name = "Java"; Label = "Java"; Order = 3; Color = Some "#B07219" }
                    | "Python" -> Some { Name = "Python"; Label = "Python (Linux)"; Order = 4; Color = Some "#3572A5" }
                    | "Ps" -> Some { Name = "PowerShell"; Label = "PowerShell"; Order = 5; Color = Some "#012456" }
                    | _ -> None
            let languageAzureOs (name: string) =
                if name.Contains "Deps" then None
                elif name.Contains "V1" then None
                else 
                    let linux = name.Contains "Linux"
                    let lang = (name.Split '_').[1].Replace("Noop", "").Replace("Linux", "")
                    match linux, lang with
                    | false, "CS" -> Some { Name = "CSharp"; Label = "C# Windows"; Order = 1; Color = Some "#178600" }
                    | false, "JS" -> Some { Name = "JS"; Label = "JS Windows"; Order = 2; Color = Some "#F1E05A" }
                    | true, "CS" -> Some { Name = "CSharpLinux"; Label = "C# Linux"; Order = 3; Color = Some "#178600" }
                    | true, "JS" -> Some { Name = "JSLinux"; Label = "JS Linux"; Order = 4; Color = Some "#F1E05A" }
                    | _, "Python" -> Some { Name = "Python"; Label = "Python Linux"; Order = 5; Color = Some "#3572A5" }
                    | _ -> None
            let languageLinux (name: string) =
                if name.Contains "Python" || name.Contains "Linux" then
                    let lang = (name.Split '_').[1].Replace("Noop", "").Replace("Linux", "")
                    match lang with
                    | "CS" -> Some { Name = "CSharp"; Label = "C#"; Order = 1; Color = Some "#178600" }
                    | "JS" -> Some { Name = "JS"; Label = "JavaScript"; Order = 2; Color = Some "#F1E05A" }
                    | "Python" -> Some { Name = "Python"; Label = "Python"; Order = 3; Color = Some "#3572A5" }
                    | _ -> None
                else None
            let languageGcp (name: string) =
                if name.Contains "Deps" then None
                elif name.Contains "CloudRun" then None
                else 
                    let lang = (name.Split '_').[1].Replace("Noop", "")
                    match lang with
                    | "JS" -> { Name = "JS"; Label = "JavaScript"; Order = 1; Color = Some "#F1E05A" }
                    | "Go" -> { Name = "Go"; Label = "Go"; Order = 2; Color = Some "#375EAB" }
                    | "Python" -> { Name = "Python"; Label = "Python"; Order = 3; Color = Some "#3572A5" }
                    | v -> { Name = v; Label = "??" + v; Order = 10; Color = None }
                    |> Some 
            let language (name: string) =
                if name.Contains "VPC" then None
                elif name.Contains "Deps" then None
                elif name.Contains "V1" then None
                elif name.Contains "Linux" then None
                else 
                    let lang = (name.Split '_').[1].Replace("Noop", "")
                    match lang with
                    | "JS" -> { Name = "JS"; Label = "JavaScript"; Order = 1; Color = Some "#F1E05A" }
                    | "Python" -> { Name = "Python"; Label = "Python"; Order = 2; Color = Some "#3572A5" }
                    | "Go" -> { Name = "Go"; Label = "Go"; Order = 3; Color = Some "#375EAB" }
                    | "Java" -> { Name = "Java"; Label = "Java"; Order = 4; Color = Some "#B07219" }
                    | "Ruby" -> { Name = "Ruby"; Label = "Ruby"; Order = 5; Color = Some "#701516" }
                    | "CS" -> { Name = "CSharp"; Label = "C#"; Order = 6; Color = Some "#178600" }
                    | "Ps" -> { Name = "PowerShell"; Label = "PowerShell"; Order = 7; Color = Some "#012456" }
                    | v -> { Name = v; Label = "??" + v; Order = 10; Color = None }
                    |> Some 
            let languageaws (name: string) =
                if name.Contains "VPC" then None
                elif name.Contains "Deps" then None
                else 
                    let parts = name.Split '_'
                    let lang = parts.[1].Replace("Noop", "")
                    let memory = parts.[2]
                    match lang with
                    | "JS" -> { Name = "JS"; Label = "JavaScript"; Order = 1; Color = Some "#F1E05A" } |> Some 
                    | "Python" -> { Name = "Python"; Label = "Python"; Order = 2; Color = Some "#3572A5" } |> Some 
                    | "Go" -> { Name = "Go"; Label = "Go"; Order = 3; Color = Some "#375EAB" } |> Some 
                    | "Java" -> { Name = "Java"; Label = "Java"; Order = 4; Color = Some "#B07219" } |> Some 
                    | "Ruby" -> { Name = "Ruby"; Label = "Ruby"; Order = 5; Color = Some "#701516" } |> Some 
                    | "CS" ->
                        if memory = "2048" then
                            { Name = "CSharp"; Label = "C# (2GB)"; Order = 6; Color = Some "#178600" } |> Some 
                        else None
                    | "Ps" -> { Name = "PowerShell"; Label = "PowerShell"; Order = 7; Color = Some "#012456" } |> Some 
                    | v -> { Name = v; Label = "??" + v; Order = 10; Color = None } |> Some                     
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
                    | "AWS", "CS" -> None
                    | _, "JS" -> Some { Name = "JS"; Label = "JavaScript"; Order = 1; Color = Some "#F1E05A" }
                    | _, "CS" -> Some { Name = "CSharp"; Label = "C#"; Order = 2; Color = Some "#178600" }
                    | _, "Python" -> Some { Name = "Python"; Label = "Python"; Order = 3; Color = Some "#3572A5" }
                    | _, "Go" -> Some { Name = "Go"; Label = "Go"; Order = 4; Color = Some "#375EAB" }
                    | _ -> None
                    |> Option.map (fun x -> { x with Name = cloud + x.Name; Label = cloud + " " + x.Label; Order = cloudOrder + x.Order })
            let v1v2 (name: string) =
                if name.Contains "Deps" then None
                elif name.Contains "Python" then None
                elif name.Contains "Java" then None
                elif name.Contains "Linux" then None
                else 
                    let lang = ((name.Split '_').[1].Replace("Noop", ""))
                    let version = if name.Contains "V1" then "V1" else "V2"
                    match lang, version with
                    | "JS", "V2" -> Some { Name = "V2JS"; Label = "V2 JavaScript"; Order = 4; Color = Some "#F1E05A" }
                    | "CS", "V2" -> Some { Name = "V2CSharp"; Label = "V2 C#"; Order = 2; Color = Some "#178600" }
                    | "JS", "V1" -> Some { Name = "V1JS"; Label = "V1 JavaScript"; Order = 3; Color = Some "#D8C741" }
                    | "CS", "V1" -> Some { Name = "V1CSharp"; Label = "V1 C#"; Order = 1; Color = Some "#005300" }
                    | v, _ -> None
            let dependencies (name: string) =
                if name.Contains "VPC" then None
                elif name.Contains "V1" then None
                elif name.Contains "Linux" then None
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
            let appinsights (name: string) =
                if name.Contains "V1" then None
                else
                    let parts = name.Split '_'
                    let lang = parts.[1].Replace("Noop", "")
                    match lang with
                    | "CS" -> Some { Name = "NoAppInsights"; Label = "No AppInsights"; Order = 1; Color = Some "#5BA3F1" }
                    | "CSAI" -> Some { Name = "WithAppInsights"; Label = "With AppInsights"; Order = 2; Color = Some "#003D8B" }
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
            let deployment (language: string) (name: string) =
                if name.Contains "V1" then None
                else if name.Contains "Python" then None
                else if name.Contains "Linux" then None
                else
                    let scenario = (name.Split '_').[1].Replace(language, "")
                    match scenario with
                    //| "Portal" -> Some { Name = "Portal" + language; Label = "Portal"; Order = 1; Color = Some "#008F95" }
                    | "NoZip" -> Some { Name = "NoZip" + language; Label = "No Zip"; Order = 2; Color = Some "#008F95" }
                    | "Noop" -> Some { Name = "RunAsPackageLocal" + language; Label = "Local Zip"; Order = 3; Color = Some "#E9B000" }
                    | "ExZip" -> Some { Name = "RunAsPackageExternal" + language; Label = "External Zip"; Order = 4; Color = Some "#E24E42" }
                    | _ -> None
            let orders (name: string) =
                let scenario = (name.Split '_').[1]
                if scenario.Contains "20190429" then
                    Some { Name = scenario; Label = "April 29 - May 1"; Order = 1; Color = Some "#008F95" }
                else
                    Some { Name = scenario; Label = "April 19-21"; Order = 2; Color = Some "#E9B000" }

            let plan (name: string) =                
                let scenario = (name.Split '_').[1]
                match scenario with
                | "CSNoop" -> Some { Name = "Consumption"; Label = "Consumption"; Order = 1; Color = Some "#E9B000" }
                | "CSPremium" -> Some { Name = "Premium"; Label = "Premium"; Order = 2; Color = Some "#E24E42" }
                | _ -> None
            do! commands.ColdStartDuration "Azure" "deploymentjs" (deployment "JS")
            do! commands.ColdStartDuration "Azure" "deploymentcs" (deployment "CS")
            do! commands.ColdStartDuration "Azure" "languagega" languageAzureGA
            do! commands.ColdStartDuration "Azure" "languagelinux" languageLinux
            do! commands.ColdStartDuration "Azure" "languageos" languageAzureOs
            do! commands.ColdStartDuration "Azure" "version" v1v2
            do! commands.ColdStartDuration "Azure" "dependencies" dependencies
            do! commands.ColdStartDuration "Azure" "appinsights" appinsights
            do! commands.ColdStartDuration "Azure" "plan" plan
            do! commands.ColdStartDuration "AWS" "language" languageaws
            do! commands.ColdStartDuration "AWS" "memory" (memory "JSNoop")
            do! commands.ColdStartDuration "AWS" "memorycs" (memory "CSNoop")
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
            //do! commands.ExternalDuration "orders" "orders" orders
}

[<EntryPoint>]
let main _ =
    //| ScheduleColdStarts
    //| ColdStartIntervals
    //| ColdStartDurations
    Async.RunSynchronously (impl [ColdStartDurations])
    0
