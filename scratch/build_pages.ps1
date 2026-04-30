$template = Get-Content "corporate.html"
$index = Get-Content "index.html"

# Identify Boilerplate Ranges in Template
$headerEnd = 0
for($i=0; $i -lt $template.Count; $i++) {
    if($template[$i] -like '*id="page-corporate"*') {
        $headerEnd = $i - 1
        break
    }
}

$footerStart = 0
for($i=$headerEnd; $i -lt $template.Count; $i++) {
    if($template[$i] -like '*id="site-footer"*') {
        $footerStart = $i
        break
    }
}

$header = $template[0..$headerEnd]
$footer = $template[$footerStart..($template.Count-1)]

# Function to get page content from index.html
function Get-PageContent($pageId) {
    $start = 0
    $end = 0
    for($i=0; $i -lt $index.Count; $i++) {
        if($index[$i] -like "*id=`"$pageId`"*") {
            $start = $i
            # Find the closing tag of the page div
            for($j=$i; $j -lt $index.Count; $j++) {
                if($index[$j] -match '</div>' -and ($index[$j-1] -match '</section>' -or $index[$j-1] -match '</div>')) {
                    $end = $j
                    break
                }
            }
            break
        }
    }
    if($start -eq 0) { return $null }
    return $index[$start..$end]
}

# List of pages to generate
$pages = @(
    @{ id="page-shop"; file="shop.html"; name="shop" },
    @{ id="page-contact"; file="contact.html"; name="contact" },
    @{ id="page-track"; file="track.html"; name="track" },
    @{ id="page-mangoes"; file="mangoes.html"; name="mangoes" },
    @{ id="page-honey"; file="honey.html"; name="honey" },
    @{ id="page-ghee"; file="ghee.html"; name="ghee" },
    @{ id="page-spices"; file="spices.html"; name="spices" },
    @{ id="page-beverages"; file="beverages.html"; name="beverages" },
    @{ id="page-bee-products"; file="bee-products.html"; name="bee-products" }
)

foreach($p in $pages) {
    $body = Get-PageContent $p.id
    if($body) {
        $newFile = $header + $body + $footer
        $newFile = $newFile -replace 'showPage\(''corporate''', "showPage('$($p.name)'"
        $newFile | Set-Content $p.file
        Write-Host "Generated $($p.file)"
    } else {
        Write-Warning "Could not find section $($p.id) in index.html"
    }
}

Write-Host "Full site synchronization complete."
