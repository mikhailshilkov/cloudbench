---
title: "Azure Functions: Cold Start Duration per Language"
date: 2019-02-07
draft: false
tags: ["Cold Starts", "Azure", "C#", "JavaScript", "Python", "Java", "Azure Functions"]
---

The charts below give the distribution of cold start durations per runtime version and supported programming language. All charts have the same scale to make them easily comparable.

## Azure Functions V2

**C#** (generally available):

{{< chart_hist 
     "coldstart_azure_csharp" 
     "Cold start durations of Azure Functions V2 in JavaScript" 
     18 >}}

**JavaScript** (generally available):

{{< chart_hist 
     "coldstart_azure_js" 
     "Cold start durations of Azure Functions V2 in JavaScript" 
     18 >}}

**Java** (currently in preview):

{{< chart_hist 
     "coldstart_azure_java" 
     "Cold start durations of Azure Functions V2 in Java" 
     18 >}}

## Azure Functions V1

**C#**:

{{< chart_hist 
     "coldstart_azure_v1csharp" 
     "Cold start durations of Azure Functions V1 in JavaScript" 
     18 >}}

**JavaScript**:

{{< chart_hist 
     "coldstart_azure_v1js" 
     "Cold start durations of Azure Functions V1 in JavaScript" 
     18 >}}

## Azure Functions on Linux

There is a preview version of Azure Functions Consumption Plan running on top of Linux and Service Fabric Mesh, which is a very different stack from Windows- and AppService-based production environments.

The cold starts of **Python** functions seem to be comparable though:

{{< chart_hist 
     "coldstart_azure_python" 
     "Cold start durations of Azure Functions in Python running on Linux"
     18 >}}

Go back to [Cold Starts in Azure Functions](/coldstarts/azure/).