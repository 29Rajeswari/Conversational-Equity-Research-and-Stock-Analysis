import { useEffect, useState } from "react";
import Card from "../../ui/Card";
import Loader from "../../ui/Loader";
import { fetchChatHistory } from "../../api/chatApi";

export default function ChatHistory({ onSelect }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchChatHistory();
        setHistory(data);
      } catch (err) {
        setError("Failed to load chat history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <Card className="h-full p-4">
      <h3 className="text-white font-semibold mb-3">
        Chat History
      </h3>

      {/* LOADING */}
      {loading && <Loader text="Loading chats..." />}

      {/* ERROR */}
      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      {/* HISTORY LIST */}
      <div className="space-y-2">
        {!loading &&
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect?.(item.id)}
              className="
                w-full text-left px-3 py-2 rounded-lg
                bg-white/5 hover:bg-white/10
                border border-white/10
                transition
              "
            >
              <p className="text-sm text-white truncate">
                {item.title || "Untitled Chat"}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </button>
          ))}
      </div>
    </Card>
  );
}
