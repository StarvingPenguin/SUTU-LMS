import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://qhxokzsujtsuxsokledo.supabase.co/rest/v1/courses'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeG9renN1anRzdXhzb2tsZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDQ2MjEsImV4cCI6MjA4OTY4MDYyMX0.GAxuW5mYI8zVu5k0gY088TtyEAYzslq4bRLvNbIDSSk',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeG9renN1anRzdXhzb2tsZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDQ2MjEsImV4cCI6MjA4OTY4MDYyMX0.GAxuW5mYI8zVu5k0gY088TtyEAYzslq4bRLvNbIDSSk',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

updates = [
    {"id": 2, "video": "https://www.youtube.com/watch?v=WUvTyaaNkzM"},
    {"id": 3, "video": "https://www.youtube.com/watch?v=Gv9_4yMHFhI"},
    {"id": 4, "video": "https://www.youtube.com/watch?v=liRPtvj7bFU"},
    {"id": 5, "video": "https://www.youtube.com/watch?v=qKiGkP-4C-0"},
    {"id": 6, "video": "https://www.youtube.com/watch?v=vyNdNkq0-L8"},
    {"id": 7, "video": "https://www.youtube.com/watch?v=2nAVyEDK9_U"}
]

for item in updates:
    update_url = f"{url}?id=eq.{item['id']}"
    data_bytes = json.dumps({"video_url": item['video']}).encode('utf-8')
    req = urllib.request.Request(update_url, data=data_bytes, headers=headers, method='PATCH')
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            print(f"Course {item['id']} updated successfully. Status DB:", response.status)
    except Exception as e:
        print(f"Failed to update course {item['id']}:", e)
