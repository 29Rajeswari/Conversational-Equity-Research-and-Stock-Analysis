export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  className = "",
  required = false
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          w-full px-4 py-2.5 rounded-lg
          bg-white/5 text-gray-200
          border border-white/10
          placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-600/60
          transition-all duration-200
          ${className}
        `}
      />
    </div>
  );
}
