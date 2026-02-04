import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Dropdown({
  label,
  options = [],
  value,
  onChange,
  className = ""
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block mb-1 text-sm text-gray-300">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-lg
          bg-white/5 text-gray-200
          border border-white/10
          hover:bg-white/10 transition
        "
      >
        <span>{value || "Select option"}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div
          className="
            absolute z-50 mt-2 w-full
            bg-slate-900/95 backdrop-blur-md
            border border-white/10 rounded-lg
            shadow-xl
          "
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="
                px-4 py-2 text-sm text-gray-200
                hover:bg-white/10 cursor-pointer
                transition
              "
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

