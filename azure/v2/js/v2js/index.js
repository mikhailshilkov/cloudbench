module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.res = {
        body: "AzureFunction_V2_JS"
    };
};