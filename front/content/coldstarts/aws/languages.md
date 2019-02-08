---
title: "AWS Lambda: Cold Start Duration per Language"
date: 2019-02-07
tags: ["Cold Starts", "AWS", "JavaScript", "Python", "Go", "C#", "Ruby", "Java", "AWS Lambda"]
---

The charts below give the distribution of cold start durations per supported programming language. All charts *except the last one* have the same scale to make them easily comparable.

**JavaScript**:

{{< chart_hist 
     "coldstart_aws_js" 
     "Cold start durations of AWS Lambda in JavaScript" 
     "1.2" >}}

**Python**:

{{< chart_hist 
     "coldstart_aws_python" 
     "Cold start durations of AWS Lambda in Python" 
     "1.2" >}}

**Java**:

{{< chart_hist 
     "coldstart_aws_java" 
     "Cold start durations of AWS Lambda in Java" 
     "1.2" >}}

**Go**:

{{< chart_hist 
     "coldstart_aws_go" 
     "Cold start durations of AWS Lambda in Go" 
     "1.2" >}}

**Ruby**:

{{< chart_hist 
     "coldstart_aws_ruby" 
     "Cold start durations of AWS Lambda in Ruby" 
     "1.2" >}}

**C#** (notice that the scale of X axis is different from the other charts):

{{< chart_hist 
     "coldstart_aws_csharp" 
     "Cold start durations of AWS Lambda in C#" 
     5 >}}     

Go back to [Cold Starts in AWS Lambda](/coldstarts/aws/).