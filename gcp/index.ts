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
const bucketObjectXlDeps = new gcp.storage.BucketObject("cloudbench-jsxldeps-bucket-object", {
    bucket: bucket.name,
    source: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsxldeps"),
    }),
});

const bucketObjectXxxlDeps = new gcp.storage.BucketObject("cloudbench-jsxxxldeps-bucket-object", {
    bucket: bucket.name,
    source: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsxxxldeps"),
    }),
});

let functions = [
    { name: 'coldstartjs', blob: bucketObjectJsNoOp },
    { name: 'coldjsxldeps', blob: bucketObjectXlDeps },
    { name: 'coldjsxxxldeps', blob: bucketObjectXxxlDeps },
];

let coldStartFuncs = 
functions.map(f => {
        return [128, 256, 512, 1024, 2048].map(memory => {
            let name = memory == 128 
                ? `cloudbench-gcp-${f.name}-func` 
                : `cloudbench-gcp-${f.name}-func-${memory}`;
            return new gcp.cloudfunctions.Function(name, {
                sourceArchiveBucket: bucket.name,
                sourceArchiveObject: f.blob.name,
                entryPoint: "handler",
                triggerHttp: true,
                availableMemoryMb: memory
            });
        });
    }).reduce((x,y) => x.concat(y), []);


export const coldStartJsUrl = coldStartFuncs.map(f => f.httpsTriggerUrl);