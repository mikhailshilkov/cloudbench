---
title: "Measuring Cold Starts"
date: 2019-01-25
thumbnail: /images/measure.jpg
tags: ["Cold Starts"]
---

All tests were run against HTTP Functions because that's where cold starts matter the most.

Each cloud function responds with a simple `200 OK` with the following custom response headers:

- **Name**: Function Name which uniquely identifies its scenario, e.g. saying "Node.js AWS Lambda with a VPC connection"
- **Memory**: How much memory is provisioned to the function
- **Instance ID**: A unique identifier of the functions instance that served this request
- **Count**: The amount of requests that this instance already served, including the current one. Count = 1 means the cold start.

We do not rely on execution time reported by a cloud provider. Instead, we measure end-to-end duration from the client perspective. This means that durations of the HTTP gateway (e.g. API Gateway in case of AWS) and network latencies are included into the total duration. The cold start duration is then adjusted by the observed warm response time.

Here is what the setup looks like:

{{< figure src="/images/coldstartmeasurerent.png" title="Measuring the cold starts" >}}

1. There is *a scheduler* which triggers over random intervals between **1** and **120** minutes (to see how interval impacts the cold starts)
2. The scheduler invokes *the caller*. The caller sends an HTTP request to the cloud function which goes through whatever HTTP front-end the cloud has in front of the function.
3. The caller *measures* the time it takes to get the HTTP response back. That's the key metric for the cold start estimation.
4. The caller *logs* the response and the timings to a blob storage.