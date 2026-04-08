$rootPath = Get-Location
$htmlFiles = Get-ChildItem -Path $rootPath -Filter *.html -Recurse

foreach ($file in $htmlFiles) {
    if ($file.FullName -match "node_modules") { continue }
    
    $content = Get-Content $file.FullName -Raw
    $isRoot = $file.DirectoryName -eq $rootPath.Path
    $assetPath = if ($isRoot) { "assets/university-logo.png" } else { "../assets/university-logo.png" }

    # 1. Sidebar Logo Injection
    if ($content -match '<aside class="sidebar">' -and $content -notmatch 'class="sidebar-logo"') {
        $logoHtml = "`n        <div class=`"sidebar-logo`">`n            <img src=`"$assetPath`" alt=`"University Logo`">`n        </div>"
        $content = $content -replace '(<aside class="sidebar">)', "`$1$logoHtml"
        Write-Host "Added sidebar logo to $($file.Name)"
    }

    # 2. Ensure Footer Logo is Premium (if it exists)
    # We look for the footer logo container and apply the style from index.html if it's the basic version
    if ($file.Name -match "about.html|courses.html|contact.html|register.html|course-detail.html") {
         # Identify the logo column and replace it with the branded one
         $footerReplacement = "`n            <div class=`"footer-col`" style=`"display: flex; flex-direction: column; align-items: flex-start;`">`n                <div class=`"logo`">`n                    <a href=`"../index.html`" style=`"display: flex; align-items: center; gap: 10px;`">`n                        <img src=`"$assetPath`" alt=`"University Logo`" style=`"height: 50px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));`">`n                        <div style=`"display: flex; flex-direction: column;`">`n                            <span style=`"font-size: 1.5rem; font-weight: 700; color: var(--bg-color);`">DBATU <span style=`"color: var(--accent-color);`">LMS</span></span>`n                        </div>`n                    </a>`n                </div>"
         
         # Replace the old footer-col containing the logo
         $content = $content -replace '<div class="footer-col">\s*<div class="logo">[\s\S]*?<\/div>', $footerReplacement
         Write-Host "Upgraded footer logo in $($file.Name)"
    }

    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}
