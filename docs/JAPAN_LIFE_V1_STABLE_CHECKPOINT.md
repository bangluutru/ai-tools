# 🛡️ JAPAN LIFE V1 STABLE CHECKPOINT & HƯỚNG DẪN KHÔI PHỤC (DISASTER RECOVERY)

Tài liệu này ghi nhận **Điểm chốt ổn định tuyệt đối (Gold Standard Stable Checkpoint)** của phân hệ **Japan Life V1** thuộc hệ sinh thái **Toolio AI-Tools Master Hub**.  
Trong trường hợp triển khai hoặc phát triển tương lai gặp bất kỳ lỗi, xung đột phiên bản hoặc thoái thoái giao diện, hãy sử dụng tài liệu này để hoàn nguyên hệ thống về trạng thái hoàn hảo đã được chứng nhận 100%.

---

## 📌 1. Thông Tin Nhận Diện Phiên Bản (Checkpoint Metadata)

| Thuộc tính | Giá trị ghi nhận chính thức |
|---|---|
| **Mã phiên bản (Semantic Version)** | `v1.0.0-stable` (Japan Life V1 Suite) |
| **Git Tag chính thức** | `japan-life-v1.0.0-stable` |
| **Git Tag Release Candidate** | `japan-life-v1-rc1` |
| **Git Tag Baseline Snapshot** | `pre-japan-life-v1-hardening` |
| **Ngày thẩm định & đóng băng** | 11/09/2026 |
| **Trạng thái kiểm thử tự động** | **651 / 651 tests PASSED (100%)** (Core: 576, Hub: 75) |
| **Trạng thái Audit tĩnh Miniapps** | **58 / 58 miniapps PASSED (100%)** (0 Failures) |
| **Trạng thái Kiểm thử Trình duyệt Thật** | **100% PASS** (Google Chrome, axe-core WCAG 2.1 AA 0 errors) |
| **Kiến trúc Ghép nối** | 0 circular dependencies, 0 cross-miniapp imports, 100% lazy loading |
| **Lệnh khôi phục nhanh (Rollback)** | `git checkout japan-life-v1.0.0-stable` |

---

## 🎯 2. Trạng Thái Hoạt Động Được Đảm Bảo (Verified Capabilities)

Ở phiên bản này, toàn bộ 34 công cụ Japan Life và 7 Life Events liên miền được bảo vệ độc lập, vận hành 100% client-side:

### A. 7 Canonical Life Events Hoạt Động Hoàn Hảo
1. **Mới Đến Nhật (`life.jp.arriving`)**: Điều phối 8 bước nhập cư, mở tài khoản, đăng ký con dấu, thẻ cư trú, đăng ký y tế Shiyakusho.
2. **Bắt Đầu Cuộc Sống (`life.jp.starting_life`)**: Hướng dẫn 6 thủ tục thiết yếu viễn thông, nhà ở, thẻ My Number, khai báo thuế ban đầu.
3. **Chuyển Việc (`life.jp.changing_job`)**: Đồng bộ 7 bước chuyển đổi bảo hiểm, nenkin, thông báo Cục XNC trong 14 ngày, quyết toán thuế cuối năm.
4. **Nghỉ Việc / Thất Nghiệp (`life.jp.leaving_job`)**: Quy trình 6 bước nhận trợ cấp thất nghiệp Hello Work, chuyển sang Kokumin Kenpo & Nenkin.
5. **Đón Gia Đình Sang (`life.jp.family_joining`)**: Hướng dẫn 6 bước xin COE tư cách Kazoku Taizai, chứng minh thu nhập và thủ tục nhập học/bảo hiểm.
6. **Sinh Con (`life.jp.childbirth`)**: Lộ trình 8 bước nhận 500.000 JPY trợ cấp sinh, thủ tục đặt tên, Jido Teate, thẻ BHYT và thẻ cư trú cho bé.
7. **Rời Nhật Bản (`life.jp.leaving_japan`)**: Quy trình 7 bước Tenshutsu Todoke, thuế thị dân trước xuất cảnh, chỉ định người quản lý thuế và rút Nenkin 1 lần.

### B. 34 Công Cụ Chuyên Biệt Được Chứng Nhận
- **Thuế & Nghĩa vụ Tài chính**: `japan-tax-simulator`, `tax-calculator`.
- **Bảo hiểm Xã hội & Lương hưu**: `social-insurance-simulator`, `social-insurance-eligibility`, `dependent-insurance`, `national-pension-guide`.
- **Việc làm & Quyền lợi Lao động**: `unemployment-benefit`, `unemployment-eligibility`, `paid-leave-checker`, `overtime-calculator`, `work-scope-checker`, `affiliation-change-checker`.
- **Gia đình & Trẻ em**: `child-allowance-calc`, `childcare-leave-calc`, `childcare-leave-eligibility`, `maternity-allowance`.
- **Nhà ở & Chuyển dọn**: `moving-cost-estimator`, `moving-admin-checker`, `address-change-checklist`.
- **Tư cách lưu trú & Xuất nhập cảnh**: `residence-renewal-guide`, `status-change-guide`, `family-immigration-guide`, `pr-readiness-checker`.
- **Thủ tục Hành chính & Biểu mẫu**: `document-finder-jp`, `certificate-acquisition-guide`, `mynumber-procedure-guide`, `official-form-helper`, `procedure-requirement-checker`, `administrative-navigator`.
- **Wizards & Central Conductor**: `arriving-in-japan-wizard`, `leaving-japan-wizard`, `birth-wizard`, `moving-wizard`, `japan-life-navigator`.

---

## ⚡ 3. Hướng Dẫn Khôi Phục Nhanh Khi Gặp Sự Cố (Disaster Recovery Runbook)

Nếu môi trường dev hoặc build gặp lỗi không rõ nguyên nhân sau các thay đổi mã nguồn mới:

### Bước 1: Hoàn nguyên mã nguồn về mốc ổn định
```bash
# Xóa bỏ các thay đổi chưa commit tạm thời (nếu có)
git stash

# Hoàn nguyên cây mã nguồn về mốc tag ổn định
git checkout japan-life-v1.0.0-stable
```

### Bước 2: Cài đặt sạch và kiểm tra phụ thuộc
```bash
npm install
```

### Bước 3: Kiểm tra tính toàn vẹn hệ thống
```bash
# 1. Chạy toàn bộ 651 bài test
npm test

# 2. Xây dựng gói sản xuất
npm run build:hub

# 3. Kiểm thử trên trình duyệt thật
node scripts/verify-miniapp-browser.mjs --tool=japan-life-navigator
```

---

## 🔒 4. Cam Kết Pháp Lý & Bảo Mật Dữ Liệu
- **Zero-Cloud Client Execution**: Toàn bộ thuật toán chạy 100% tại trình duyệt người dùng. Không lưu trữ thông tin cá nhân (PII), số My Number, hộ chiếu trên bất kỳ máy chủ bên thứ ba nào.
- **Căn cứ Pháp quy**: Tuân thủ Đạo luật Quản lý Xuất nhập cảnh, Luật Tiêu chuẩn Lao động, Luật Thuế Thu nhập và Luật Trợ cấp Trẻ em Nhật Bản (Hiệu lực 2026).
