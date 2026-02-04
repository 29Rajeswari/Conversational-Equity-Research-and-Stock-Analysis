import api from "./axios";

// Send new chat message
export const sendChatMessage = async (message) => {
  const response = await api.post("/api/chat", {
    message,
  });
  return response.data;
};

// Get chat history from MongoDB
export const getChatHistory = async () => {
  const response = await api.get("/api/chat/history");
  return response.data;
};

