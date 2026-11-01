const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CopyrightRegistry - Kiểm thử Smart Contract Đăng Ký Bản Quyền", function () {
  let copyrightRegistry;
  let owner, addr1, addr2;

  // Dữ liệu mẫu phục vụ kiểm thử
  const hash1 = ethers.keccak256(ethers.toUtf8Bytes("noi_dung_file_1"));
  const hash2 = ethers.keccak256(ethers.toUtf8Bytes("noi_dung_file_2"));
  const hash3 = ethers.keccak256(ethers.toUtf8Bytes("noi_dung_file_3"));

  const title1 = "Tranh kỹ thuật số Sunset";
  const desc1 = "Bản vẽ phong cảnh hoàng hôn kích thước 3840x2160";

  beforeEach(async function () {
    // Lấy danh sách ví test từ Hardhat Network
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract mới trước mỗi ca kiểm thử để đảm bảo tính độc lập
    const CopyrightRegistry = await ethers.getContractFactory("CopyrightRegistry");
    copyrightRegistry = await CopyrightRegistry.deploy();
    await copyrightRegistry.waitForDeployment();
  });

  describe("1. Khởi tạo ban đầu", function () {
    it("Tổng số tác phẩm ban đầu phải bằng 0", async function () {
      expect(await copyrightRegistry.totalWorks()).to.equal(0);
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
    it("Đăng ký thành công và phát sự kiện WorkRegistered chính xác", async function () {
      const tx = await copyrightRegistry
        .connect(owner)
        .registerWork(hash1, title1, desc1);

      // Kiểm tra event WorkRegistered được emit với đúng tham số
      await expect(tx)
        .to.emit(copyrightRegistry, "WorkRegistered")
        .withArgs(hash1, owner.address, title1, (val) => val > 0n);

      // Kiểm tra trạng thái lưu trữ
      expect(await copyrightRegistry.isRegistered(hash1)).to.be.true;

      const work = await copyrightRegistry.getWork(hash1);
      expect(work.fileHash).to.equal(hash1);
      expect(work.owner).to.equal(owner.address);
      expect(work.title).to.equal(title1);
      expect(work.description).to.equal(desc1);
      expect(work.timestamp).to.be.gt(0);
    });

    it("Tổng số tác phẩm (totalWorks) phải tăng chính xác sau mỗi lần đăng ký", async function () {
      expect(await copyrightRegistry.totalWorks()).to.equal(0);

      await copyrightRegistry.connect(owner).registerWork(hash1, title1, desc1);
      expect(await copyrightRegistry.totalWorks()).to.equal(1);

      await copyrightRegistry.connect(addr1).registerWork(hash2, "Bài hát ABC", "Mp3 320kbps");
      expect(await copyrightRegistry.totalWorks()).to.equal(2);
    });

    it("Từ chối đăng ký trùng hash bởi cùng một ví", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, title1, desc1);

      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, "Tieu de khac", "Mo ta khac")
      ).to.be.revertedWith("Tac pham da duoc dang ky");
    });

    it("Từ chối đăng ký trùng hash bởi ví khác (chống đạo văn/mạo danh)", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, title1, desc1);

      await expect(
        copyrightRegistry.connect(addr1).registerWork(hash1, "Toi la chu that", "Mo ta")
      ).to.be.revertedWith("Tac pham da duoc dang ky");
    });

    it("Từ chối nếu hash rỗng (bytes32(0))", async function () {
      await expect(
        copyrightRegistry.connect(owner).registerWork(ethers.ZeroHash, title1, desc1)
      ).to.be.revertedWith("Hash file khong hop le");
    });

    it("Từ chối nếu tiêu đề rỗng", async function () {
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, "", desc1)
      ).to.be.revertedWith("Tieu de khong duoc de trong");
    });

    it("Từ chối nếu tiêu đề vượt quá 100 byte", async function () {
      const longTitle = "a".repeat(101); // 101 ký tự ASCII = 101 byte
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, longTitle, desc1)
      ).to.be.revertedWith("Tieu de khong duoc vuot qua 100 byte");
    });

    it("Chấp nhận tiêu đề có độ dài đúng 100 byte", async function () {
      const validTitle = "a".repeat(100);
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, validTitle, desc1)
      ).to.not.be.reverted;
    });

    it("Từ chối nếu mô tả vượt quá 500 byte", async function () {
      const longDesc = "b".repeat(501); // 501 byte
      await expect(
        copyrightRegistry.connect(owner).registerWork(hash1, title1, longDesc)
      ).to.be.revertedWith("Mo ta khong duoc vuot qua 500 byte");
    });
  });

  describe("3. Tra cứu danh sách tác phẩm theo chủ sở hữu (getWorksByOwner)", function () {
    it("Trả về danh sách rỗng nếu ví chưa đăng ký tác phẩm nào", async function () {
      const works = await copyrightRegistry.getWorksByOwner(owner.address);
      expect(works).to.deep.equal([]);
    });

    it("Trả về đầy đủ và chính xác danh sách các mã hash đã đăng ký của ví", async function () {
      await copyrightRegistry.connect(owner).registerWork(hash1, "Tác phẩm 1", "Mô tả 1");
      await copyrightRegistry.connect(owner).registerWork(hash2, "Tác phẩm 2", "Mô tả 2");

      const ownerWorks = await copyrightRegistry.getWorksByOwner(owner.address);
      expect(ownerWorks.length).to.equal(2);
      expect(ownerWorks[0]).to.equal(hash1);
      expect(ownerWorks[1]).to.equal(hash2);

      // Địa chỉ addr1 không bị lẫn danh sách
      const addr1Works = await copyrightRegistry.getWorksByOwner(addr1.address);
      expect(addr1Works.length).to.equal(0);
    });
  });

  describe("4. Chuyển nhượng quyền sở hữu (transferOwnership)", function () {
    beforeEach(async function () {
      // Đăng ký trước 2 tác phẩm cho owner
      await copyrightRegistry.connect(owner).registerWork(hash1, "Tác phẩm 1", "Mô tả 1");
      await copyrightRegistry.connect(owner).registerWork(hash2, "Tác phẩm 2", "Mô tả 2");
    });

    it("Chuyển nhượng thành công, cập nhật owner và danh sách tác phẩm cả hai bên", async function () {
      // Thực hiện chuyển nhượng hash1 từ owner sang addr1
      const tx = await copyrightRegistry
        .connect(owner)
        .transferOwnership(hash1, addr1.address);

      // Kiểm tra event OwnershipTransferred
      await expect(tx)
        .to.emit(copyrightRegistry, "OwnershipTransferred")
        .withArgs(hash1, owner.address, addr1.address);

      // 1. Kiểm tra owner trong struct Work đã đổi thành addr1
      const work = await copyrightRegistry.getWork(hash1);
      expect(work.owner).to.equal(addr1.address);

      // 2. Kiểm tra danh sách ownerWorks của người cũ (owner) đã bị xoá hash1 (swap-and-pop)
      const ownerWorks = await copyrightRegistry.getWorksByOwner(owner.address);
      expect(ownerWorks.length).to.equal(1);
      expect(ownerWorks).to.not.include(hash1);
      expect(ownerWorks[0]).to.equal(hash2);

      // 3. Kiểm tra danh sách ownerWorks của người mới (addr1) đã nhận hash1
      const addr1Works = await copyrightRegistry.getWorksByOwner(addr1.address);
      expect(addr1Works.length).to.equal(1);
      expect(addr1Works[0]).to.equal(hash1);
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
