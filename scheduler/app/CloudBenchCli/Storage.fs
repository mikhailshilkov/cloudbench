namespace CloudBenchCli

open System.IO
open System.IO.Compression
open Microsoft.WindowsAzure.Storage
open Microsoft.WindowsAzure.Storage.Blob

type IStorage =
    abstract member List: pattern: string -> Async<CloudBlockBlob list>
    abstract member Load: blob: CloudBlockBlob -> Async<string>
    abstract member Save: filename: string -> content: string -> unit
    abstract member Zip: filename: string -> files: List<string * string> -> unit


module Storage =

    let make connectionString containerName outputDirectories =

        let account = CloudStorageAccount.Parse connectionString
        let serviceClient = account.CreateCloudBlobClient()
        let container = serviceClient.GetContainerReference containerName

        let list (pattern: string) = async {
            let! blobs = container.ListBlobsSegmentedAsync null |> Async.AwaitTask
            return blobs.Results
            |> Seq.filter (fun x -> x :? CloudBlockBlob) 
            |> Seq.cast<CloudBlockBlob>
            |> Seq.filter (fun x -> x.Name.Contains pattern)
            |> List.ofSeq
        }

        let save (filename: string) content =
            outputDirectories
            |> List.iter (fun outputDirectory ->
                let fullName = sprintf "%s\%s" outputDirectory (filename.ToLowerInvariant ())
                File.WriteAllText (fullName.ToLowerInvariant (), content)
            )

        let load (blob: CloudBlockBlob) = 
            blob.DownloadTextAsync () |> Async.AwaitTask

        let zip (filename: string) (files: List<string * string>) =
            let outputDirectory = outputDirectories |> List.last
            let fullName = sprintf "%s\%s" outputDirectory (filename.ToLowerInvariant ())
            use zipToOpen = new FileStream (fullName, FileMode.Create)
            use archive = new ZipArchive (zipToOpen, ZipArchiveMode.Update)
            files
            |> List.iter (fun (name, content) ->
                let entry = archive.CreateEntry name
                use writer = new StreamWriter (entry.Open())
                writer.Write content
            )

        { new IStorage with 
            member __.List pattern = list pattern
            member __.Load blob = load blob
            member __.Save filename content = save filename content
            member __.Zip filename files = zip filename files
        }