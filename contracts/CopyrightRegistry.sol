// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CopyrightRegistry
 * @dev Hệ thống đăng ký và xác thực bản quyền tác phẩm số trên nền tảng Blockchain Ethereum.
 * Dự án đồ án sinh viên "CopyrightChain".
 *
 * Nguyên lý hoạt động:
 * 1. Tác giả tải file lên giao diện web, trình duyệt tính toán mã băm SHA-256 (bytes32). File gốc KHÔNG tải lên mạng.
 * 2. Hash, tiêu đề, mô tả và địa chỉ ví của tác giả được lưu trữ bất biến (immutable) trên Blockchain.
 * 3. Bất kỳ ai cũng có thể tra cứu và xác thực nguồn gốc bản quyền của file dựa trên mã băm.
 */
contract CopyrightRegistry {
    // ------------------------------------------------------------------------
    // CẤU TRÚC DỮ LIỆU (DATA STRUCTURES)
    // ------------------------------------------------------------------------

    /**
     * @dev Thông tin chi tiết của một tác phẩm số được đăng ký bản quyền.
     * @param fileHash Mã băm SHA-256 duy nhất của file tác phẩm
     * @param owner Địa chỉ ví của tác giả / chủ sở hữu hiện tại
     * @param title Tiêu đề của tác phẩm (tối đa 100 byte)
     * @param description Mô tả nội dung hoặc thông tin tác phẩm (tối đa 500 byte)
     * @param timestamp Thời điểm ghi nhận bản quyền trên block (thời gian Unix)
     */
    struct Work {
        bytes32 fileHash;
        address owner;
        string title;
        string description;
        uint256 timestamp;
    }

    // Lưu trữ thông tin tác phẩm theo mã băm SHA-256
    mapping(bytes32 => Work) private works;

    // Lưu danh sách các mã băm tác phẩm thuộc sở hữu của một địa chỉ ví
    mapping(address => bytes32[]) private ownerWorks;

    // Tổng số lượng tác phẩm đã được đăng ký thành công trên toàn hệ thống
    uint256 private _totalWorks;

    // ------------------------------------------------------------------------
    // SỰ KIỆN (EVENTS)
    // ------------------------------------------------------------------------

    /**
     * @dev Phát ra khi có một tác phẩm mới được đăng ký bản quyền thành công.
     */
    event WorkRegistered(
        bytes32 indexed fileHash,
        address indexed owner,
        string title,
        uint256 timestamp
    );

    /**
     * @dev Phát ra khi quyền sở hữu tác phẩm được chuyển nhượng cho ví mới.
     */
    event OwnershipTransferred(
        bytes32 indexed fileHash,
        address indexed from,
        address indexed to
    );

    // ------------------------------------------------------------------------
    // HÀM XỬ LÝ CHÍNH (MAIN FUNCTIONS)
    // ------------------------------------------------------------------------

    /**
     * @notice Đăng ký bản quyền cho một tác phẩm số mới.
     * @dev Yêu cầu:
     * - Mã hash chưa từng được đăng ký trước đó.
     * - Tiêu đề không được để trống và không vượt quá 100 byte.
     * - Mô tả không được vượt quá 500 byte.
     * @param fileHash Mã SHA-256 (32 bytes) của tác phẩm
     * @param title Tên hoặc tiêu đề tác phẩm
     * @param description Mô tả ngắn gọn về tác phẩm
     */
    function registerWork(
        bytes32 fileHash,
        string calldata title,
        string calldata description
    ) external {
        // 1. Kiểm tra mã hash hợp lệ và chưa từng đăng ký
        require(fileHash != bytes32(0), "Hash file khong hop le");
        require(!isRegistered(fileHash), "Tac pham da duoc dang ky");

        // 2. Kiểm tra độ dài tiêu đề
        bytes memory titleBytes = bytes(title);
        require(titleBytes.length > 0, "Tieu de khong duoc de trong");
        require(titleBytes.length <= 100, "Tieu de khong duoc vuot qua 100 byte");

        // 3. Kiểm tra độ dài mô tả
        bytes memory descBytes = bytes(description);
        require(descBytes.length <= 500, "Mo ta khong duoc vuot qua 500 byte");

        // 4. Lưu thông tin tác phẩm vào mapping
        uint256 currentTime = block.timestamp;
        works[fileHash] = Work({
            fileHash: fileHash,
            owner: msg.sender,
            title: title,
            description: description,
            timestamp: currentTime
        });

        // 5. Thêm hash vào danh sách tác phẩm của người gửi
        ownerWorks[msg.sender].push(fileHash);

        // 6. Tăng biến đếm tổng số tác phẩm
        _totalWorks++;

        // 7. Phát sự kiện đăng ký thành công
        emit WorkRegistered(fileHash, msg.sender, title, currentTime);
    }

    /**
     * @notice Chuyển nhượng quyền sở hữu bản quyền tác phẩm cho một địa chỉ ví khác.
     * @dev Áp dụng thuật toán swap-and-pop để xoá phần tử khỏi mảng mà tiết kiệm gas:
     * Đổi chỗ phần tử cần xoá với phần tử cuối cùng của mảng, sau đó pop().
     * @param fileHash Mã SHA-256 của tác phẩm cần chuyển nhượng
     * @param newOwner Địa chỉ ví của chủ sở hữu mới
     */
    function transferOwnership(bytes32 fileHash, address newOwner) external {
        // Kiểm tra tác phẩm đã đăng ký chưa
        require(isRegistered(fileHash), "Tac pham chua duoc dang ky");

        // Chỉ chủ sở hữu hiện tại mới có quyền chuyển nhượng
        require(works[fileHash].owner == msg.sender, "Chi chu so huu moi co quyen chuyen nhuong");

        // Địa chỉ mới phải hợp lệ và khác địa chỉ hiện tại
        require(newOwner != address(0), "Dia chi nguoi nhan khong hop le");
        require(newOwner != msg.sender, "Nguoi nhan phai khac chu so huu hien tai");

        // Cập nhật chủ sở hữu mới cho tác phẩm
        works[fileHash].owner = newOwner;

        // Xoá fileHash khỏi danh sách của chủ cũ bằng kỹ thuật swap-and-pop
        bytes32[] storage senderWorks = ownerWorks[msg.sender];
        uint256 length = senderWorks.length;
        for (uint256 i = 0; i < length; i++) {
            if (senderWorks[i] == fileHash) {
                senderWorks[i] = senderWorks[length - 1];
                senderWorks.pop();
                break;
            }
        }

        // Thêm fileHash vào danh sách tác phẩm của chủ mới
        ownerWorks[newOwner].push(fileHash);

        // Phát sự kiện chuyển quyền sở hữu
        emit OwnershipTransferred(fileHash, msg.sender, newOwner);
    }

    // ------------------------------------------------------------------------
    // HÀM TRA CỨU DỮ LIỆU (VIEW / READ-ONLY FUNCTIONS)
    // ------------------------------------------------------------------------

    /**
     * @notice Lấy thông tin chi tiết của một tác phẩm theo mã hash.
     * @dev Revert nếu tác phẩm chưa được đăng ký.
     * @param fileHash Mã SHA-256 của tác phẩm cần tra cứu
     * @return Work Thông tin chi tiết của tác phẩm
     */
    function getWork(bytes32 fileHash) external view returns (Work memory) {
        require(isRegistered(fileHash), "Tac pham chua duoc dang ky");
        return works[fileHash];
    }

    /**
     * @notice Kiểm tra xem mã hash tác phẩm đã được đăng ký trên hệ thống hay chưa.
     * @param fileHash Mã SHA-256 của tác phẩm
     * @return bool True nếu tác phẩm đã đăng ký, ngược lại False
     */
    function isRegistered(bytes32 fileHash) public view returns (bool) {
        return works[fileHash].timestamp != 0;
    }

    /**
     * @notice Lấy danh sách tất cả mã hash tác phẩm thuộc sở hữu của một địa chỉ ví.
     * @param owner Địa chỉ ví cần tra cứu
     * @return bytes32[] Danh sách mã hash các tác phẩm
     */
    function getWorksByOwner(address owner) external view returns (bytes32[] memory) {
        return ownerWorks[owner];
    }

    /**
     * @notice Lấy tổng số lượng tác phẩm đã đăng ký trên toàn hệ thống.
     * @dev Dùng để hiển thị số liệu thống kê ở trang chủ.
     * @return uint256 Tổng số tác phẩm
     */
    function totalWorks() external view returns (uint256) {
        return _totalWorks;
    }
}
