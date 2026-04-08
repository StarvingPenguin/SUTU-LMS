import os
import re

adverbs = [
    "explicitly", "natively", "securely", "rigorously", "comprehensively", "iteratively",
    "optimally", "generically", "robustly", "naturally", "flawlessly", "seamlessly",
    "intrinsically", "reliably", "efficiently", "perfectly", "structurally", "exclusively",
    "inherently", "properly", "elegantly", "smoothly", "cleanly", "conditionally",
    "correctly", "intelligently", "magically", "creatively", "dependably", "predictably",
    "effortlessly", "successfully", "brilliantly", "automatically", "fluently",
    "organically", "systematically", "flexibly", "implicitly", "realistically",
    "beautifully", "expertly", "practically", "broadly", "specifically", "smartly",
    "compactly", "neatly", "purely", "fundamentally", "dynamically", "logically",
    "accurately", "intuitively", "identically", "universally", "precisely", "effectively",
    "locally", "cleverly", "visually", "conceptually", "rationally", "graphically",
    "confidently", "safely", "appropriately", "mathematically", "recursively",
    "meaningfully", "sequentially", "rationally", "globally", "uniquely", "gracefully",
    "authentically", "explicit", "completely", "completely"
]

word_list = '|'.join(adverbs)

# This matches 2 or more of these words in sequence (with spaces, commas, etc in between)
chain_pattern = re.compile(rf'(?i)(\b(?:{word_list})\b(?:\s*,\s*|\s*\.\s*|\s+)){{1,}}\b(?:{word_list})\b\s*\.?')

# Pattern to catch single instances at the very end of line comments
single_end_pattern = re.compile(rf'(?i)\b(?:{word_list})\b\s*$')

def clean_text(text):
    old_text = text
    
    # 1. Remove long chains of adverbs
    new_text = re.sub(chain_pattern, "", old_text)
    
    # 2. Iterate lines to remove single lingering adverbs at the end of comments
    lines = new_text.split('\n')
    for i in range(len(lines)):
        
        # Clean up line comment ends
        if '//' in lines[i]:
            # repeatedly remove adverbs at the end until none are left
            while True:
                temp = re.sub(single_end_pattern, "", lines[i])
                if temp == lines[i]:
                    break
                lines[i] = temp
                
        # Clean up huge strings that might just be one hallucinated word after another,
        # but the chain pattern should have caught most. 
        # Let's also replace 'alert("");' or similar left over from quiz.js
        if "alert('');" in lines[i] or "alert(' ');" in lines[i] or "alert('.');" in lines[i]:
            lines[i] = lines[i].replace("alert('');", "")
            lines[i] = lines[i].replace("alert(' ');", "")
            lines[i] = lines[i].replace("alert('.');", "")
            
    new_text = '\n'.join(lines)
    
    # Clean up multiple spaces that might have been left behind
    new_text = new_text.replace("  ", " ")
    
    # Special cleanup for quiz.js specifically around line 48 which contained a massive block:
    # "Missing explicit secure course mapping..."
    new_text = re.sub(r"alert\('Missing.*?course mapping.*?'\);", "alert('Missing course mapping.');", new_text)
    new_text = re.sub(r"alert\('No Mock Test mapping.*?for this course\.'\);", "alert('No Mock Test mapping exists for this course.');", new_text)

    # Let's run chain pattern one more time to catch remnants
    new_text = re.sub(chain_pattern, "", new_text)
    
    return new_text

directories = ['.', 'js', 'pages', 'css']

for directory in directories:
    if not os.path.exists(directory): continue
    for filename in os.listdir(directory):
        if filename.endswith(".js") or filename.endswith(".html") or filename.endswith(".css"):
            filepath = os.path.join(directory, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            cleaned = clean_text(content)
            
            if cleaned != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(cleaned)
                print(f"Cleaned {filepath}")
