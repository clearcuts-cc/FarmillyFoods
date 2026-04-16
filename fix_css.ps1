$f = "index.html"
if (Test-Path $f) {
    $c = [System.IO.File]::ReadAllText((Resolve-Path $f))
    
    # Fix broken cubic-bezier: 0.2?); -> 0.2,1);
    $c = $c.Replace("0.2₹);", "0.2,1);")
    $c = $c.Replace("(0.2,0.8,0.2₹", "(0.2,0.8,0.2,1")
    
    # Fix any other potential numeric corruptions
    # If a comma and 1 was replaced by Rupee, we'll find things like ",₹" or ".1₹"
    # Actually I see "0.2?" in the log.
    
    [System.IO.File]::WriteAllText((Resolve-Path $f), $c, (New-Object System.Text.UTF8Encoding($true)))
    Write-Host "Recovered CSS in index.html"
}
