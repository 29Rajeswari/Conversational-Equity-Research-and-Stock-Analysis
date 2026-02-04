import { Menu, Sun, Moon, LogOut, User } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Navbar({ onToggleSidebar, darkMode, setDarkMode }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="h-16 w-full flex items-center justify-between px-6
      bg-gradient-to-r from-slate-900 to-slate-800
      border-b border-white/10 backdrop-blur-md">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 transition"
        >
          <Menu className="text-gray-300" size={20} />
        </button>

        <h1 className="text-lg md:text-xl font-semibold text-white tracking-wide">
          Financial Research AI
        </h1>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">

        {/* THEME TOGGLE */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          {darkMode ? (
            <Sun className="text-yellow-400" size={18} />
          ) : (
            <Moon className="text-gray-300" size={18} />
          )}
        </button>

        {/* USER BADGE */}
        <div className="flex items-center gap-2 px-3 py-1.5
          rounded-lg bg-white/10 text-gray-200">
          <User size={16} />
          <span className="text-sm font-medium">
            {user?.name || "John Doe"}
          </span>
        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-red-500/10 transition"
        >
          <LogOut className="text-red-400" size={18} />
        </button>
      </div>
    </header>
  );
}
