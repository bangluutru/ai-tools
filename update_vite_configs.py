import os
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

for app in apps:
    vite_path = os.path.join(root_dir, app, 'vite.config.js')
    if os.path.exists(vite_path):
        with open(vite_path, 'r') as f:
            content = f.read()
        
        if 'dedupe' not in content:
            # Inject resolve: { dedupe: ['react', 'react-dom'] } into defineConfig({ ... })
            # If defineConfig({ is found:
            match = re.search(r'defineConfig\s*\(\s*\{', content)
            if match:
                insert_pos = match.end()
                new_content = content[:insert_pos] + "\n  resolve: {\n    dedupe: ['react', 'react-dom'],\n  }," + content[insert_pos:]
                with open(vite_path, 'w') as f:
                    f.write(new_content)
                print(f"Added resolve.dedupe to {app}/vite.config.js")
            else:
                print(f"Could not match defineConfig in {vite_path}")
        else:
            print(f"Already has dedupe in {app}/vite.config.js")

print("All vite.config.js updated.")
