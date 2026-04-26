import os

filepath = 'src/pages/AdminDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('alert(', 'showToast(')

with open(filepath, 'w') as f:
    f.write(content)
