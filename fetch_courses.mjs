import fs from 'fs';

async function fetchCourses() {
    const url = 'https://qhxokzsujtsuxsokledo.supabase.co/rest/v1/courses?select=id,course_name,description';
    const headers = {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeG9renN1anRzdXhzb2tsZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDQ2MjEsImV4cCI6MjA4OTY4MDYyMX0.GAxuW5mYI8zVu5k0gY088TtyEAYzslq4bRLvNbIDSSk',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeG9renN1anRzdXhzb2tsZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDQ2MjEsImV4cCI6MjA4OTY4MDYyMX0.GAxuW5mYI8zVu5k0gY088TtyEAYzslq4bRLvNbIDSSk'
    };
    
    try {
        const res = await fetch(url, { headers });
        const data = await res.json();
        fs.writeFileSync('courses_output.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log("Written to courses_output.json");
    } catch (e) {
        console.error(e);
    }
}
fetchCourses();
