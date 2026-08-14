import pdfplumber
with pdfplumber.open("/Users/tranhaibang/Downloads/20260519 - VIETNAM/20260522_Hotel_SGN.pdf") as pdf:
    text = ""
    for p in pdf.pages:
        text += p.extract_text() + "\n"
    
lines = text.split('\n')
for i, line in enumerate(lines):
    if "Tên hàng hóa" in line or "hàng hoá" in line or "Tên" in line:
        start = max(0, i-2)
        end = min(len(lines), i+10)
        print('\n'.join(lines[start:end]))
        break
