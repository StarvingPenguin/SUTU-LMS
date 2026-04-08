import os
import re

def fix_comments(text):
    lines = text.split('\n')
    keywords = [
        "const ", "let ", "var ", "if ", "function ", 
        "document\\.", "window\\.", "setTimeout\\(", "setInterval\\(", 
        "console\\.", "return ", "feather\\.", "localStorage\\.",
        "navLinks\\.", "toggleBtn\\.", "scrollBtn\\.", "prevBtn\\.", "nextBtn\\.",
        # Add basic object method calls usually placed at line starts
        r"[a-zA-Z0-9_$]+\.addEventListener",
        r"[a-zA-Z0-9_$]+\.classList",
        r"[a-zA-Z0-9_$]+\.style",
        r"[a-zA-Z0-9_$]+\.innerHTML",
        r"[a-zA-Z0-9_$]+\.querySelector",
        r"[a-zA-Z0-9_$]+\.insertBefore",
        r"[a-zA-Z0-9_$]+\.appendChild",
        r"[a-zA-Z0-9_$]+\.removeChild",
        r"[a-zA-Z0-9_$]+\.textContent",
        r"loadQuestion\(", r"initSubmission\(", r"renderPalette\(", r"updateTimer\("
    ]
    
    # We will look for any of these matching keywords but they must be preceded by a space and follow a "//" on the same line
    # And we capture the leading whitespace to indent the extracted code on the next line
    pattern_str = r'^([\t ]*)(.*?//.*?) +(' + '|'.join(keywords) + r'.*)$'
    pattern = re.compile(pattern_str)
    
    # Also handle multiple merged lines, although less likely
    changed_any = False
    
    for i in range(len(lines)):
        while True:
            match = pattern.match(lines[i])
            if match:
                leading_space = match.group(1)
                comment_part = match.group(1) + match.group(2)
                code_part = leading_space + match.group(3)
                
                # We replace the line with comment, then newline, then code
                # But wait, we should do it inline and let the array update
                lines[i] = comment_part
                lines.insert(i + 1, code_part)
                changed_any = True
                break # We broke the line, move to next iteration or same iteration? The original line now has no code, the code is on i+1, so we just break.
            else:
                break
                
    # One specific bug in quiz.js: `});` merged with comment
    # Example: renderPalette(); // Update grid visually synchronously });
    for i in range(len(lines)):
        if "//" in lines[i] and "});" in lines[i] and not lines[i].startswith("//"):
            # If the comment has `});` at the end
            if "});" in lines[i].split("//")[1]:
                 lines[i] = lines[i].replace(" });", "").replace("});", "")
                 lines.insert(i + 1, "        });")
                 changed_any = True

    # One specific bug: `} else if` where `}` might be merged?
    for i in range(len(lines)):
        if "//" in lines[i] and lines[i].endswith(" }"):
            if " }" in lines[i].split("//")[1]:
                lines[i] = lines[i][:lines[i].rfind(" }")]
                lines.insert(i+1, "      }")
    
    # Another edge case in branding.js: `// 1. Structural Page Loader logic (Explicit 1 second resolution )`
    # Was originally `// 1. Structural Page Loader logic (Explicit 1 second resolution smoothly natively...)`
    # That one is fine.

    return '\n'.join(lines), changed_any

directories = ['js']

for directory in directories:
    if not os.path.exists(directory): continue
    for filename in os.listdir(directory):
        if filename.endswith(".js"):
            filepath = os.path.join(directory, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            cleaned, changed = fix_comments(content)
            
            if changed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(cleaned)
                print(f"Fixed {filepath}")
