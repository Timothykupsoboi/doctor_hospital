
import re

file_path = r'c:\Users\papsi\Music\hms\edoc-doctor-appointment-system\src\pages\admin\AdminReports.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any sequence of bullet+space at the start of a line with spaces
# Each "•  " was probably meant to be 4 spaces or something.
# We'll just remove them and let the next tool or me fix indentation if it's too bad.
# Actually, let's replace "•  " with 4 spaces.

new_content = re.sub(r'•  ', '    ', content)
# Also handle the cases where it might be just "• "
new_content = re.sub(r'• ', '  ', new_content)

# Remove any remaining lone bullets at start of lines
new_content = re.sub(r'^•', '', new_content, flags=re.MULTILINE)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
