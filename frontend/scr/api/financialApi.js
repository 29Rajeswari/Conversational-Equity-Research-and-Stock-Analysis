import api from "./axios";

// Get financial data for a stock symbol (e.g., AAPL, TSLA)
export const getFinancialData = async (symbol) => {
  const response = await api.get(`/api/financial/${symbol}`);
  return response.data;
};
