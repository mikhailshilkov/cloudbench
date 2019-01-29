---
title: "When Does Cold Start Happen on Azure Functions?"
date: 2019-01-17T06:19:15+01:00
draft: false
tags: ["Cold Starts", "Azure"]
---

The very first cold start happens when the very first request comes in after a deployment. 

After that request is processed, the instance is kept alive for a period of time to be reused for subsequent requests. But for how long?

The following chart answers this question. It plots the response duration in seconds (Y-axis) by the interval since the previous requests (X-axis). Each point represents a single request in the data set. Blue points are cold starts and red points are responses from warm instances:

{{< chart_scatter 
    "coldstart_azure_scatter"
    "Cold and warm latency as a function of interval between two subsequent requests" >}}

There is a distinct borderline visible. Clearly, **an idle instance lives for 20 minutes and then gets recycled**. 

{{< keypoint >}} All requests after 20 minutes of idling hit a cold start. Requests within 20 minutes are handled by a warm instance. {{< /keypoint >}}

Here is a formal visualization of the same data. It plots the probability of a cold start (Y-axis) by the interval between two subsequent requests (X-axis):

{{< chart_line 
    "coldstart_azure_interval" 
    "Probability of a cold start happening before minute X" >}}


Reference data:

- Chart: Cold and warm latency as a function of interval between two subsequent requests ([JSON](/data/coldstart_azure_scatter.json))
- Chart: Probability of a cold start happening before minute X ([JSON](/data/coldstart_azure_interval.json))
- Raw experiment data ([Zipped JSON](/data/coldstart_azure.zip))