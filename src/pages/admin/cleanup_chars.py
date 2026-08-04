
import re

file_path = r'c:\Users\papsi\Music\hms\edoc-doctor-appointment-system\src\pages\admin\AdminReports.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Remove leading dots and spaces if they look like the corruption I introduced
    # Pattern: " •  •  •  • "
    line = re.sub(r'^( •  )+', '', line)
    # Also fix some other lines that might have been mangled
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
