import urllib.request
import json

url = 'https://qhxokzsujtsuxsokledo.supabase.co/rest/v1/courses?select=id,course_name,description'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeG9renN1anRzdXhzb2tsZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDQ2MjEsImV4cCI6MjA4OTY4MDYyMX0.GAxuW5mYI8zVu5k0gY088TtyEAYzslq4bRLvNbIDSSk',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeG9renN1anRzdXhzb2tsZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDQ2MjEsImV4cCI6MjA4OTY4MDYyMX0.GAxuW5mYI8zVu5k0gY088TtyEAYzslq4bRLvNbIDSSk'
}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))
    with open('courses_output.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print("Written to courses_output.json")
