---
title: Introducing "Serverless Land"
date: 2019-02-13
thumbnail: /images/blackboard.jpg
blog: true
teaser: In the past 6 months I published several blog post under the same theme of comparing the severless services of the top cloud providers in terms of their performance and scalability properties. I received some very positive feedback on those posts (you are awesome!).
---

Hi, my name is [Mikhail Shilkov](https://mikhail.io), thanks for reading. 

In the past 6 months I published several blog post under the same theme of comparing the severless services of the top cloud providers in terms of their performance and scalability properties:

- [Serverless: Cold Start War](https://mikhail.io/2018/08/serverless-cold-start-war/)
- [From 0 to 1000 Instances: How Serverless Providers Scale Queue Processing](https://mikhail.io/2018/11/from-0-to-1000-instances-how-serverless-providers-scale-queue-processing/)
- [Serverless at Scale: Serving StackOverflow-like Traffic](https://mikhail.io/2019/serverless-at-scale-serving-stackoverflow-like-traffic/)

I received some very positive feedback on those posts (you are awesome!). On top of that, people always had great suggestions about improving and extending the contents of those articles. I've been thinking a lot about them.

## Limitations of a blog post

However, the format of a blog post is limited in several important ways:

- **Read-only**. Once it's published, it's published. Except for some typos, I never make changes or extend the past articles. Despite the lack of technical limitations, re-writing blog posts doesn't seem to be a part of the genre. If I want to add another cloud, do I change the old post or create a completely new one?

- **Point-in-time**. All those articles are heavily data-driven: numbers, charts, comparisons. The value of the data decreases as the time goes. Readers can't trust the number of 2 years old in the ever changing world of the cloud.

- **Wall of text**. A blog post is just a chunk of text interrupted by images and charts. People read it from top to the bottom. There's no other structure to it. So, I have to come up with the best sequence of material to present. I have to balance the length of the post in order to give enough insight but not to be too long and boring. There's no good way to summarize something and then send curious readers to the details.

- **Same for everyone**. Readers might have different backgroud. Somebody only cares about one cloud provider or one language because that's what they work with. Others looks for brief comparison and industry-wide trends. They all have to read the same text.

- **Not reproducible**. Because of the previous points, there is no real incentive to make the experiments reproducible. It's enought to run it once, publish the results, and forget. However, this means that the effort is lost, and there is no open code that others could go to.

I decided to try to address these issues.

## How to solve these problems

I believe I can solve the issues inherent to the format of blog by doing the following steps:

- **Automate the experiments**. Provision the required infrastructure, run the workload, collect metrics, record the data, aggregate them, and publish the charts. All programmatically, without significant human intervention.

- **Run more often**. Re-do the experiments every month or so. Compare the results over time, detect any trends.

- **Website not blog**. Publish the results as a set of pages with different perspectives on the related data. Make it compelling for multiple types of audience.

- **Keep it up-to-date**. Make sure that people can trust the date as being actual, not old or obsolete.

- **Open everything**. Publish the code behind the experiments, the raw data, the aggregated data. Make people find bugs, flaws, and suggest improvements&mdash;if they want to.

## What's available today

I've completed all the suggestions for the topic of [Cold Starts](/coldstarts/). 

Two dozens of cloud functions are provisioned across three providers. The experiments run for a week and then the results are saved as JSON files. A script aggregates the data and produces charts in several seconds.

I commit to running this experiment and updating the data at least once in 2 months for as long as it would make sense, to my judgement.

The corresponding section of the website consists of 16 pages with different focus and level of details.

All the code and data are [published](/about/open/).

I invite you to give it a try, [follow on Twitter](https://www.twitter.com/serverlessland) and [leave the feedback on GitHub](TODO).

[Cold Starts on Serverless Land](/coldstarts/).