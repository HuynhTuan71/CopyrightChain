// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CopyrightRegistry
 * @dev Hệ thống đăng ký, quản lý và xác thực bản quyền tác phẩm số trên nền tảng Blockchain Ethereum.
 * Dự án đồ án sinh viên "CopyrightChain" (Phiên bản nâng cấp: On-Chain IPFS CID + Perceptual Hash 64-bit).
 *
 * Nguyên lý hoạt động:
 * 1. Tác giả chọn file trên giao diện web, trình duyệt tính mã băm SHA-256 (bytes32) và dHash 64-bit (bytes8, với ảnh).
 * 2. Smart Contract kiểm tra trùng SHA-256 (100% nhị phân) VÀ kiểm tra tương đồng thị giác pHash (Hamming Distance <= 9 bit,
 *    tương đương độ tương đồng >= 85.9%) trực tiếp on-chain để chặn đăng ký ảnh đã chỉnh sửa/đạo nhái.
 * 3. Bất kỳ ai cũng có thể tra cứu bản gốc, xác minh toàn vẹn hoặc phát hiện ảnh chỉnh sửa công khai không cần ví.
 */
contract CopyrightRegistry {
    // ------------------------------------------------------------------------
    // HẰNG SỐ CẤU HÌNH (CONSTANTS)
    // ------------------------------------------------------------------------

    /**
     * @dev Khoảng cách Hamming tối đa trên pHash 64-bit để xem là đạo nhái/chỉnh sửa.
     * 9 bit khác biệt trên 64 bit <=> độ tương đồng (64 - 9) / 64 = 85.9375% (>= 85%).
     */
    uint8 public constant MAX_SIMILAR_HAMMING_DISTANCE = 9;

    // ------------------------------------------------------------------------
    // CẤU TRÚC DỮ LIỆU (DATA STRUCTURES)
    // ------------------------------------------------------------------------

    /**
     * @dev Thông tin chi tiết của một tác phẩm số được đăng ký bản quyền.
     * @param fileHash Mã băm SHA-256 duy nhất của file tác phẩm
     * @param owner Địa chỉ ví của tác giả / chủ sở hữu hiện tại
     * @param title Tiêu đề của tác phẩm (1..100 byte UTF-8)
     * @param description Mô tả nội dung tác phẩm (tối đa 500 byte UTF-8)
     * @param ipfsCid Mã lưu trữ phi tập trung IPFS CID (tối đa 128 byte, có thể rỗng)
     * @param pHash Dấu vân tay thị giác 64-bit (dHash) cho file ảnh (bytes8(0) nếu không phải ảnh)
     * @param timestamp Thời điểm ghi nhận bản quyền trên block (thời gian Unix)
     */
    struct Work {
        bytes32 fileHash;
        address owner;
        string title;
        string description;
        string ipfsCid;
        bytes8 pHash;
        uint256 timestamp;
    }

    // Lưu trữ thông tin tác phẩm theo mã băm SHA-256
    mapping(bytes32 => Work) private works;

    // Lưu danh sách các mã băm tác phẩm thuộc sở hữu của một địa chỉ ví
    mapping(address => bytes32[]) private ownerWorks;

    // Danh sách toàn bộ mã băm tác phẩm đã đăng ký (hỗ trợ tra cứu trực tiếp không cần eth_getLogs)
    bytes32[] private allWorkHashes;

    // Ánh xạ nhanh O(1) từ pHash trùng khớp 100% sang fileHash gốc
    mapping(bytes8 => bytes32) private pHashToFileHash;

    // Hai mảng song song lưu các tác phẩm có pHash (uint64[] đóng gói 4 phần tử/slot giúp tối ưu gas)
    uint64[] private registeredPHashes;
    bytes32[] private pHashFileHashes;

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
        string ipfsCid,
        bytes8 pHash,
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
     * - Mã hash SHA-256 hợp lệ và chưa từng được đăng ký trước đó.
     * - Tiêu đề từ 1 đến 100 byte, mô tả <= 500 byte, IPFS CID <= 128 byte.
     * - Nếu có pHash (khác bytes8(0)), không được trùng hoặc tương đồng >= 85.9% (Hamming <= 9) với ảnh đã đăng ký.
     * @param fileHash Mã SHA-256 (32 bytes) của tác phẩm
     * @param title Tên hoặc tiêu đề tác phẩm
     * @param description Mô tả ngắn gọn về tác phẩm
     * @param ipfsCid Mã định danh nội dung IPFS (để chuỗi rỗng nếu không dùng IPFS)
     * @param pHash Dấu vân tay thị giác 64-bit của ảnh (truyền bytes8(0) nếu không phải ảnh)
     */
    function registerWork(
        bytes32 fileHash,
        string calldata title,
        string calldata description,
        string calldata ipfsCid,
        bytes8 pHash
    ) external {
        // 1. Kiểm tra mã hash SHA-256 hợp lệ và chưa từng đăng ký
        require(fileHash != bytes32(0), "Hash file khong hop le");
        require(!isRegistered(fileHash), "Tac pham da duoc dang ky");

        // 2. Kiểm tra độ dài các trường văn bản (tính theo byte UTF-8)
        bytes memory titleBytes = bytes(title);
        require(titleBytes.length > 0, "Tieu de khong duoc de trong");
        require(titleBytes.length <= 100, "Tieu de khong duoc vuot qua 100 byte");

        bytes memory descBytes = bytes(description);
        require(descBytes.length <= 500, "Mo ta khong duoc vuot qua 500 byte");

        bytes memory cidBytes = bytes(ipfsCid);
        require(cidBytes.length <= 128, "IPFS CID khong duoc vuot qua 128 byte");

        // 3. Kiểm tra chống đạo nhái thị giác on-chain nếu tác phẩm là hình ảnh (có pHash)
        if (pHash != bytes8(0)) {
            require(
                pHashToFileHash[pHash] == bytes32(0),
                "Phat hien anh trung dau van tay thi giac pHash"
            );

            uint64 target = uint64(pHash);
            uint256 pLen = registeredPHashes.length;
            for (uint256 i = 0; i < pLen; ) {
                require(
                    hammingDistance64(target, registeredPHashes[i]) > MAX_SIMILAR_HAMMING_DISTANCE,
                    "Phat hien anh tuong dong cao voi tac pham da dang ky"
                );
                unchecked {
                    ++i;
                }
            }

            pHashToFileHash[pHash] = fileHash;
            registeredPHashes.push(target);
            pHashFileHashes.push(fileHash);
        }

        // 4. Lưu thông tin tác phẩm vào mapping
        uint256 currentTime = block.timestamp;
        works[fileHash] = Work({
            fileHash: fileHash,
            owner: msg.sender,
            title: title,
            description: description,
            ipfsCid: ipfsCid,
            pHash: pHash,
            timestamp: currentTime
        });

        // 5. Cập nhật các danh sách tra cứu
        ownerWorks[msg.sender].push(fileHash);
        allWorkHashes.push(fileHash);

        // 6. Tăng biến đếm tổng số tác phẩm
        _totalWorks++;

        // 7. Phát sự kiện đăng ký thành công
        emit WorkRegistered(fileHash, msg.sender, title, ipfsCid, pHash, currentTime);
    }

    /**
     * @notice Chuyển nhượng quyền sở hữu bản quyền tác phẩm cho một địa chỉ ví khác.
     * @dev Áp dụng thuật toán swap-and-pop để xoá phần tử khỏi mảng ownerWorks tiết kiệm gas.
     * @param fileHash Mã SHA-256 của tác phẩm cần chuyển nhượng
     * @param newOwner Địa chỉ ví của chủ sở hữu mới
     */
    function transferOwnership(bytes32 fileHash, address newOwner) external {
        require(isRegistered(fileHash), "Tac pham chua duoc dang ky");
        require(works[fileHash].owner == msg.sender, "Chi chu so huu moi co quyen chuyen nhuong");
        require(newOwner != address(0), "Dia chi nguoi nhan khong hop le");
        require(newOwner != msg.sender, "Nguoi nhan phai khac chu so huu hien tai");

        // Cập nhật chủ sở hữu mới cho tác phẩm
        works[fileHash].owner = newOwner;

        // Xoá fileHash khỏi danh sách của chủ cũ bằng kỹ thuật swap-and-pop
        bytes32[] storage senderWorks = ownerWorks[msg.sender];
        uint256 length = senderWorks.length;
        for (uint256 i = 0; i < length; ) {
            if (senderWorks[i] == fileHash) {
                senderWorks[i] = senderWorks[length - 1];
                senderWorks.pop();
                break;
            }
            unchecked {
                ++i;
            }
        }

        // Thêm fileHash vào danh sách tác phẩm của chủ mới
        ownerWorks[newOwner].push(fileHash);

        // Phát sự kiện chuyển quyền sở hữu
        emit OwnershipTransferred(fileHash, msg.sender, newOwner);
    }

    // ------------------------------------------------------------------------
    // HÀM TRA CỨU & PHÂN TÍCH THỊ GIÁC (VIEW / PURE FUNCTIONS)
    // ------------------------------------------------------------------------

    /**
     * @notice Tính khoảng cách Hamming (số bit khác nhau) giữa hai pHash 64-bit bằng thuật toán SWAR.
     * @param a Mã pHash thứ nhất dạng uint64
     * @param b Mã pHash thứ hai dạng uint64
     * @return uint8 Số bit khác nhau (0..64)
     */
    function hammingDistance64(uint64 a, uint64 b) public pure returns (uint8) {
        uint64 x = a ^ b;
        unchecked {
            x = x - ((x >> 1) & 0x5555555555555555);
            x = (x & 0x3333333333333333) + ((x >> 2) & 0x3333333333333333);
            x = (x + (x >> 4)) & 0x0F0F0F0F0F0F0F0F;
            return uint8((x * 0x0101010101010101) >> 56);
        }
    }

    /**
     * @notice Tìm tác phẩm hình ảnh tương đồng nhất trên toàn bộ sổ cái Blockchain theo pHash.
     * @dev Hàm view miễn phí gas, không phụ thuộc eth_getLogs hay bộ nhớ đệm trình duyệt.
     * @param targetPHash Dấu vân tay 64-bit của ảnh cần kiểm tra
     * @param maxDistance Ngưỡng khoảng cách Hamming tối đa chấp nhận tìm kiếm (ví dụ: 9 cho >= 85%, 14 cho >= 78%)
     * @return found True nếu tìm thấy ảnh có khoảng cách Hamming <= maxDistance
     * @return matchedFileHash Mã SHA-256 của tác phẩm gốc giống nhất
     * @return minDistance Khoảng cách Hamming nhỏ nhất tìm được (0..64)
     */
    function findSimilarWork(
        bytes8 targetPHash,
        uint8 maxDistance
    ) external view returns (bool found, bytes32 matchedFileHash, uint8 minDistance) {
        if (targetPHash == bytes8(0) || registeredPHashes.length == 0) {
            return (false, bytes32(0), 64);
        }

        // Nhánh nhanh O(1) nếu pHash khớp hoàn toàn (khoảng cách = 0)
        bytes32 exactMatch = pHashToFileHash[targetPHash];
        if (exactMatch != bytes32(0)) {
            return (true, exactMatch, 0);
        }

        uint64 target = uint64(targetPHash);
        uint256 pLen = registeredPHashes.length;
        uint8 bestDistance = 65;
        uint256 bestIndex = 0;

        for (uint256 i = 0; i < pLen; ) {
            uint8 dist = hammingDistance64(target, registeredPHashes[i]);
            if (dist <= maxDistance && dist < bestDistance) {
                bestDistance = dist;
                bestIndex = i;
                if (bestDistance == 0) {
                    break;
                }
            }
            unchecked {
                ++i;
            }
        }

        if (bestDistance <= maxDistance) {
            return (true, pHashFileHashes[bestIndex], bestDistance);
        }

        return (false, bytes32(0), 64);
    }

    /**
     * @notice Lấy thông tin chi tiết của một tác phẩm theo mã hash.
     * @dev Revert nếu tác phẩm chưa được đăng ký.
     */
    function getWork(bytes32 fileHash) external view returns (Work memory) {
        require(isRegistered(fileHash), "Tac pham chua duoc dang ky");
        return works[fileHash];
    }

    /**
     * @notice Kiểm tra xem mã hash tác phẩm đã được đăng ký trên hệ thống hay chưa.
     */
    function isRegistered(bytes32 fileHash) public view returns (bool) {
        return works[fileHash].timestamp != 0;
    }

    /**
     * @notice Lấy danh sách tất cả mã hash tác phẩm thuộc sở hữu của một địa chỉ ví.
     */
    function getWorksByOwner(address owner) external view returns (bytes32[] memory) {
        return ownerWorks[owner];
    }

    /**
     * @notice Lấy danh sách toàn bộ mã hash tác phẩm đã đăng ký trên hệ thống.
     */
    function getAllWorkHashes() external view returns (bytes32[] memory) {
        return allWorkHashes;
    }

    /**
     * @notice Lấy danh sách tác phẩm theo phân trang trực tiếp từ Blockchain.
     */
    function getWorksPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (Work[] memory) {
        uint256 total = allWorkHashes.length;
        if (offset >= total || limit == 0) {
            return new Work[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 count = end - offset;
        Work[] memory result = new Work[](count);
        for (uint256 i = 0; i < count; ) {
            result[i] = works[allWorkHashes[offset + i]];
            unchecked {
                ++i;
            }
        }
        return result;
    }

    /**
     * @notice Lấy tổng số lượng tác phẩm đã đăng ký trên toàn hệ thống.
     */
    function totalWorks() external view returns (uint256) {
        return _totalWorks;
    }

    /**
     * @notice Lấy tổng số lượng tác phẩm hình ảnh (có dấu vân tay pHash) trên hệ thống.
     */
    function totalImageWorks() external view returns (uint256) {
        return registeredPHashes.length;
    }
}
