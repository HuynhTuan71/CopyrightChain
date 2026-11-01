/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nền xanh đen kỹ thuật công nghệ đậm
        background: '#040B1A',
        surface: 'rgba(255, 255, 255, 0.04)',
        'surface-hover': 'rgba(255, 255, 255, 0.07)',
        'surface-border': 'rgba(255, 255, 255, 0.09)',
        'surface-border-hover': 'rgba(0, 102, 204, 0.4)',
        // Bộ màu nhận diện chuẩn Đại học Kỹ thuật - Công nghệ Cần Thơ (CTUET)
        brand: {
          dark: '#002266',       // Xanh đậm CTUET
          primary: '#003399',    // Xanh dương thương hiệu CTUET chính
          blue: '#0066CC',       // Xanh dương công nghệ CTUET
          light: '#2979FF',      // Xanh dương sáng
          cyan: '#38BDF8',       // Xanh Cyan điểm nhấn
          bg: '#040B1A',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(0, 102, 204, 0.5)',
        'glow-primary': '0 0 25px -5px rgba(0, 51, 153, 0.6)',
        'glow-cyan': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #003399 0%, #0066CC 50%, #38BDF8 100%)',
        'tuet-gradient': 'linear-gradient(135deg, #002266 0%, #003399 40%, #0066CC 80%, #38BDF8 100%)',
      },
    },
  },
  plugins: [],
}
