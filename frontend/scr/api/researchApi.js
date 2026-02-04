import api from "./axios";

export const getResearchAnalysis = async (query) => {
  const response = await api.post("/api/research", {
    query,
  });
  return response.data;
};
