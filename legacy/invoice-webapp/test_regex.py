import re
text1 = """
Đơn vị bán hàng (Seller): CÔNG TY CỔ PHẦN XYZ
Mã số thuế: 123456
Tên hàng hóa, dịch vụ (Service Name)
(No) (Description) (Unit) (Quantity)
1 Dịch vụ lưu trú (Accommodation) 1 1000
"""

seller_match = re.search(r'(?i)(?:Đơn vị bán hàng|Tên người bán|Tên đơn vị bán|Người bán)[^\n:]*:\s*(.*?)(?:\n|Mã số thuế|Địa chỉ)', text1)
print("Seller:", seller_match.group(1).strip() if seller_match else None)

item_match = re.search(r'(?i)(?:Tên hàng hóa|Diễn giải|Tên dịch vụ|Nội dung|Hàng hoá, dịch vụ).*?\n((?:.*?\n){1,3})', text1)
desc = ""
if item_match:
    lines = item_match.group(1).split('\n')
    for d in lines:
        d = d.strip()
        if not d or len(d) < 4: continue
        if re.match(r'^(?:stt|số thứ tự|tên|đơn vị tính|số lượng|đơn giá|mã|\(|\[)', d.lower()): continue
        if "name of goods" in d.lower() or "description" in d.lower(): continue
        desc = f" ({d[:60]}...)" if len(d) > 60 else f" ({d})"
        break
print("Desc:", desc)
