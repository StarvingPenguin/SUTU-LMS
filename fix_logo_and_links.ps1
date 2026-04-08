$rootPath = Get-Location
$htmlFiles = Get-ChildItem -Path $rootPath -Filter *.html -Recurse

foreach ($file in $htmlFiles) {
    if ($file.FullName -match "node_modules") { continue }
    
    $content = Get-Content $file.FullName -Raw
    $isRoot = $file.DirectoryName -eq $rootPath.Path
    $assetPath = if ($isRoot) { "assets/university-logo.png" } else { "../assets/university-logo.png" }

    # 1. Inject Logo into Navbar if missing
    if ($content -notmatch "university-logo\.png") {
        # Match <div class="logo"><a href="...">...</a></div>
        $content = $content -replace '(<div class="logo">\s*<a href="[^"]*".*?>)', "`$1`n                <img src=`"$assetPath`" alt=`"DBATU Logo`" class=`"nav-logo`">"
        Write-Host "Injected logo into $($file.Name)"
    }

    # 2. Fix Home links if they are broken/hardcoded
    $homeRel = if ($isRoot) { "index.html" } else { "../index.html" }
    $content = $content -replace '(<div class="logo">\s*<a href=")[^"]*(")', "`$1$homeRel`$2"

    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}

Write-Host "Logo injection and link synchronization completed."
