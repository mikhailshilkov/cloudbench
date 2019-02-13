---
title: "Cold Starts in Azure Functions"
date: 2019-02-07
thumbnail: /images/azure2.jpg
teaser: Influence of dependecies, language, runtime selection on Consumption Plan
tags: ["Cold Starts", "Azure", "Azure Functions"]
---

This article describes Azure Functions running on Consumption Plan&mdash;the dynamically scaled and billed-per-execution compute service. Consumption Plan adds and removes instances dynamically. When a new instance handles its first request, the response time increases, which is called a **cold start**. 

Learn more: [Cold Starts in Serverless Functions](/coldstarts/define/)

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after a deployment. 

After that request is processed, the instance is kept alive for about **20 minutes** to be reused for subsequent requests:

{{< chart_line 
    "coldstart_azure_interval" 
    "Probability of a cold start happening before minute X" >}}

Read more: [When Does Cold Start Happen on Azure Functions?](/coldstarts/azure/intervals/)

How Slow Are Cold Starts?
-------------------------

The following chart shows the typical range of cold starts in Azure Functions V2, broken down per language. The darker ranges are most common 67% of durations, lighter ranges include 95%.

{{< chart_interval 
    "coldstart_azure_bylanguagewindows"
    "Typical cold start durations per language" >}}

A typical cold start latency spans from 3 to 15 seconds. It seems to be consistent between the 3 supported languages.

View detailed distributions: [Cold Start Duration per Language](/coldstarts/azure/languages/).

Is V2 Faster Than V1?
---------------------

There are currently two generally available versions of Azure Functions runtime: V1 runs on top of .NET Framework 4.x, while V2 runs on .NET Core 2.x.

Even though .NET Core is supposed to be faster and more lightweight, Functions V2 still experience higher cold starts:

{{< chart_interval 
    "coldstart_azure_byversion"
    "Comparison of cold start durations across runtime versions" >}}

The difference is especially noticeable for JavaScript functions.

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployed package size will further increase the cold start durations.

The following chart compares three JavaScript functions with various number of referenced NPM packages:

{{< chart_interval 
    "coldstart_azure_bydependencies"
    "Comparison of cold start durations per deployment size (zipped)" >}}

Indeed, the functions with many dependendencies can be several times slower to start.