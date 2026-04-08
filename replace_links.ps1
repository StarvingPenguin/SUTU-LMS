$htmlFiles = Get-ChildItem -Path d:\Project_Moodle -Filter *.html -Recurse

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    
    $isRoot = $file.DirectoryName -eq 'd:\Project_Moodle'
    
    $homePath = if ($isRoot) { "index.html" } else { "../index.html" }
    $coursesPath = if ($isRoot) { "pages/courses.html" } else { "courses.html" }
    $aboutPath = if ($isRoot) { "pages/about.html" } else { "about.html" }
    $contactPath = if ($isRoot) { "pages/contact.html" } else { "contact.html" }
    $loginPath = if ($isRoot) { "pages/login.html" } else { "login.html" }
    $registerPath = if ($isRoot) { "pages/register.html" } else { "register.html" }
    
    # Navbar logic
    $content = $content -replace 'href="[^"]*">Home</a>', ("href="$homePath">Home</a>")
    $content = $content -replace 'href="[^"]*">Courses</a>', ("href="$coursesPath">Courses</a>")
    $content = $content -replace 'href="[^"]*">About</a>', ("href="$aboutPath">About</a>")
    $content = $content -replace 'href="[^"]*">Contact</a>', ("href="$contactPath">Contact</a>")
    $content = $content -replace 'href="[^"]*">Browse Courses</a>', ("href="$coursesPath">Browse Courses</a>")
    
    # Login / Register buttons
    $content = $content -replace 'href="[^"]*"([^>]*?)>Login</a>', ("href="$loginPath"$1>Login</a>")
    $content = $content -replace 'href="[^"]*"([^>]*?)>Register</a>', ("href="$registerPath"$1>Register</a>")

    # Sidebar links inside pages/*.html
    if ($file.DirectoryName -match "pages") {
        $content = $content -replace 'href="[^"]*"([^>]*?)><i data-feather="file-text"([^>]*)></i> Assignments</a>', 'href="assignment.html"><i data-feather="file-text"></i> Assignments</a>'
        $content = $content -replace 'href="[^"]*"([^>]*?)><i data-feather="award"([^>]*)></i> Grades</a>', 'href="grades.html"><i data-feather="award"></i> Grades</a>'
        $content = $content -replace 'href="[^"]*"([^>]*?)><i data-feather="bell"([^>]*)></i> Announcements</a>', 'href="announcements.html"><i data-feather="bell"></i> Announcements</a>'
        $content = $content -replace 'href="[^"]*"([^>]*?)><i data-feather="message-circle"([^>]*)></i> Forum</a>', 'href="forum.html"><i data-feather="message-circle"></i> Forum</a>'
        $content = $content -replace 'href="[^"]*"([^>]*?)><i data-feather="user"([^>]*)></i> Profile</a>', 'href="profile.html"><i data-feather="user"></i> Profile</a>'
    }

    # Course Cards Buttons
    if ($file.Name -match "courses.html|dashboard.html|index.html") {
        $detailPath = if ($isRoot) { "pages/course-detail.html" } else { "course-detail.html" }
        $content = $content -replace 'href="[^"]*"([^>]*?)>Enroll Now</a>', ("href="$detailPath"$1>Enroll Now</a>")
        $content = $content -replace 'href="[^"]*"([^>]*?)>Continue Learning</a>', ("href="$detailPath"$1>Continue Learning</a>")
        $content = $content -replace 'href="[^"]*"([^>]*?)>View Details</a>', ("href="$detailPath"$1>View Details</a>")
    }

    # "Register here" and "Login here"
    if ($file.Name -eq "login.html") {
        $content = $content -replace 'href="[^"]*">Register here</a>', 'href="register.html">Register here</a>'
    }
    if ($file.Name -eq "register.html") {
        $content = $content -replace 'href="[^"]*">Login here</a>', 'href="login.html">Login here</a>'
    }
    
    Set-Content -Path $file.FullName -Value $content
}
