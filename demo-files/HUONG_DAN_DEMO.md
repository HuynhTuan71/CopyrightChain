# 🎬 KỊCH BẢN DEMO BÁO CÁO ĐỒ ÁN COPYRIGHTCHAIN

Thư mục này chứa sẵn các file mẫu để bạn thực hiện demo một cách chuyên nghiệp và thuyết phục nhất trước hội đồng/thầy cô.

---

## 📂 Danh sách file mẫu:
1. `1_TacPham_Goc.txt` & `3_BucTranh_Cyberpunk_Goc.png`: File tác phẩm gốc dùng để đăng ký lần đầu.
2. `1_TacPham_Goc_BAN_SAO.txt`: File sao chép y hệt (cùng từng byte) $\rightarrow$ Dùng để demo tính năng **CHỐNG ĐẠO VĂN / TRÙNG LẶP HASH**.
3. `2_TacPham_DaSua_1DauCham.txt` & `3_BucTranh_Cyberpunk_DaSua_1Pixel.png`: File đã bị chỉnh sửa cố ý dù chỉ 1 ký tự / 1 pixel $\rightarrow$ Dùng để demo tính năng **PHÁT HIỆN GIAN LẬN / HIỆU ỨNG TUYẾT LỞ (Avalanche Effect)**.

---

## 🎙️ Lời thoại & Thao tác Demo từng bước:

### 🔹 Bước 1: Đăng ký bản quyền tác phẩm gốc
- **Thao tác:** 
  1. Vào trang **Đăng ký** (`/register`).
  2. Kéo thả file `3_BucTranh_Cyberpunk_Goc.png` (hoặc `1_TacPham_Goc.txt`).
  3. Bấm nút **"Đăng ký bản quyền ngay"** và xác nhận trên ví MetaMask.
  4. Màn hình pháo hoa chúc mừng xuất hiện, bấm **"Tải Giấy chứng nhận PDF"**.
- **Lời nói:** 
  > *"Em xin bắt đầu với việc đăng ký tác phẩm gốc. Khi vừa chọn file, trình duyệt ngay lập tức băm SHA-256 trên RAM mà không gửi file lên server. Khi ký giao dịch, mã hash và mốc thời gian block được ghi vĩnh viễn lên Ethereum Sepolia. Em có thể tải ngay Giấy chứng nhận PDF kèm mã QR chuẩn A4."*

---

### 🔹 Bước 2: Thử đăng ký lại tác phẩm trùng lặp (Chống đạo nhái)
- **Thao tác:** 
  1. Đổi sang một tài khoản ví khác trên MetaMask (hoặc vẫn giữ nguyên ví).
  2. Kéo file `1_TacPham_Goc_BAN_SAO.txt` (hoặc file gốc ban nãy) vào trang **Đăng ký**.
  3. Hệ thống ngay lập tức hiện khung cảnh báo màu vàng: *"TÁC PHẨM ĐÃ ĐƯỢC ĐĂNG KÝ BẢN QUYỀN!"*, hiển thị tên tác phẩm và địa chỉ ví của tác giả gốc, đồng thời khoá nút đăng ký.
- **Lời nói:** 
  > *"Bây giờ, nếu có một người khác có được file này và cố tình đăng ký để nhận vơ là của mình, Smart Contract và Frontend sẽ ngay lập tức phát hiện mã băm đã tồn tại và chặn giao dịch, bảo vệ tuyệt đối quyền tác giả đầu tiên."*

---

### 🔹 Bước 3: Xác minh công khai không cần ví & Hiệu ứng tuyết lở
- **Thao tác:** 
  1. Ngắt kết nối ví MetaMask (để chứng minh không cần ví).
  2. Vào trang **Xác minh** (`/verify`).
  3. Kéo file đã bị sửa `3_BucTranh_Cyberpunk_DaSua_1Pixel.png` (hoặc `2_TacPham_DaSua_1DauCham.txt`) vào.
  4. Màn hình hiện Thẻ đỏ: *"Chưa có bản ghi trên Blockchain"*.
  5. Tiếp tục kéo file gốc `3_BucTranh_Cyberpunk_Goc.png` vào.
  6. Màn hình đổi sang Thẻ xanh: *"Tác phẩm đã được đăng ký trên Blockchain"* cùng đầy đủ tên, ngày giờ và chủ sở hữu.
- **Lời nói:** 
  > *"Đây là trang xác minh công khai, bất kỳ ai cũng vào xem được mà không cần ví hay tài khoản. Khi em kéo file đã bị sửa dù chỉ 1 pixel vào, mã SHA-256 biến đổi hoàn toàn và hệ thống báo không hợp lệ. Nhưng khi kéo đúng file gốc vào, hệ thống xác nhận thẻ xanh ngay lập tức."*

---

### 🔹 Bước 4: Chuyển nhượng quyền sở hữu
- **Thao tác:** 
  1. Kết nối lại ví, vào trang **Tác phẩm của tôi** (`/my-works`).
  2. Bấm nút **"Chuyển quyền"**, nhập địa chỉ ví của người mua/đối tác.
  3. Xác nhận giao dịch. Tác phẩm được chuyển sang ví mới thành công bằng thuật toán swap-and-pop.
- **Lời nói:** 
  > *"Khi tác giả bán tác phẩm hoặc chuyển nhượng bản quyền, họ có thể bàn giao quyền sở hữu sang ví người nhận trực tiếp trên Smart Contract một cách minh bạch và an toàn."*
