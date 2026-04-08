$rootPath = Get-Location
$htmlFiles = Get-ChildItem -Path $rootPath -Filter *.html -Recurse

foreach ($file in $htmlFiles) {
    if ($file.FullName -match "node_modules") { continue }
    
    $content = Get-Content $file.FullName -Raw
    $isRoot = $file.DirectoryName -eq $rootPath.Path
    $assetPath = if ($isRoot) { "assets/university-logo.png" } else { "../assets/university-logo.png" }

    # 1. Navbar / General Logo Injection (All occurrences)
    # We target <div class="logo"><a ...>
    # If the <a> doesn't have an <img> inside, we inject it.
    
    # We use a regex that matches the logo div and its anchor
    $logoRegex = '(<div\s+class="logo">[\s]*<a\s+href="[^"]*"[^>]*>)(?!\s*<img)'
    
    if ($content -match $logoRegex) {
        $content = $content -replace $logoRegex, "`$1`n                <img src=`"$assetPath`" alt=`"DBATU Logo`" class=`"nav-logo`">"
        Write-Host "Updated logos in $($file.Name)"
    }

    # 2. Specific Footer Enhancements (If there is a footer)
    # If there is a footer-col with a logo, ensure it looks premium like index.html
    $footerLogoRegex = '(<footer class="footer">[\s\S]*?<div class="footer-col"[\s\S]*?<div class="logo">[\s]*<a href="[^"]*"[^>]*>)(?!\s*<img[^>]*style)'
    
    # Actually, it's easier to just target the logo inside the footer specifically if we want different styling
    # But for now, let's just make sure the nav-logo class is there and styled in CSS.
    
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}

Write-Host "Global branding synchronization completed."
