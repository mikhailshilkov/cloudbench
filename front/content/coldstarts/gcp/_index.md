---
title: "Cold Starts in Google Cloud Functions"
date: 2019-02-05
comments: false
tags: ["Cold Starts", "GCP", "Google Cloud Functions"]
image: /images/gcp.png
---

This article describes Google Cloud Functions&mdash;the dynamically scaled and billed-per-execution compute service. Instances of Cloud Functions are added and removed dynamically. When a new instance handles its first request, the response time increases, which is called a **cold start**.

Read more: [Cold Starts in Serverless Functions](/coldstarts/define)

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after a deployment. 

After that request is processed, the instance is kept alive to be reused for subsequent requests. There is no predefined threshold after the instance gets recycled, the empiric data show great variance of idle period.

The following chart estimates the probability of an instance to be recycled after the given period of inactivity:

{{< chart_line 
    "coldstart_gcp_interval" 
    "Probability of a cold start happening before minute X" >}}

The instance can be killed after several minutes or kept alive for several hours. Most probably, Google makes this decision based on the current demand/supply ratio in the given resource pool.

Read more: [When Does Cold Start Happen on Google Cloud Functions?](/coldstarts/gcp/intervals)

How Slow Are Cold Starts?
-------------------------

The following chart shows the typical range of cold starts in Google Cloud Functions, broken down per language. The darker ranges are most common 67% of durations, lighter ranges include 95%.

{{< chart_interval 
    "coldstart_gcp_bylanguage"
    "Typical cold start durations per language" >}}

JavaScript and Go function load within 1-2 seconds. Python functions are currently slower, but they might improve towards the GA release date.

Read the detailed statistics per language: [TODO](TODO).

Does Instance Size Matter?
--------------------------

Google Cloud Functions have a setting to define the memory size that gets allocated to a single instance of a function. Are biggest instances faster to load?

{{< chart_interval 
    "coldstart_gcp_bymemory"
    "Comparison of cold start durations per instance size" >}}

There seems to be a marginal speed-up of the cold start as the instance size grows.

Read more: [TODO](/coldstarts/gcp/todo)

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployed package size will further increase the cold start durations.

The following chart compares three JavaScript functions with various number of referenced NPM packages:

{{< chart_interval 
    "coldstart_gcp_bydependencies"
    "Comparison of cold start durations per deployment size (zipped)" >}}

Indeed, the functions with many dependendencies can be 5-10 times slower to start.

Read more: [TODO](/coldstarts/gcp/todo)