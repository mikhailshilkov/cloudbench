using namespace System.Net

# Input bindings are passed in via param block.
param($Request, $TriggerMetadata)

const envInstance = process.env["WEBSITE_INSTANCE_ID"];
const instance = envInstance ? `AZ:${envInstance}` : "LOCAL:LOCAL";

$envInstance = $env:WEBSITE_INSTANCE_ID
$instance = "AZ:$envInstance"

if (-Not $env:CbCount) {
  $env:CbCount = 0
}
$env:CbCount = $env:CbCount/1 + 1

$status = [HttpStatusCode]::OK
$body = "Azure_PsNoop_$instance"

$headers = @{}
$headers.Add('Content-Type','text/plain')
$headers.Add('X-CB-Name',$body)
$headers.Add('X-CB-Count',$env:CbCount)
$headers.Add('X-CB-Instance',$instance)

# Associate values to output bindings by calling 'Push-OutputBinding'.
Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
    StatusCode = $status
    Body = $body
    Headers = $headers
})
