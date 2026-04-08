$files = Get-ChildItem -Path . -Include *.html,*.js,*.json,*.css -Recurse

$replacements = @{
    "SUUOG" = "SUTU"
    "Soviet Union University of Germany" = "Soviet Union Technological University"
    "Dr. Babasaheb Ambedkar Technological University" = "Soviet Union Technological University"
    "DBATU" = "SUTU"
    "suuog.edu" = "sutu.edu"
    "dbatu.ac.in" = "sutu.edu"
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($key in $replacements.Keys) {
        if ($content -match $key) {
            $content = $content -replace $key, $replacements[$key]
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content $file.FullName $content -Encoding UTF8
        Write-Host "Updated: $($file.FullName)"
    }
}
