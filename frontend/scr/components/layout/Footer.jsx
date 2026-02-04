export default function Footer() {
  return (
    <footer
      className="w-full h-12 flex items-center justify-center
      border-t border-white/10
      bg-gradient-to-r from-slate-900 to-slate-800
      backdrop-blur-md"
    >
      <p className="text-xs text-gray-400 tracking-wide">
        © {new Date().getFullYear()} Financial Research AI · All rights reserved
      </p>
    </footer>
  );
}

