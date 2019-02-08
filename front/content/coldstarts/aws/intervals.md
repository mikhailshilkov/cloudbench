---
title: "When Does Cold Start Happen on AWS Lambda?"
date: 2019-01-17T06:19:15+01:00
draft: false
---

The first cold start happens when the very first request comes in. 

After that request is processed, the instance is kept alive for a period of time to be reused for subsequent requests. But for how long?

The following chart attempts to answer this question. It plots the response duration in seconds (Y-axis) by the interval since the previous requests (X-axis). Each point represents a single request in the data set. Blue points are cold starts and red points are responses from warm instances:

{{< chart_scatter 
    "coldstart_aws_scatter"
    "Cold and warm latency as a function of interval between two subsequent requests" >}}

The lifetime of an instance doesn't seem deterministic, but we can estimate it to be between 25 and 65 minutes.

{{< keypoint >}} An idle instance almost always stays alive for at least 25 minutes. Then, the probability of it being disposed slowly starts to grow and reaches 100% somewhere after 1 hour since the last request. {{< /keypoint >}}

The following chart estimates the probability of a cold start (Y-axis) by the interval between two subsequent requests (X-axis):

{{< chart_line 
    "coldstart_aws_interval" 
    "Probability of a cold start happening before minute X" >}}

Don't trust the exact probabilities on this chart, but the overall trend should be representative.

Go back to [Cold Starts in AWS Lambda](/coldstarts/aws/).