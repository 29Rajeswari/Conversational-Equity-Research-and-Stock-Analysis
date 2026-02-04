export default function Card({
  children,
  className = "",
  hover = true
}) {
  return (
    <div
      className={`
        rounded-xl
        bg-white/5
        backdrop-blur-md
        border border-white/10
        shadow-lg shadow-black/30
        ${hover ? "hover:bg-white/10 transition-all duration-200" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
