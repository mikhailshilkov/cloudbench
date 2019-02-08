---
title: "Google Cloud Functions: Cold Start Duration per Language"
date: 2019-02-07
tags: ["Cold Starts", "GCP", "JavaScript", "Python", "Go", "Google Cloud Functions"]
---

The charts below give the distribution of cold start durations per supported programming language.
All charts have the same scale to make them easily comparable.

**JavaScript** (currently, the only generally available runtime):

{{< chart_hist 
     "coldstart_gcp_js" 
     "Cold start durations of Google Cloud Functions in JavaScript" 
     5 >}}

**Go** (currently in preview):

{{< chart_hist 
     "coldstart_gcp_go" 
     "Cold start durations of Google Cloud Functions in Go" 
     5 >}}

**Python** (currently in preview):

{{< chart_hist 
     "coldstart_gcp_python" 
     "Cold start durations of Google Cloud Functions in Python" 
     5 >}}

Go back to [Cold Starts in Google Cloud Functions](/coldstarts/gcp/).