---
title: "When Does Cold Start Happen on Azure Functions?"
date: 2019-01-17T06:19:15+01:00
draft: false
---

The first cold start happens when the very first request comes in. 

After that request is processed, the instance is kept alive for a period of time to be reused for subsequent requests. But for how long?

The following chart answers this question. It plots the probability of a cold start (Y-axis) by the interval between two subsequent requests (X-axis).

{{< chart "coldstart_azure_interval" >}}

Clearly, an idle instance lives for 20 minutes and then gets recycled. All requests after 20 minutes threshold hit another cold start.

{{< chart_scatter "coldstart_azure_scatter" >}}

Links:

- [Chart Data](TODO)
- [Raw Data](TODO)