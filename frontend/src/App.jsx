import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import BackgroundGlow from "./components/BackgroundGlow";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import MyWorks from "./pages/MyWorks";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="relative min-h-screen flex flex-col font-sans transition-colors duration-250 selection:bg-[#0066CC] selection:text-white text-slate-800 dark:text-slate-100">
      {/* Nền hiệu ứng quầng sáng và lưới vi mô */}
      <BackgroundGlow />

      {/* Thanh điều hướng chính */}
      <Navbar />

      {/* Vùng nội dung trang */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 sm:pb-16 flex-grow w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:hash" element={<Verify />} />
          <Route path="/my-works" element={<MyWorks />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Chân trang */}
      <Footer />

      {/* Thông báo dạng Toast hỗ trợ cả Sáng và Tối */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!bg-white dark:!bg-[#0B1229] !text-slate-800 dark:!text-slate-100 !border !border-slate-200 dark:!border-white/10 !shadow-2xl !text-sm !rounded-2xl !px-4 !py-3 font-sans",
          duration: 4000,
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#F43F5E",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
    </div>
  );
}
