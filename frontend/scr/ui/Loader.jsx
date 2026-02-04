export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      
      {/* SPINNER */}
      <div
        className="
          w-8 h-8 rounded-full
          border-2 border-blue-500/30
          border-t-blue-500
          animate-spin
        "
      />

      {/* TEXT */}
      <p className="text-sm text-gray-400">
        {text}
      </p>
    </div>
  );
}
