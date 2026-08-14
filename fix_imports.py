import os
import re
import glob

# The components we extracted
core_components = [
    "CertificatePage", "ContentLines", "DeletePageBtn", "DocToolbar", 
    "ExcelMappingView", "GoogleFontPicker", "LegalDocumentView", 
    "LongDocTranslatorView", "OverflowWarning", "PageCard", 
    "PageNavigator", "PdfMergerView", "PdfSplitterView", 
    "PromptHelper", "TemplateOverlayView", "UndoToast", 
    "UserGuideView", "ZoneEditor"
]

apps_dirs = glob.glob("docstudio-*/src") + glob.glob("hub/src")

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    for comp in core_components:
        # Match from '*/components/CompName'
        content = re.sub(
            r"from\s+['\"](?:[a-zA-Z0-9_./-]+/)?components/" + comp + r"(?:\.jsx)?['\"]",
            f"from '@ai-tools/core/components/{comp}'",
            content
        )

        # Match from './CompName' if we are already inside a components directory
        if "/components/" in file_path:
             content = re.sub(
                 r"from\s+['\"]\./" + comp + r"(?:\.jsx)?['\"]",
                 f"from '@ai-tools/core/components/{comp}'",
                 content
             )
             
    # Fix utils and hooks in App.jsx or other places
    content = re.sub(
        r"from\s+['\"](?:\.\.?/)+utils/([^'\"]+)['\"]",
        r"from '@ai-tools/core/utils/\1'",
        content
    )
    
    content = re.sub(
        r"from\s+['\"](?:\.\.?/)+hooks/([^'\"]+)['\"]",
        r"from '@ai-tools/core/hooks/\1'",
        content
    )
             
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

for d in apps_dirs:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith(('.js', '.jsx')):
                fix_imports(os.path.join(root, f))
