import os
import json
import re

root_dir = '/Users/tranhaibang/.gemini/antigravity/scratch/ai-tools'

apps = [
    'docstudio-pdf-overlay',
    'docstudio-certificate',
    'docstudio-editor',
    'docstudio-translator',
    'image-convert',
    'docstudio-pdf-merge',
    'docstudio-pdf-split',
    'docstudio-legal',
    'docstudio-excel-mapping',
    'hub'
]

# 1. Update package.json to include "@ai-tools/core" dependency
for app in apps:
    pkg_path = os.path.join(root_dir, app, 'package.json')
    if os.path.exists(pkg_path):
        with open(pkg_path, 'r') as f:
            data = json.load(f)
        
        if 'dependencies' not in data:
            data['dependencies'] = {}
        
        if '@ai-tools/core' not in data['dependencies']:
            data['dependencies']['@ai-tools/core'] = '*'
            with open(pkg_path, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Added @ai-tools/core to {app}/package.json")

# 2. Update tailwind.config.js to scan packages/core
for app in apps:
    tw_path = os.path.join(root_dir, app, 'tailwind.config.js')
    if os.path.exists(tw_path):
        with open(tw_path, 'r') as f:
            content = f.read()
        
        # Check if it already has packages/core
        if 'packages/core/src' not in content:
            # Insert "../packages/core/src/**/*.{js,ts,jsx,tsx}" into the content array
            match = re.search(r'content:\s*\[', content)
            if match:
                insert_pos = match.end()
                new_content = content[:insert_pos] + '\n    "../packages/core/src/**/*.{js,ts,jsx,tsx}",' + content[insert_pos:]
                with open(tw_path, 'w') as f:
                    f.write(new_content)
                print(f"Updated tailwind.config.js for {app}")
            else:
                print(f"Could not find content array in {tw_path}")

# 3. Add .jsx extension to all imports of @ai-tools/core/components/*
for root, dirs, files in os.walk(root_dir):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')
    if 'packages' in dirs:
        dirs.remove('packages')
    
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Replace: from '@ai-tools/core/components/XYZ' -> from '@ai-tools/core/components/XYZ.jsx'
            new_content, count = re.subn(
                r"(from\s+['\"]@ai-tools/core/components/[^'\"]+?)(?<!\.jsx)(['\"])", 
                r"\1.jsx\2", 
                content
            )
            
            # Also for utils if needed, e.g. .js
            new_content, count2 = re.subn(
                r"(from\s+['\"]@ai-tools/core/utils/[^'\"]+?)(?<!\.js)(['\"])", 
                r"\1.js\2", 
                new_content
            )

            # Also for hooks, e.g. .js
            new_content, count3 = re.subn(
                r"(from\s+['\"]@ai-tools/core/hooks/[^'\"]+?)(?<!\.js)(['\"])", 
                r"\1.js\2", 
                new_content
            )

            # Fix specific case where someone might have used formatters without .js
            new_content, count4 = re.subn(
                r"(from\s+['\"]@ai-tools/core/utils/image/formatters)(?<!\.js)(['\"])", 
                r"\1.js\2", 
                new_content
            )


            if count > 0 or count2 > 0 or count3 > 0 or count4 > 0:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Fixed imports in {filepath}")

print("Done fixing issues.")
