import {
  Send,
  TrendingUp,
  BarChart3,
  Newspaper
} from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Chat", path: "/chat", icon: Send },
  { name: "Research", path: "/research", icon: TrendingUp },
  { name: "Financial Data", path: "/financial", icon: BarChart3 },
  { name: "News & Sentiment", path: "/news", icon: Newspaper },
];

export default function Sidebar({ isOpen }) {
  if (!isOpen) return null;

  return (
    <aside
      className="w-64 h-screen flex flex-col
      bg-gradient-to-b from-slate-900 to-slate-800
      border-r border-white/10 backdrop-blur-md"
    >
      {/* HEADER */}
      <div className="px-6 py-5">
        <h2 className="text-lg font-semibold text-white tracking-wide">
          Navigation
        </h2>
      </div>

      {/* NAV ITEMS */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg
                 transition-all font-medium
                 ${
                   isActive
                     ? "bg-blue-600 text-white shadow-md"
                     : "text-gray-300 hover:bg-white/10"
                 }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-white/10 text-xs text-gray-400">
        <p>Connected to:</p>
        <p className="mt-1 font-mono text-gray-300">
          GPT-4 Financial Model
        </p>
      </div>
    </aside>
  );
}

