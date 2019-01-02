import { asset } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";



const bucket = new gcp.storage.Bucket("cloudbench-bucket", {
});

// Pause function
const bucketObjectPause = new gcp.storage.BucketObject("cloudbench-pause-bucket-object", {
    bucket: bucket.name,
    source: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jspause"),
    }),
});

const pauseFunc = new gcp.cloudfunctions.Function("cloudbench-gcp-pause-func", {
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObjectPause.name,
    entryPoint: "handler",
    triggerHttp: true,
    availableMemoryMb: 128
});

// Bcrypt function
const bucketObjectBcrypt = new gcp.storage.BucketObject("cloudbench-bcrypt-bucket-object", {
    bucket: bucket.name,
    source: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsbcrypt"),
    }),
});

const bcryptFunc = new gcp.cloudfunctions.Function("cloudbench-gcp-bcrypt-func", {
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObjectBcrypt.name,
    entryPoint: "handler",
    triggerHttp: true,
    availableMemoryMb: 512
});

// Blob function
const bucketObjectBlob = new gcp.storage.BucketObject("cloudbench-blob-bucket-object", {
    bucket: bucket.name,
    source: new asset.AssetArchive({
        ".": new asset.FileArchive("./http/jsblob"),
    }),
});

const blobFunc = new gcp.cloudfunctions.Function("cloudbench-gcp-blob-func", {
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObjectBlob.name,
    entryPoint: "handler",
    triggerHttp: true,
    availableMemoryMb: 512
});

export const pauseUrl = pauseFunc.httpsTriggerUrl;
export const bcryptUrl = bcryptFunc.httpsTriggerUrl;
export const blobUrl = blobFunc.httpsTriggerUrl;