open System.IO
open System
open Newtonsoft.Json

// Learn more about F# at http://fsharp.org
// See the 'F# Tutorial' project for more help.

type Question = {
    id: string
    title: string
    text: string
    answers: string[]
}

let parseFile name =
    let lines = File.ReadAllLines name |> List.ofArray |> List.skip 1

    let folder (blocks : string list, line : string) (s : string) =
        if s.StartsWith "\"5300" then 
            (List.append blocks [line], s)
        else
            (blocks, sprintf "%s\n%s" line s)

    let (agg, last) = 
        lines
        |> List.fold folder ([], "")
    let blocks = List.append (List.skip 1 agg) [last]

    let parse (s : string) = 
        let sanitize (p : string) = p.Substring(1, p.Length - 2)
        let parts = s.Split([|','|], 3) |> Array.map sanitize
        parts.[0], parts.[1], parts.[2]

    blocks |> List.map parse

[<EntryPoint>]
let main argv = 
    
    let bareQuestions = parseFile "..\..\..\Questions.csv"
    let answers = parseFile "..\..\..\Answers.csv"

    let questions =
        bareQuestions
        |> List.map (fun (id, title, text) ->
            let ma = answers |> List.filter (fun (_, parent, _) -> parent = id) |> List.map (fun (_, _, text) -> text)
            { 
                id = id
                title = title
                text = text
                answers = Array.ofList ma
            })

    //questions
    //|> List.iter(fun q ->
    //    let json = JsonConvert.SerializeObject q
    //    let filename = sprintf "..\..\..\questions\%s.json" q.id
    //    File.WriteAllText(filename, json))

    let ids = String.Join(",", questions |> List.map (fun q -> q.id))
    File.WriteAllText("..\..\..\questions\ids.json", ids)

    //printfn "%s" questions.[0].title

    Console.ReadKey () |> ignore
    0 // return an integer exit code
