import { asset } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const bucket = new gcp.storage.Bucket("cloudbench-bucket", {
});

// Cold Start JS function
const bucketObjectJsNoOp = new gcp.storage.BucketObject("cloudbench-jsnoop-bucket-object", {
    bucket: bucket.name,
    source: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsnoop"),
    }),
});

let coldStartFuncs = 
    [128, 256, 512, 1024, 2048].map(memory => {
        let name = memory == 128 ? "cloudbench-gcp-coldstartjs-func" : `cloudbench-gcp-coldstartjs-func-${memory}`;
        return new gcp.cloudfunctions.Function(name, {
            sourceArchiveBucket: bucket.name,
            sourceArchiveObject: bucketObjectJsNoOp.name,
            entryPoint: "handler",
            triggerHttp: true,
            availableMemoryMb: memory
        });
    });

export const coldStartJsUrl = coldStartFuncs.map(f => f.httpsTriggerUrl);