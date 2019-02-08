---
title: "Google Cloud Functions: Cold Start Duration per Instance Size"
date: 2019-02-07
tags: ["Cold Starts", "GCP", "JavaScript", "Google Cloud Functions"]
---

Google Cloud Functions have a setting to define the memory size that gets allocated to a single instance of a function. The CPU resources are allocated proporionally to the memory. So, in theory, larger instances could start faster.

However, there seems to be no significant speed-up of the cold start as the instance size grows.

Here is the comparison for a "Hello-World" JavaScript function:

{{< chart_interval 
    "coldstart_gcp_bymemory"
    "Comparison of cold start durations per instance size, no dependencies" >}}

Here is the same comparison for a JavaScript function with 14 MB (zipped) of NPM packages:

{{< chart_interval 
    "coldstart_gcp_bymemoryxl"
    "Comparison of cold start durations per instance size, 14 MB (zipped) of dependencies" >}}

Here is the same comparison for a JavaScript function with 35 MB (zipped) of NPM packages:

{{< chart_interval 
    "coldstart_gcp_bymemoryxxxl"
    "Comparison of cold start durations per instance size, 35 MB (zipped) of dependencies" >}}

None of the charts show considerable advantage of bigger instance sizes for the cold starts.

Go back to [Cold Starts in Google Cloud Functions](/coldstarts/gcp/).