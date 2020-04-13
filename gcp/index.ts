import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const bucket = new gcp.storage.Bucket("cloudbench-bucket", {
    location: 'europe-west1',
    labels: {
        "owner": "mikhailshilkov",
    },
});

// Cold Start JS function
const bucketObjectJsNoOp = new gcp.storage.BucketObject("cloudbench-jsnoop-bucket-object", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./http/jsnoop"),
    }),
});
const bucketObjectXlDeps = new gcp.storage.BucketObject("cloudbench-jsxldeps-bucket-object", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./http/jsxldeps"),
    }),
});

const bucketObjectXxxlDeps = new gcp.storage.BucketObject("cloudbench-jsxxxldeps-bucket-object", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./http/jsxxxldeps"),
    }),
});

const bucketObjectPython = new gcp.storage.BucketObject("cloudbench-python-bucket-object", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./http/pythonnoop"),
    }),
});

const bucketObjectGo = new gcp.storage.BucketObject("cloudbench-go-bucket-object", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./http/gonoop"),
    }),
});

let functions = [
    { name: 'coldstartjs', blob: bucketObjectJsNoOp, runtime: "nodejs8" },
    { name: 'coldjsxldeps', blob: bucketObjectXlDeps, runtime: "nodejs8" },
    { name: 'coldjsxxxldeps', blob: bucketObjectXxxlDeps, runtime: "nodejs8" },
    { name: 'coldstartpython', blob: bucketObjectPython, runtime: "python37" },
    { name: 'coldstartgo', blob: bucketObjectGo, runtime: "go113", handler: "Handler" },
];

let coldStartFuncs = 
    functions.map(f => {
        return [128, 256, 512, 1024, 2048].map(memory => {
            if (memory === 128 && f.name === "coldjsxxxldeps")
                return { code: "skip", function: <gcp.cloudfunctions.Function><unknown>null}; // work around out of memory exception

            let name = memory == 128 
                ? `cloudbench-gcp-${f.name}-func` 
                : `cloudbench-gcp-${f.name}-func-${memory}`;


            const func = new gcp.cloudfunctions.Function(name, {
                region: 'europe-west1',
                sourceArchiveBucket: bucket.name,
                runtime: f.runtime,
                sourceArchiveObject: f.blob.name,
                entryPoint: f.handler || "handler",
                triggerHttp: true,
                availableMemoryMb: memory,
                labels: {
                    "owner": "mikhailshilkov",
                },            
            });

            // Open the function to public unrestricted access
            const iam = new gcp.cloudfunctions.FunctionIamMember(`${name}-iam`, {
                cloudFunction: func.name,
                region: func.region,
                role: "roles/cloudfunctions.invoker",
                member: "allUsers",
            });

            return {
                code: `${f.name}${memory}`.replace("coldstart","").replace("cold",""),
                function: func
            };
        });
    }).reduce((x,y) => x.concat(y), []).filter(v => v.code !== "skip");

type A = [string, pulumi.Output<string>];
const items = coldStartFuncs.map(f => <A>[f.code, f.function.httpsTriggerUrl]);
const obj = Object.assign.apply(null, items.map(([key, val]) => { return { [key]: val } }))

export const coldStartEndpoints = pulumi.output(obj).apply(v => JSON.stringify(v, undefined, 2));
