export default function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          max-w-[75%] px-4 py-3 rounded-xl text-sm leading-relaxed
          ${
            isUser
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-white/5 text-gray-200 border border-white/10 rounded-bl-none"
          }
        `}
      >
        {content}
      </div>
    </div>
  );
}
