---
title: What Is a Cold Start?
date: 2019-01-25
thumbnail: /images/dictionary.jpg
teaser: Definition, mechanics and the reasons they exist
tags: ["Cold Starts"]
---

Auto-provisioning and auto-scalability are the killer features of Function-as-a-Service cloud offerings. No management required, cloud providers will deliver infrastructure for the user based on the actual incoming load.

One drawback of such dynamic provisioning is a phenomenon called **cold start**. Basically, applications that haven't been used for a while take longer to startup and to handle the first request.

Cloud providers keep a bunch of generic unspecialized workers in stock. Whenever a serverless application needs to scale up, be it from 0 to 1 instances, or from N to N+1 likewise, the runtime will pick one of the spare workers and will configure it to serve the named application:

{{< figure src="/images/coldstart.png" title="Handling a request while no instances exist yet" >}}

This procedure takes time, so the latency of the application event handling increases. To avoid doing this for every event, the specialized worker will be kept intact for some period of time. When another event comes in, this worker will stand available to process it as soon as possible. This is a **warm start**:

{{< figure src="/images/warmstart.png" title="Handling a request by reusing an existing instance" >}}