# 🎬 KỊCH BẢN DEMO BÁO CÁO ĐỒ ÁN COPYRIGHTCHAIN
### (Đã tích hợp Nâng cấp 1: IPFS & Nâng cấp 4: Perceptual Hash pHash)

Thư mục này chứa sẵn các file mẫu để bạn thực hiện buổi demo đồ án một cách chuyên nghiệp, thuyết phục và ấn tượng nhất trước hội đồng/thầy cô.

---

## 📂 Danh sách file mẫu:
1. `1_TacPham_Goc.txt` & `3_BucTranh_Cyberpunk_Cyberpunk_Goc.png`: File tác phẩm gốc dùng để đăng ký lần đầu.
2. `1_TacPham_Goc_BAN_SAO.txt`: File sao chép y hệt từng byte $\rightarrow$ Demo tính năng **CHỐNG ĐẠO VĂN / TRÙNG LẶP HASH (SHA-256)**.
3. `2_TacPham_DaSua_1DauCham.txt` & `3_BucTranh_Cyberpunk_DaSua_1Pixel.png`: File đã bị chỉnh sửa cố ý dù chỉ 1 ký tự / 1 pixel $\rightarrow$ Demo tính năng **PHÁT HIỆN GIAN LẬN TINH VI (pHash & Avalanche Effect)**.

---

## 🎙️ Lời thoại & Thao tác Demo từng bước:

### 🔹 Bước 1: Đăng ký bản quyền tác phẩm gốc kèm IPFS & pHash
- **Thao tác:** 
  1. Vào trang **Đăng ký** (`/register`).
  2. Kéo thả file `3_BucTranh_Cyberpunk_Cyberpunk_Goc.png`.
  3. Quan sát giao diện:
     - Hệ thống băm **SHA-256** (chứng minh toàn vẹn nhị phân).
     - Hệ thống phân tích **Dấu vân tay thị giác pHash (64-bit)**.
     - Bật tùy chọn **Lưu trữ phi tập trung IPFS (Pinata)**.
  4. Bấm nút **"Đăng ký bản quyền ngay"** và xác nhận trên ví MetaMask.
  5. Màn hình pháo hoa chúc mừng xuất hiện, bấm **"Tải Giấy chứng nhận PDF"**.
- **Lời nói:** 
  > *"Em xin bắt đầu bằng việc đăng ký tác phẩm gốc. Khi vừa chọn file, trình duyệt tính toán 2 lớp mã băm: SHA-256 để bảo vệ tính toàn vẹn 100%, và pHash để lấy dấu vân tay cấu trúc hình ảnh. File đồng thời được tải lên mạng lưu trữ phi tập trung IPFS. Khi ký giao dịch, toàn bộ dữ liệu này được ghi vĩnh viễn lên Smart Contract Ethereum Sepolia. Em có thể xuất Giấy chứng nhận PDF chuẩn A4 có đầy đủ mã hash, IPFS CID và mã QR xác minh."*

---

### 🔹 Bước 2: Thử đăng ký lại tác phẩm trùng lặp 100% (SHA-256)
- **Thao tác:** 
  1. Đổi sang một tài khoản ví khác trên MetaMask (hoặc vẫn giữ nguyên ví).
  2. Kéo file `1_TacPham_Goc_BAN_SAO.txt` (hoặc file gốc ban nãy) vào trang **Đăng ký**.
  3. Hệ thống ngay lập tức hiện khung cảnh báo màu đỏ: *"CẢNH BÁO: TÁC PHẨM ĐÃ ĐƯỢC ĐĂNG KÝ BẢN QUYỀN TRÊN BLOCKCHAIN!"*, hiển thị tên tác phẩm và địa chỉ ví của tác giả gốc, đồng thời khoá nút đăng ký.
- **Lời nói:** 
  > *"Nếu kẻ gian có được file này và cố tình đăng ký để nhận vơ là của mình, Smart Contract và Frontend sẽ ngay lập tức phát hiện mã băm SHA-256 đã tồn tại và chặn giao dịch, bảo vệ quyền tác giả ban đầu."*

---

### 🔹 Bước 3: Phát hiện đạo nhái tinh vi khi sửa 1 pixel (Nâng cấp 4: pHash)
- **Thao tác:** 
  1. Ngắt kết nối ví MetaMask (chứng minh tính năng xác minh công khai không cần ví).
  2. Vào trang **Xác minh** (`/verify`).
  3. Kéo file đã bị sửa `3_BucTranh_Cyberpunk_DaSua_1Pixel.png` vào.
  4. **Quan sát kết quả thông minh:**
     - Mã SHA-256 biến đổi hoàn toàn (Hiệu ứng Tuyết lở - Avalanche Effect).
     - **NHƯNG THẺ VÀNG CẢNH BÁO XUẤT HIỆN:** *"CẢNH BÁO TƯƠNG ĐỒNG THỊ GIÁC: 98.4%! Phát hiện nghi vấn chỉnh sửa hoặc đạo nhái từ tác phẩm 'Bức tranh Hoàng Hôn Cyberpunk' của tác giả 0x...!"*
  5. Tiếp tục kéo file gốc `3_BucTranh_Cyberpunk_Cyberpunk_Goc.png` vào:
     - Màn hình đổi sang Thẻ xanh: *"Tác phẩm đã được đăng ký trên Blockchain"*, kèm nút **"Xem file gốc trên IPFS"**.
- **Lời nói:** 
  > *"Đây là điểm đột phá của hệ thống: Nếu dùng SHA-256 thông thường, khi kẻ gian sửa chỉ 1 pixel ảnh, mã băm sẽ thay đổi hoàn toàn và hệ thống không nhận ra. Nhưng CopyrightChain tích hợp thuật toán Perceptual Hash (pHash) giúp phân tích hình học thị giác, phát hiện ngay bức tranh này giống 98.4% với tác phẩm gốc đã đăng ký. Điều này ngăn chặn triệt để hành vi đạo nhái tinh vi!"*

---

### 🔹 Bước 4: Quản lý bộ sưu tập & Chuyển nhượng quyền sở hữu
- **Thao tác:** 
  1. Kết nối lại ví, vào trang **Tác phẩm của tôi** (`/my-works`).
  2. Xem danh sách các tác phẩm có gắn huy hiệu **IPFS** và **pHash**, bấm mở file trên IPFS Gateway.
  3. Bấm nút **"Chuyển quyền"**, nhập địa chỉ ví của người nhận/đối tác.
  4. Xác nhận giao dịch. Tác phẩm được chuyển sang ví mới thành công bằng thuật toán swap-and-pop tiết kiệm gas.
- **Lời nói:** 
  > *"Tại trang Tác phẩm của tôi, tác giả có thể quản lý kho tác phẩm, truy cập file qua IPFS, và thực hiện chuyển nhượng bản quyền trực tiếp trên Smart Contract cho đối tác một cách minh bạch."*
