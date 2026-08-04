
import sys

file_path = r'c:\Users\papsi\Music\hms\edoc-doctor-appointment-system\src\pages\admin\AdminReports.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Replace unicode replacement character (0xEF 0xBF 0xBD in UTF-8)
# We'll use the decoded string for easier logic if possible, 
# but binary is safer for specifically targeting these bytes.

# Mapping of replacements based on context (roughly)
# For buttons (437, 900, 1278), they currently have b'\xef\xbf\xbd' inside >...<
# We will replace all b'\xef\xbf\xbd' with something safe first, then refine.

# However, some should be degree symbols, some bullets.
# Let's do it line by line.

lines = content.split(b'\n')
new_lines = []

for i, line in enumerate(lines):
    line_num = i + 1
    # Buttons
    if line_num in [437, 900, 1278]:
        line = line.replace(b'\xef\xbf\xbd', b'<X size={18} />')
    # Degree symbols
    elif line_num == 1330:
        line = line.replace(b'\xef\xbf\xbd', b'\xc2\xb0') # degree symbol
    # Bullets / Separators
    elif line_num in [1275, 1297, 1389, 1451, 1497]:
        line = line.replace(b'\xef\xbf\xbd', b'\xe2\x80\xa2') # bullet
    # Em-dashes / Placeholders
    elif line_num in [1462, 1463, 1471, 1472, 1473, 1508]:
        line = line.replace(b'\xef\xbf\xbd', b'\xe2\x80\x94') # em-dash
    
    new_lines.append(line)

with open(file_path, 'wb') as f:
    f.write(b'\n'.join(new_lines))
