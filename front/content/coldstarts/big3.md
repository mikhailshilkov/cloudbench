---
title: "Comparison of Cold Starts in Serverless Functions across AWS, Azure, and GCP"
date: 2019-02-06
draft: false
tags: ["Cold Starts", "AWS Lambda", "Azure Functions", "Google Cloud Functions", "AWS", "Azure", "GCP"]
---

This article compares Function-as-a-Service offerings of Big-3 cloud providers in terms of cold starts. AWS Lambda, Azure Functions (Consumption Plan), and Google Cloud Functions are all dynamically scaled and billed-per-execution compute services. Instances of cloud functions are added and removed dynamically. When a new instance handles its first request, the response time increases, which is called a **cold start**.

Read more: [Cold Starts in Serverless Functions](/coldstarts/define)

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after a deployment. 

After that request is processed, the instance is kept alive to be reused for subsequent requests. 

The strategy for reuse differs wildly between the cloud vendors:

| Service                   | Idle instance lifetime                   |
|---------------------------|------------------------------------------|
| AWS Lambda                | Mostly between 25 and 65 minutes         |
| Azure Functions           | 20 minutes                               |
| Google Cloud Functions    | Anywhere between 3 minutes and 5+ hours  |

Only Azure has a policy to recycle an idle intance after a fixed period of time. AWS, and especially GCP, employ some other strategy to determine the threshold, potentially based on the current demand-supply balance on their resource pools.

Read more: TODO

How Slow Are Cold Starts?
-------------------------

The following chart shows the comparison of typical cold start durations acroos all generally available languages of the three clouds. The darker ranges are most common 67% of durations, lighter ranges include 95%.

{{< chart_interval 
    "coldstart__bylanguage"
    "Typical cold start durations per language" >}}

AWS clearly leads with all languages but C# being **below 1 second**. GCP start-up takes **between 1 and 2 seconds**, while Azure is far slower.

Read the detailed statistics per language: [TODO](TODO).

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployed package size will further increase the cold start durations.

The following chart compares three JavaScript functions with various number of referenced NPM packages:

{{< chart_interval 
    "coldstart__bydependencies"
    "Comparison of cold start durations per deployment size (zipped)" >}}

The trend is quite consistent: bigger packages cause significant slowdown of the cold start. Once again, AWS outperforms its competitors.

Read more: [TODO](/coldstarts/todo)