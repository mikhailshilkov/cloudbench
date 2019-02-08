---
title: "When Does Cold Start Happen on Google Cloud Functions?"
date: 2019-02-07
tags: ["Cold Starts", "GCP", "Google Cloud Functions"]
---

The very first cold start happens when the very first request comes in after a deployment. 

After that request is processed, the instance is kept alive for a period of time to be reused for subsequent requests. But for how long?

The following chart attempts to answer this question. It plots the response duration in seconds (Y-axis) by the interval since the previous requests (X-axis). Each point represents a single request in the data set. Blue points are cold starts and red points are responses from warm instances:

{{< chart_scatter 
    "coldstart_gcp_scatter"
    "Cold and warm latency as a function of interval between two subsequent requests" >}}

This chart looks pretty random: both cold and warm starts are all over the place.

{{< keypoint >}} An idle instance can be recycled as soon as after 6 minutes of inactivity, or stay alive for more than 5 hours. {{< /keypoint >}}

Most probably, Google makes the decision based on the current demand/supply ratio in the given resource pool.

The following chart estimates the probability of a cold start (Y-axis) by the interval between two subsequent requests (X-axis):

{{< chart_line 
    "coldstart_gcp_interval" 
    "Probability of a cold start happening before minute X" >}}

Don't trust the exact probabilities on this chart, but the overall trend should be representative.

Go back to [Cold Starts in Google Cloud Functions](/coldstarts/gcp/).