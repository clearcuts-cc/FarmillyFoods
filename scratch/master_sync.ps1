# Refined Master synchronization script
# This script updates the header and footer across all pages without touching the unique body content.

$headerStart = "<!-- HEADER_START -->"
$headerEnd = "<!-- HEADER_END -->"
$footerStart = "<!-- FOOTER_START -->"
$footerEnd = "<!-- FOOTER_END -->"

# Get Master Header/Footer from corporate.html
if(!(Test-Path "corporate.html")) {
    Write-Error "corporate.html not found."
    exit
}
$corp = Get-Content "corporate.html" -Raw

# Extract header between markers
$headerRegex = "(?s)$headerStart(.*?)$headerEnd"
$footerRegex = "(?s)$footerStart(.*?)$footerEnd"

$newHeaderMatch = [regex]::Match($corp, $headerRegex)
$newFooterMatch = [regex]::Match($corp, $footerRegex)

if(!$newHeaderMatch.Success -or !$newFooterMatch.Success) {
    # Fallback: Add markers to corporate.html if missing
    Write-Host "Adding markers to corporate.html..."
    $corp = $corp -replace '(<header id="header">.*?</header>)', "$headerStart`$1$headerEnd"
    $corp = $corp -replace '(<footer id="site-footer">.*?</footer>)', "$footerStart`$1$footerEnd"
    $corp | Set-Content "corporate.html"
    
    # Re-extract
    $newHeaderMatch = [regex]::Match($corp, $headerRegex)
    $newFooterMatch = [regex]::Match($corp, $footerRegex)
}

$newHeader = $newHeaderMatch.Value
$newFooter = $newFooterMatch.Value

$files = @(
    "bee-products.html", "beverages.html", "ghee.html", "spices.html", 
    "refund-policy.html", "shipping-policy.html", "honey.html", "mangoes.html",
    "shop.html", "contact.html", "track.html", "cart.html", "index.html"
)

foreach($f in $files) {
    if(Test-Path $f) {
        $content = Get-Content $f -Raw
        
        # 1. Ensure markers exist in the file.
        if($content -notmatch $headerStart) {
            $content = $content -replace '(?s)<header id="header">.*?</header>', "$headerStart`$0$headerEnd"
        }
        if($content -notmatch $footerStart) {
            $content = $content -replace '(?s)<footer id="site-footer">.*?</footer>', "$footerStart`$0$footerEnd"
        }

        # 2. Sync Header
        if($content -match $headerRegex) {
            $content = [regex]::Replace($content, $headerRegex, $newHeader)
            Write-Host "Synced Header: $f"
        }
        
        # 3. Sync Footer
        if($content -match $footerRegex) {
            $content = [regex]::Replace($content, $footerRegex, $newFooter)
            Write-Host "Synced Footer: $f"
        }
        
        # 4. Standardize Navigation Links (MPA transition)
        $content = $content -replace 'onclick="event.preventDefault\(\); showPage\(''home''\)"', 'href="index.html"'
        $content = $content -replace 'onclick="event.preventDefault\(\); showPage\(''shop''\)"', 'href="shop.html"'
        $content = $content -replace 'onclick="event.preventDefault\(\); showPage\(''corporate''\)"', 'href="corporate.html"'
        $content = $content -replace 'onclick="event.preventDefault\(\); showPage\(''track''\)"', 'href="track.html"'
        $content = $content -replace 'onclick="event.preventDefault\(\); showPage\(''contact''\)"', 'href="contact.html"'
        
        # Fix double href bug
        $content = $content -replace 'href="shop.html" href="shop.html"', 'href="shop.html"'
        
        # Save
        $content | Set-Content $f
    }
}
Write-Host "Sync Complete."
