import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { functionApp, subscription } from "@pulumi/azure-serverless";

interface TimerBinding extends subscription.Binding {
    /**
     * The name of the property in the context object to bind the timer info to. Not really
     * important in our implementation as the timer info will be passed as the second argument to
     * the callback function.
     */
    name: string;

    /**
     * The type of a timer binding.  Must be 'timerTrigger'.
     */
    type: "timerTrigger";

    /**
     * The direction of the binding. Timer is only defined as input to functions.
     */
    direction: "in";

    /**
     * The CRON expression of the timer schedule.
     */
    schedule: string;
}

/**
 * Data that will be passed along in the context object to the TimerContext.
 */
export interface TimerContext extends subscription.Context {
    executionContext: {
        invocationId: string;
        functionName: string;
        functionDirectory: string;
    };

    "bindingData": {
        "timerTrigger": string,
        "sys": {
            "methodName": string,
            "utcNow": string,
        },
        "invocationId": string,
    };
}

/**
 * Auxiliary timer information that will be passed as the second argument to the callback function.
 */
export interface TimerInfo {
    isPastDue: boolean;
    last: string;
    next: string;
}

/**
 * Signature of the callback that can receive timer notifications.
 */
export type TimerCallback = subscription.Callback<TimerContext, TimerInfo>;

export interface TimerEventSubscriptionArgs extends subscription.EventSubscriptionArgs<TimerContext, TimerInfo> {
    /**
     * The CRON expression of the timer schedule.
     */
    schedule: pulumi.Input<string>;
}

/**
 * Creates a new subscription to the given time schedule using the callback provided, along with optional
 * options to control the behavior of the subscription.
 */
export async function onTimer(
    name: string, account: azure.storage.Account,
    args: TimerEventSubscriptionArgs, opts?: pulumi.ResourceOptions): Promise<TimerEventSubscription> {

    args = args || {};

    const bindings = pulumi.output(args.schedule).apply(s => {
        const timerBinding: TimerBinding = {
            name: "timer",
            type: "timerTrigger",
            direction: "in",
            schedule: s
        };

        return [timerBinding];
    });

    return new TimerEventSubscription(name, account, bindings, args, opts);
}

export class TimerEventSubscription extends subscription.EventSubscription<TimerContext, TimerInfo> {
    readonly account: azure.storage.Account;

    constructor(
        name: string, account: azure.storage.Account, bindings: pulumi.Output<TimerBinding[]>,
        args: subscription.EventSubscriptionArgs<TimerContext, TimerInfo>, options?: pulumi.ResourceOptions) {

        super("azure-serverless:account:TimerEventSubscription", name, bindings, args, options);

        this.account = account;
    }
}

const resourceGroup = new azure.core.ResourceGroup("cloudbench", {
    location: "West Europe",
});

// Create a storage account for our images
const storageAccount = new azure.storage.Account("cloudbenchsa", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    accountReplicationType: "LRS",
    accountTier: "Standard",
});
let fn = onTimer("fn", storageAccount, {
    func: (context, msg) => {
        console.log(context);
        console.log(msg.next);
        context.done();
    },
    schedule: "0 * * * * *",
    resourceGroup: resourceGroup,
});
//export let endpoint = fn.endpoint;