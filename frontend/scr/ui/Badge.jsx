export default function Badge({
  children,
  variant = "default",
  className = ""
}) {
  const variants = {
    default: "bg-white/10 text-gray-200 border border-white/10",
    positive: "bg-green-500/10 text-green-400 border border-green-500/20",
    negative: "bg-red-500/10 text-red-400 border border-red-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1
        rounded-full text-xs font-medium
        backdrop-blur-md
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
