import React, { useEffect, useRef, useState } from "react";
import { renderCertificateCanvas, generateCertificatePDF } from "../utils/pdf";
import { Download, Eye, Sparkles, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const SAMPLE_WORKS = {
  full: {
    title: "Bức Tranh Kỹ Thuật Số Cyberpunk 2026",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    timestamp: 1794285025,
    fileHash: "0x8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    ipfsHash: "QmZtmD2qt8fJpq3CLDHtaGAs65qwDeBFKyKk4yZbN3r5E",
    pHash: "0x9f8e7d6c5b4a3210",
    cleanDescription: "Tranh minh họa số công nghệ cao được chứng nhận bản quyền bất biến trên Blockchain Ethereum Sepolia.",
    description: "Tranh minh họa số công nghệ cao được chứng nhận bản quyền bất biến trên Blockchain Ethereum Sepolia.",
  },
  basic: {
    title: "Mã Nguồn Hợp Đồng Thông Minh Smart Contract v2.0",
    owner: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    timestamp: 1794200000,
    fileHash: "0x5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    ipfsHash: "",
    pHash: "",
    cleanDescription: "Tác phẩm tài liệu kỹ thuật và mã nguồn phần mềm phân tán.",
    description: "Tác phẩm tài liệu kỹ thuật và mã nguồn phần mềm phân tán.",
  },
};

export default function CertificatePreview() {
  const containerRef = useRef(null);
  const [selectedType, setSelectedType] = useState("full");
  const [loading, setLoading] = useState(true);
  const [imgUrl, setImgUrl] = useState("");

  const currentWork = SAMPLE_WORKS[selectedType];

  useEffect(() => {
    let isMounted = true;
    async function draw() {
      setLoading(true);
      try {
        const canvas = await renderCertificateCanvas(currentWork);
        if (isMounted) {
          const url = canvas.toDataURL("image/png");
          setImgUrl(url);
        }
      } catch (err) {
        console.error("Lỗi vẽ canvas:", err);
        toast.error("Lỗi vẽ giấy chứng nhận: " + err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    draw();
    return () => {
      isMounted = false;
    };
  }, [selectedType]);

  const handleDownload = async () => {
    try {
      toast.loading("Đang xuất file Giấy chứng nhận PDF...", { id: "pdf-dl" });
      await generateCertificatePDF(currentWork);
      toast.success("Đã tải Giấy chứng nhận PDF thành công!", { id: "pdf-dl" });
    } catch (err) {
      toast.error("Lỗi: " + err.message, { id: "pdf-dl" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Eye className="w-3.5 h-3.5" /> Xem trước Giấy chứng nhận (Certificate Preview)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Giấy Chứng Nhận Đăng Ký Bản Quyền Số
          </h1>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setSelectedType("full")}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedType === "full"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mẫu Đầy Đủ (IPFS + pHash)
            </button>
            <button
              onClick={() => setSelectedType("basic")}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedType === "basic"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mẫu Cơ Bản
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Tải file PDF</span>
          </button>
        </div>
      </div>

      {/* Vùng xem trước giấy chứng nhận */}
      <div
        id="certificate-viewport"
        ref={containerRef}
        className="glass-card p-3 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[500px]"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400 py-24">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">Đang dựng hình đồ họa Giấy chứng nhận 300 DPI...</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl bg-black">
            <img
              src={imgUrl}
              alt="Giấy chứng nhận bản quyền số"
              className="w-full h-auto block rounded-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}
