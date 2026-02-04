import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-slate-950" : "bg-gray-100"}`}>
      
      {/* SIDEBAR */}
      <Sidebar isOpen={sidebarOpen} />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        
        {/* NAVBAR */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
