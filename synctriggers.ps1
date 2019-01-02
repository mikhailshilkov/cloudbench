#Connect-AzureRmAccount

$WebAppApiVersion = "2018-02-01"

Function ListWebApps($ResourceGroupName)
{
    Get-AzureRmResource -ResourceGroupName $ResourceGroupName -ResourceType Microsoft.Web/sites -ApiVersion 2015-11-01
}

Function SyncFunctionAppTriggers($ResourceGroupName, $SiteName)
{
    Invoke-AzureRmResourceAction -ResourceGroupName $ResourceGroupName -ResourceType "Microsoft.Web/sites" -ResourceName $SiteName -Action syncfunctiontriggers -ApiVersion $WebAppApiVersion -Force
}

$rgs = "cbmonitorrg716c11a5", "cbazure-rgb2f83047"

ForEach ($rg in $rgs)
{ 
    Write-Host ("RG " + $rg)
    $apps = ListWebApps -ResourceGroupName $rg
    ForEach ($app in $apps) 
    {
        Write-Host ("Syncing triggers for " + $app.Name)
        SyncFunctionAppTriggers -ResourceGroupName $rg -SiteName $app.Name
    }
}