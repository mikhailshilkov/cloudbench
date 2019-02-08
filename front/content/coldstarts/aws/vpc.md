---
title: "Cold Start Duration of VPC-connected AWS Lambda"
date: 2019-02-08
tags: ["Cold Starts", "AWS", "JavaScript", "VPC", "AWS Lambda"]
---

AWS Lambda might need to access resources inside Amazon Virtual Private Cloud (Amazon VPC). Configuring VPC access will significantly slow down the cold starts. The following charts shows the cold start duration distribution of an "Hello World" JavaScript Lambda with VPC connectivity enabled:

{{< chart_hist 
     "coldstart_aws_vpc" 
     "Cold start durations of VPC-connected AWS Lambda" 
     "1.2" >}}

It's interesting that many cold starts are actually fast (the left column). Are they reusing networking infrastructure for multiple Lambda instances?

Go back to [Cold Starts in AWS Lambda](/coldstarts/aws/).