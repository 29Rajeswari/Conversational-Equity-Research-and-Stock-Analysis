export default function Modal({
  isOpen,
  onClose,
  title,
  children
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        className="
          relative z-10 w-full max-w-md
          rounded-xl bg-white/5 backdrop-blur-md
          border border-white/10 shadow-xl
          p-6
        "
      >
        {/* HEADER */}
        {title && (
          <h3 className="text-lg font-semibold text-white mb-4">
            {title}
          </h3>
        )}

        {/* BODY */}
        <div className="text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
}
