import { asset } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";



const bucket = new gcp.storage.Bucket("cloudbench-bucket", {
});

// Pause topic and function
const bucketObjectPause = new gcp.storage.BucketObject("cloudbench-pause-bucket-object", {
    bucket: bucket.name,
    source: new asset.AssetArchive({
        ".": new asset.FileArchive("./queue/jspause"),
    }),
});

const pauseTopic = new gcp.pubsub.Topic("cloudbench-gcp-pause-topic", {    
    name: "cloudbench-gcp-pause-topic"
});

const pauseFunc = new gcp.cloudfunctions.Function("cloudbench-gcp-pause-func", {
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObjectPause.name,
    entryPoint: "handler",
    eventTrigger: {
        eventType: "providers/cloud.pubsub/eventTypes/topic.publish",
        resource: pauseTopic.name
    },
    availableMemoryMb: 128
});

export const pauseTopicUrl = pauseTopic.urn;

// Bcrypt topic and function
const bucketObjectBcrypt = new gcp.storage.BucketObject("cloudbench-bcrypt-bucket-object", {
    bucket: bucket.name,
    source: new asset.AssetArchive({
        ".": new asset.FileArchive("./queue/jsbcrypt"),
    }),
});

const bcryptTopic = new gcp.pubsub.Topic("cloudbench-gcp-bcrypt-topic", {    
    name: "cloudbench-gcp-bcrypt-topic"
});

const bcryptFunc = new gcp.cloudfunctions.Function("cloudbench-gcp-bcrypt-func", {
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObjectBcrypt.name,
    entryPoint: "handler",
    eventTrigger: {
        eventType: "providers/cloud.pubsub/eventTypes/topic.publish",
        resource: bcryptTopic.name
    },
    availableMemoryMb: 512
});

export const bcryptTopicUrl = bcryptTopic.urn;

// Export logs
const exportTopic = new gcp.pubsub.Topic("cloudbench-gcp-logs-export-topic", {    
});

const exportSubscription = new gcp.pubsub.Subscription("cloudbench-gcp-logs-export-subscription", {
    topic: exportTopic.name
});

var pauseSink = new gcp.logging.ProjectSink("cloudbench-gcp-pause-sink", {
    destination: exportTopic.name.apply(n => `pubsub.googleapis.com/projects/cloudbench-221016/topics/${n}`),
    filter: pauseFunc.name.apply(n => `resource.type="cloud_function" resource.labels.function_name="${n}" resource.labels.region="us-central1"`),
    uniqueWriterIdentity: true
});

var bcryptSink = new gcp.logging.ProjectSink("cloudbench-gcp-bcrypt-sink", {
    destination: exportTopic.name.apply(n => `pubsub.googleapis.com/projects/cloudbench-221016/topics/${n}`),
    filter: bcryptFunc.name.apply(n => `resource.type="cloud_function" resource.labels.function_name="${n}" resource.labels.region="us-central1"`),
    uniqueWriterIdentity: true
});

new gcp.pubsub.TopicIAMMember("cloudbench-gcp-logs-pause-export-permission", {
    member: pauseSink.writerIdentity,
    role: "roles/pubsub.publisher",
    topic: exportTopic.name
});

new gcp.pubsub.TopicIAMMember("cloudbench-gcp-logs-bcrypt-export-permission", {
    member: bcryptSink.writerIdentity,
    role: "roles/pubsub.publisher",
    topic: exportTopic.name
});

export const exportSubscriptionName = exportSubscription.name;
