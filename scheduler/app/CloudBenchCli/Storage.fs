namespace CloudBenchCli

open Microsoft.WindowsAzure.Storage
open Microsoft.WindowsAzure.Storage.Blob

type IStorage =
    abstract member List: pattern: string -> Async<CloudBlockBlob list>
    abstract member Load: blob: CloudBlockBlob -> Async<string>
    abstract member Save: filename: string -> content: string -> unit


module Storage =

    let make connectionString containerName outputDirectory =

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

        let save filename content =
            let fullName = sprintf "%s\%s" outputDirectory filename
            System.IO.File.WriteAllText (fullName.ToLowerInvariant (), content)

        let load (blob: CloudBlockBlob) = 
            blob.DownloadTextAsync () |> Async.AwaitTask

        { new IStorage with 
            member __.List pattern = list pattern
            member __.Load blob = load blob
            member __.Save filename content = save filename content
        }