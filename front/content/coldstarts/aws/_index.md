---
title: "Cold Starts in AWS Lambda"
date: 2019-02-06
comments: false
teaser: Selection of languages, instance sizes, dependencies, VPC, and more
tags: ["Cold Starts", "AWS", "AWS Lambda"]
thumbnail: /images/lambda2.jpg
---

This article describes AWS Lambda&mdash;the dynamically scaled and billed-per-execution compute service. Instances of Lambdas are added and removed dynamically. When a new instance handles its first request, the response time increases, which is called a **cold start**.

Read more: [Cold Starts in Serverless Functions](/coldstarts/define/)

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after a deployment. 

After that request is processed, the instance is kept alive to be reused for subsequent requests. There is no predefined threshold after the instance gets recycled, the empiric data show some variance of idle period.

The following chart estimates the probability of an instance to be recycled after the given period of inactivity:

{{< chart_line 
    "coldstart_aws_interval" 
    "Probability of a cold start happening before minute X" >}}

An idle instance almost always stays alive for at least **25 minutes**. Then, the probability of it being disposed slowly starts to grow and reaches 100% somewhere after **1 hour** since the last request.

Read more: [When Does Cold Start Happen on AWS Lambda?](/coldstarts/aws/intervals/)

How Slow Are Cold Starts?
-------------------------

The following chart shows the typical range of cold starts in AWS Lambda, broken down per language. The darker ranges are most common 67% of durations, lighter ranges include 95%.

{{< chart_interval 
    "coldstart_aws_bylanguage"
    "Typical cold start durations per language" >}}

Python seems to be the fastest with most cold starts completed within **300 ms**. JavaScript, Go, Java, and Ruby are all comparable and almost always start within **1 second**. C# is an obvious underdog with cold starts spanning between **1 and 5 seconds**. 

View detailed distributions: [Cold Start Duration per Language](/coldstarts/aws/languages/).

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployed package size will further increase the cold start durations.

The following chart compares three JavaScript functions with various number of referenced NPM packages:

{{< chart_interval 
    "coldstart_aws_bydependencies"
    "Comparison of cold start durations per deployment size (zipped)" >}}

Indeed, the functions with many dependendencies can be 5-10 times slower to start.

Does Instance Size Matter?
--------------------------

AWS Lambda has a setting to define the memory size that gets allocated to a single instance of a function. Are bigger instances faster to load?

{{< chart_interval 
    "coldstart_aws_bymemory"
    "Comparison of cold start durations per instance size" >}}

There is no visible difference in cold start duration of different instance sizes.

Same comparison for larger functions: [Cold Start Duration per Instance Size](/coldstarts/aws/instances/).

What Is The Effect Of VPC Access?
---------------------------------

AWS Lambda might need to access resources inside Amazon Virtual Private Cloud (Amazon VPC). Configuring VPC access will significantly slow down the cold starts:

{{< chart_interval 
    "coldstart_aws_byvpc"
    "Comparison of cold start durations of the same Lambda with and without VPC access" >}}

Some VPC-enabled cold starts are still fast, but very often they are much slower and can get up to **17 seconds**.

View detailed distributions: [Cold Start Duration of VPC-connected Lambda](/coldstarts/aws/vpc/).