#Connect-AzureRmAccount

$WebAppApiVersion = "2018-02-01"

Function ListWebApps($ResourceGroupName)
{
    Find-AzureRmResource -ResourceGroupName $ResourceGroupName -ResourceType Microsoft.Web/sites -ApiVersion 2015-11-01
}

Function SyncFunctionAppTriggers($ResourceGroupName, $SiteName)
{
    Invoke-AzureRmResourceAction -ResourceGroupName $ResourceGroupName -ResourceType "Microsoft.Web/sites" -ResourceName $SiteName -Action syncfunctiontriggers -ApiVersion $WebAppApiVersion -Force
}

$rgs = "cloudbenchbf740389", "cbscheduler-global-e34bcd64", "cbazure-rg31a0b853"


ForEach ($rg in $rgs)
{ 
    $apps = ListWebApps -ResourceGroupName $rg
    ForEach ($app in $apps) 
    {
        Write-Host ("Syncing triggers for " + $app.Name)
        SyncFunctionAppTriggers -ResourceGroupName $rg -SiteName $app.Name
    }
}