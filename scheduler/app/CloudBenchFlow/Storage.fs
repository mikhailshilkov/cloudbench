module CloudBenchFlow.Storage

open System
open Microsoft.WindowsAzure.Storage

let private storageConnectionString = Environment.GetEnvironmentVariable "AzureWebJobsStorage"
let account = CloudStorageAccount.Parse storageConnectionString
let serviceClient = account.CreateCloudBlobClient()
let container = serviceClient.GetContainerReference "cloudbench"

let save filename content = async {
    let blob = container.GetBlockBlobReference filename
    do! blob.UploadTextAsync content |> Async.AwaitTask
}

let load filename = async {
    let blob = container.GetBlockBlobReference filename
    return! blob.DownloadTextAsync () |> Async.AwaitTask
}