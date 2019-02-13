---
title: "Comparison of Cold Starts in Serverless Functions across AWS, Azure, and GCP"
date: 2019-02-06
thumbnail: /images/big3c.jpg
image: /images/big3c.jpg
teaser: "AWS Lambda, Azure Functions, and Google Cloud Functions compared in terms of cold starts across all supported languages"
tags: ["Cold Starts", "AWS Lambda", "Azure Functions", "Google Cloud Functions", "AWS", "Azure", "GCP"]
---

This article compares Function-as-a-Service offerings of Big-3 cloud providers in terms of cold starts. AWS Lambda, Azure Functions (Consumption Plan), and Google Cloud Functions are all dynamically scaled and billed-per-execution compute services. Instances of cloud functions are added and removed dynamically. When a new instance handles its first request, the response time increases, which is called a **cold start**.

Read more: [Cold Starts in Serverless Functions](/coldstarts/define/)

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after a deployment. 

After that request is processed, the instance is kept alive to be reused for subsequent requests. 

The strategy for reuse differs very between the cloud vendors:

| Service                   | Idle instance lifetime                   |
|---------------------------|------------------------------------------|
| AWS Lambda                | Mostly between 25 and 65 minutes         |
| Azure Functions           | 20 minutes                               |
| Google Cloud Functions    | Anywhere between 3 minutes and 5+ hours  |

Only Azure has a policy to recycle an idle intance after a fixed period of time. AWS, and especially GCP, employ some other strategy to determine the threshold, potentially based on the current demand-supply balance on their resource pools.

Learn more about lifetime: [AWS Lambda](/coldstarts/aws/intervals/), [Azure Functions](/coldstarts/azure/intervals/), [Google Cloud Functions](/coldstarts/gcp/intervals/).

How Slow Are Cold Starts?
-------------------------

The following chart shows the comparison of typical cold start durations across all generally available languages of the three clouds. The darker ranges are most common 67% of durations, lighter ranges include 95%.

{{< featured >}}

{{< chart_interval 
    "coldstart__bylanguage"
    "Typical cold start durations per language" >}}

{{< /featured >}}    

AWS clearly leads with all languages but C# being **below 1 second**. GCP start-up usually takes **between 1 and 2 seconds**, while Azure is far slower.

Read the detailed statistics: [AWS Lambda](/coldstarts/aws/languages/), [Azure Functions](/coldstarts/azure/languages/), [Google Cloud Functions](/coldstarts/gcp/languages/).

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployment package size will further increase the cold start latency.

The following chart compares three JavaScript functions with various number of referenced NPM packages:

{{< featured >}}

{{< chart_interval 
    "coldstart__bydependencies"
    "Comparison of cold start durations per deployment size (zipped)" >}}

{{< /featured >}}    

The trend is quite consistent: bigger packages cause significant slowdown of the cold start. Once again, AWS outperforms its competitors.