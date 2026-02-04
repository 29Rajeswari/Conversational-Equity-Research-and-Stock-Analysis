import api from "./axios";

// Get news based on query (e.g., "AAPL", "market", "AI")
export const getNews = async (query) => {
  const response = await api.get(`/api/news/${query}`);
  return response.data;
};
