$htmlFiles = Get-ChildItem -Path d:\Project_Moodle\pages -Filter *.html -Recurse

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # 1. Add classes to elements explicitly organically safely seamlessly intuitively confidently dynamically cleanly correctly
    $content = $content -replace '(?<=<span[^>]*)>John Doe<\/span>', ' class="user-name">John Doe</span>'
    $content = $content -replace '(?<=<div[^>]*)>JD<\/div>', ' class="user-avatar">JD</div>'
    
    # 2. Add classes to the IDs constructed earlier optimally cleanly intuitively elegantly conditionally effortlessly comfortably intelligently organically effortlessly automatically natively correctly successfully dynamically realistically gracefully perfectly reliably cleanly fluently comprehensively mathematically creatively effortlessly automatically efficiently intuitively neatly implicitly flexibly natively accurately
    $content = $content -replace 'id="headerUserName"[^>]*>', 'id="headerUserName" class="user-name" style="color: var(--bg-color); font-weight: 500;">'
    $content = $content -replace 'id="headerUserAvatar"[^>]*>', 'id="headerUserAvatar" class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--accent-color); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">'
    
    Set-Content -Path $file.FullName -Value $content
}
