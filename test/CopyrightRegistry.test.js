const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CopyrightRegistry - Kiểm thử Smart Contract Đăng Ký Bản Quyền & Chống Đạo Nhái pHash", function () {
  let copyrightRegistry;
  let owner, addr1, addr2;

  // Dữ liệu mẫu phục vụ kiểm thử
  const hash1 = ethers.keccak256(ethers.toUtf8Bytes("noi_dung_file_1"));
  const hash2 = ethers.keccak256(ethers.toUtf8Bytes("noi_dung_file_2"));
  const hash3 = ethers.keccak256(ethers.toUtf8Bytes("noi_dung_file_3"));
  const hash4 = ethers.keccak256(ethers.toUtf8Bytes("noi_dung_file_4"));

  const title1 = "Tranh kỹ thuật số Sunset";
  const desc1 = "Bản vẽ phong cảnh hoàng hôn kích thước 3840x2160";
  const cid1 = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const ZERO_PHASH = "0x0000000000000000";

  // pHash mẫu 64-bit (bytes8)
  const pHashOrig = "0x123456789abcdef0";
  // Khác đúng 1 bit so với pHashOrig (bit thấp nhất 0 -> 1) => tương đồng 63/64 = 98.4%
  const pHashDiff1Bit = "0x123456789abcdef1";
  // Khác đúng 9 bit so với pHashOrig (XOR 0x1ff = 9 bit '1') => tương đồng 55/64 = 85.9% (trong ngưỡng chặn <= 9)
  const pHashDiff9Bits = "0x123456789abcdedf"; // verify: 0xef0 ^ 0x1ff = 0xf0f -> let's compute with BigInt in test
  // Khác đúng 10 bit so với pHashOrig (XOR 0x3ff = 10 bit '1') => tương đồng 54/64 = 84.4% (ngoài ngưỡng chặn)
  const xorBytes8 = (hexA, maskBigInt) => {
    const res = BigInt(hexA) ^ maskBigInt;
    return "0x" + res.toString(16).padStart(16, "0");
  };

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const CopyrightRegistry = await ethers.getContractFactory("CopyrightRegistry");
    copyrightRegistry = await CopyrightRegistry.deploy();
    await copyrightRegistry.waitForDeployment();
  });

  describe("1. Khởi tạo ban đầu", function () {
    it("Tổng số tác phẩm và số tác phẩm ảnh ban đầu phải bằng 0", async function () {
      expect(await copyrightRegistry.totalWorks()).to.equal(0);
      expect(await copyrightRegistry.totalImageWorks()).to.equal(0);
      expect(await copyrightRegistry.getAllWorkHashes()).to.deep.equal([]);
    });

    it("isRegistered phải trả về false đối với hash chưa từng đăng ký", async function () {
      expect(await copyrightRegistry.isRegistered(hash1)).to.be.false;
    });

    it("getWork phải revert với lỗi 'Tac pham chua duoc dang ky' khi chưa có dữ liệu", async function () {
      await expect(copyrightRegistry.getWork(hash1)).to.be.revertedWith(
        "Tac pham chua duoc dang ky"
      );
    });
  });

  describe("2. Đăng ký tác phẩm (registerWork)", function () {
    it("Đăng ký thành công (kèm IPFS CID & pHash) và phát sự kiện WorkRegistered chính xác", async function () {
      const tx = await copyrightRegistry
        .connect(owner)
        .registerWork(hash1, title1, desc1, cid1, pHashOrig);

      await expect(tx)
        .to.emit(copyrightRegistry, "WorkRegistered")
        .withArgs(hash1, owner.address, title1, cid1, pHashOrig, (val) => val > 0n);

      expect(await copyrightRegistry.isRegistered(hash1)).to.be.true;
      expect(await copyrightRegistry.totalImageWorks()).to.equal(1);

      const work = await copyrightRegistry.getWork(hash1);
      expect(work.fileHash).to.equal(hash1);
      expect(work.owner).to.equal(owner.address);
      expect(work.title).to.equal(title1);
      expect(work.description).to.equal(desc1);
      expect(work.ipfsCid).to.equal(cid1);
      expect(work.pHash).to.equal(pHashOrig);
      expect(work.timestamp).to.be.gt(0);
    });

    it("Cho phép đăng ký nhiều file không phải ảnh (pHash = bytes8(0)) mà không bị xung đột", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, "Tài liệu 1", desc1, "", ZERO_PHASH);
      await copyrightRegistry.connect(addr1).registerWork(hash2, "Bài hát ABC", "Mp3 320kbps", cid1, ZERO_PHASH);

      expect(await copyrightRegistry.totalWorks()).to.equal(2);
      expect(await copyrightRegistry.totalImageWorks()).to.equal(0);
    });

    it("Từ chối đăng ký trùng hash bởi cùng một ví", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, title1, desc1, "", ZERO_PHASH);

      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, "Tieu de khac", "Mo ta khac", "", ZERO_PHASH)
      ).to.be.revertedWith("Tac pham da duoc dang ky");
    });

    it("Từ chối đăng ký trùng hash bởi ví khác (chống đạo văn/mạo danh)", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, title1, desc1, "", ZERO_PHASH);

      await expect(
        copyrightRegistry.connect(addr1).registerWork(hash1, "Toi la chu that", "Mo ta", "", ZERO_PHASH)
      ).to.be.revertedWith("Tac pham da duoc dang ky");
    });

    it("Từ chối nếu hash rỗng (bytes32(0))", async function () {
      await expect(
        copyrightRegistry.connect(owner).registerWork(ethers.ZeroHash, title1, desc1, "", ZERO_PHASH)
      ).to.be.revertedWith("Hash file khong hop le");
    });

    it("Từ chối nếu tiêu đề rỗng", async function () {
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, "", desc1, "", ZERO_PHASH)
      ).to.be.revertedWith("Tieu de khong duoc de trong");
    });

    it("Từ chối nếu tiêu đề vượt quá 100 byte", async function () {
      const longTitle = "a".repeat(101);
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, longTitle, desc1, "", ZERO_PHASH)
      ).to.be.revertedWith("Tieu de khong duoc vuot qua 100 byte");
    });

    it("Chấp nhận tiêu đề có độ dài đúng 100 byte", async function () {
      const validTitle = "a".repeat(100);
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, validTitle, desc1, "", ZERO_PHASH)
      ).to.not.be.reverted;
    });

    it("Từ chối nếu mô tả vượt quá 500 byte", async function () {
      const longDesc = "b".repeat(501);
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, title1, longDesc, "", ZERO_PHASH)
      ).to.be.revertedWith("Mo ta khong duoc vuot qua 500 byte");
    });

    it("Từ chối nếu IPFS CID vượt quá 128 byte", async function () {
      const longCid = "Q".repeat(129);
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, title1, desc1, longCid, ZERO_PHASH)
      ).to.be.revertedWith("IPFS CID khong duoc vuot qua 128 byte");
    });
  });

  describe("3. Chống đạo nhái thị giác On-Chain (pHash & Hamming Distance)", function () {
    it("Tính đúng khoảng cách Hamming 64-bit ở mọi trường hợp biên", async function () {
      expect(await copyrightRegistry.hammingDistance64(0n, 0n)).to.equal(0);
      expect(await copyrightRegistry.hammingDistance64(0n, 1n)).to.equal(1);
      expect(await copyrightRegistry.hammingDistance64(0n, 0x8000000000000000n)).to.equal(1);
      expect(await copyrightRegistry.hammingDistance64(0n, 0xffffffffffffffffn)).to.equal(64);
      expect(await copyrightRegistry.hammingDistance64(0x123456789abcdef0n, 0x123456789abcdef0n)).to.equal(0);
      expect(await copyrightRegistry.hammingDistance64(0x123456789abcdef0n, 0x123456789abcdef1n)).to.equal(1);
      expect(await copyrightRegistry.hammingDistance64(0x123456789abcdef0n, 0x123456789abcdef0n ^ 0x1ffn)).to.equal(9);
      expect(await copyrightRegistry.hammingDistance64(0x123456789abcdef0n, 0x123456789abcdef0n ^ 0x3ffn)).to.equal(10);
    });

    it("Chặn đăng ký ảnh đã sửa 1 pixel (khác SHA-256 nhưng trùng 100% pHash)", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, "Ảnh gốc", desc1, cid1, pHashOrig);

      // Ảnh sửa 1 pixel có fileHash mới (hash2) nhưng pHash giống hệt ảnh gốc
      await expect(
        copyrightRegistry.connect(addr1).registerWork(hash2, "Ảnh sửa 1 pixel", "Đạo nhái", "", pHashOrig)
      ).to.be.revertedWith("Phat hien anh trung dau van tay thi giac pHash");
    });

    it("Chặn đăng ký ảnh chỉnh sửa nhẹ (Hamming distance = 1 bit, tương đồng 98.4%)", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, "Ảnh gốc", desc1, cid1, pHashOrig);

      await expect(
        copyrightRegistry.connect(addr1).registerWork(hash2, "Ảnh nén lại", "", "", pHashDiff1Bit)
      ).to.be.revertedWith("Phat hien anh tuong dong cao voi tac pham da dang ky");
    });

    it("Chặn đăng ký ảnh ở ngưỡng biên trên (Hamming distance = 9 bit, tương đồng 85.9%)", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, "Ảnh gốc", desc1, cid1, pHashOrig);

      const pHash9 = xorBytes8(pHashOrig, 0x1ffn); // 9 bit khác nhau
      await expect(
        copyrightRegistry.connect(addr1).registerWork(hash2, "Ảnh chỉnh màu", "", "", pHash9)
      ).to.be.revertedWith("Phat hien anh tuong dong cao voi tac pham da dang ky");
    });

    it("Cho phép đăng ký ảnh khác biệt rõ rệt (Hamming distance >= 10 bit, tương đồng <= 84.4%)", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, "Ảnh 1", desc1, cid1, pHashOrig);

      const pHash10 = xorBytes8(pHashOrig, 0x3ffn); // 10 bit khác nhau
      await expect(
        copyrightRegistry.connect(addr1).registerWork(hash2, "Ảnh 2 khác hẳn", "", "", pHash10)
      ).to.not.be.reverted;

      expect(await copyrightRegistry.totalImageWorks()).to.equal(2);
    });

    it("findSimilarWork trả về đúng ảnh gốc, khoảng cách Hamming và chủ sở hữu mới nhất", async function () {
      const pHashOther = xorBytes8(pHashOrig, 0xffffffff00000000n); // Khác 32 bit
      await copyrightRegistry.connect(owner).registerWork(hash1, "Tranh Cyberpunk", desc1, cid1, pHashOrig);
      await copyrightRegistry.connect(addr1).registerWork(hash2, "Tranh Phong Cảnh", "", "", pHashOther);

      // 1. Trùng 100% pHash (distance = 0)
      const [found0, matched0, dist0] = await copyrightRegistry.findSimilarWork(pHashOrig, 9);
      expect(found0).to.be.true;
      expect(matched0).to.equal(hash1);
      expect(dist0).to.equal(0);

      // 2. Sửa 1 pixel (distance = 1)
      const [found1, matched1, dist1] = await copyrightRegistry.findSimilarWork(pHashDiff1Bit, 9);
      expect(found1).to.be.true;
      expect(matched1).to.equal(hash1);
      expect(dist1).to.equal(1);

      // 3. Không có ảnh tương đồng trong ngưỡng maxDistance = 9
      const pHashUnrelated = xorBytes8(pHashOrig, 0x0000ffff0000ffffn); // 32 bit khác
      const [foundNone, matchedNone, distNone] = await copyrightRegistry.findSimilarWork(pHashUnrelated, 9);
      expect(foundNone).to.be.false;
      expect(matchedNone).to.equal(ethers.ZeroHash);
      expect(distNone).to.equal(64);
    });
  });

  describe("4. Tra cứu danh sách tác phẩm (getWorksByOwner, getAllWorkHashes, getWorksPaginated)", function () {
    it("Trả về danh sách rỗng nếu ví chưa đăng ký tác phẩm nào", async function () {
      const works = await copyrightRegistry.getWorksByOwner(owner.address);
      expect(works).to.deep.equal([]);
    });

    it("Trả về đầy đủ danh sách theo chủ sở hữu, toàn hệ thống và phân trang chính xác", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, "Tác phẩm 1", "Mô tả 1", cid1, pHashOrig);
      await copyrightRegistry.connect(owner).registerWork(hash2, "Tác phẩm 2", "Mô tả 2", "", ZERO_PHASH);
      await copyrightRegistry.connect(addr1).registerWork(hash3, "Tác phẩm 3", "Mô tả 3", "", ZERO_PHASH);

      const ownerWorks = await copyrightRegistry.getWorksByOwner(owner.address);
      expect(ownerWorks).to.deep.equal([hash1, hash2]);

      const allHashes = await copyrightRegistry.getAllWorkHashes();
      expect(allHashes).to.deep.equal([hash1, hash2, hash3]);

      const page1 = await copyrightRegistry.getWorksPaginated(0, 2);
      expect(page1.length).to.equal(2);
      expect(page1[0].fileHash).to.equal(hash1);
      expect(page1[1].fileHash).to.equal(hash2);

      const page2 = await copyrightRegistry.getWorksPaginated(2, 5);
      expect(page2.length).to.equal(1);
      expect(page2[0].fileHash).to.equal(hash3);

      const emptyPage = await copyrightRegistry.getWorksPaginated(10, 5);
      expect(emptyPage.length).to.equal(0);
    });
  });

  describe("5. Chuyển nhượng quyền sở hữu (transferOwnership)", function () {
    beforeEach(async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, "Tác phẩm 1", "Mô tả 1", cid1, pHashOrig);
      await copyrightRegistry.connect(owner).registerWork(hash2, "Tác phẩm 2", "Mô tả 2", "", ZERO_PHASH);
    });

    it("Chuyển nhượng thành công, cập nhật owner, swap-and-pop và giữ nguyên tra cứu pHash", async function () {
      const tx = await copyrightRegistry
        .connect(owner)
        .transferOwnership(hash1, addr1.address);

      await expect(tx)
        .to.emit(copyrightRegistry, "OwnershipTransferred")
        .withArgs(hash1, owner.address, addr1.address);

      const work = await copyrightRegistry.getWork(hash1);
      expect(work.owner).to.equal(addr1.address);

      const ownerWorks = await copyrightRegistry.getWorksByOwner(owner.address);
      expect(ownerWorks).to.deep.equal([hash2]);

      const addr1Works = await copyrightRegistry.getWorksByOwner(addr1.address);
      expect(addr1Works).to.deep.equal([hash1]);

      // findSimilarWork vẫn tìm thấy hash1 và getWork trả về chủ sở hữu mới (addr1)
      const [found, matchedHash] = await copyrightRegistry.findSimilarWork(pHashDiff1Bit, 9);
      expect(found).to.be.true;
      expect(matchedHash).to.equal(hash1);
      const matchedWork = await copyrightRegistry.getWork(matchedHash);
      expect(matchedWork.owner).to.equal(addr1.address);
    });

    it("Từ chối nếu người thực hiện không phải là chủ sở hữu tác phẩm", async function () {
      await expect(
        copyrightRegistry.connect(addr1).transferOwnership(hash1, addr2.address)
      ).to.be.revertedWith("Chi chu so huu moi co quyen chuyen nhuong");
    });

    it("Từ chối nếu chuyển quyền sở hữu cho địa chỉ 0 (address(0))", async function () {
      await expect(
        copyrightRegistry.connect(owner).transferOwnership(hash1, ethers.ZeroAddress)
      ).to.be.revertedWith("Dia chi nguoi nhan khong hop le");
    });

    it("Từ chối nếu chuyển quyền sở hữu cho chính mình", async function () {
      await expect(
        copyrightRegistry.connect(owner).transferOwnership(hash1, owner.address)
      ).to.be.revertedWith("Nguoi nhan phai khac chu so huu hien tai");
    });

    it("Từ chối nếu tác phẩm chưa được đăng ký", async function () {
      await expect(
        copyrightRegistry.connect(owner).transferOwnership(hash3, addr1.address)
      ).to.be.revertedWith("Tac pham chua duoc dang ky");
    });
  });
});
