$file = "pages\announcements.html"
$content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path, [System.Text.Encoding]::UTF8)

# Replace garbled emoji before "Post New Announcement"
$content = $content -replace '<h3>[^\x00-\x7F]+\s*Post New Announcement</h3>', '<h3>Post New Announcement</h3>'

# Replace garbled emoji before "Edit Announcement"  
$content = $content -replace '<h3>[^\x00-\x7F]+\s*Edit Announcement</h3>', '<h3>Edit Announcement</h3>'

# Replace garbled emoji before "Mark as Important"
$content = $content -replace '>[^\x00-\x7F]+\s*Mark as Important<', '>Mark as Important<'

[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Fixed encoding issues in announcements.html"
