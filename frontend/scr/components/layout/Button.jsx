export default function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  className = ""
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg \
     text-sm font-medium transition-all duration-200 focus:outline-none";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/30",
    secondary:
      "bg-white/10 text-gray-200 hover:bg-white/20 border border-white/10",
    danger:
      "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${
        variants[variant]
      } ${disabled ? disabledStyles : ""} ${className}`}
    >
      {children}
    </button>
  );
}

