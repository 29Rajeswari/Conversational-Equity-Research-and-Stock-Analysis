import { useState, useRef, useEffect } from "react";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Loader from "../../ui/Loader";
import MessageBubble from "./MessageBubble";

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // 🔗 Backend API integration later (/api/chat)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm analyzing your query and generating insights based on financial data.",
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <Card className="h-full flex flex-col">

      {/* CHAT HEADER */}
      <div className="border-b border-white/10 pb-3 mb-3">
        <h3 className="text-white font-semibold">AI Financial Assistant</h3>
        <p className="text-xs text-gray-400">
          Ask about stocks, metrics, research, or news
        </p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            role={msg.role}
            content={msg.content}
          />
        ))}

        {loading && <Loader text="AI is typing..." />}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSend}
        className="mt-4 flex gap-2"
      >
        <Input
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          Send
        </Button>
      </form>
    </Card>
  );
}
