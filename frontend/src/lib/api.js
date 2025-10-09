import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function makeUrl(path) {
  if (!path) return API_BASE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractMessage(error) {
  const fallback = "İstek sırasında bir sorun oluştu. Lütfen tekrar dene.";
  if (!error) return fallback;
  const responseMessage =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.response?.data?.detail;
  if (responseMessage) return responseMessage;
  return error.message || fallback;
}

async function post(path, payload) {
  try {
    const response = await axios.post(makeUrl(path), payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
}

export const calculateNatalChart = (payload) => post("/natal-chart", payload);

export const getInterpretation = (chartData) =>
  post("/interpretation", { chart_data: chartData });

export const calculateSynastry = (payload) =>
  post("/calculate_synastry_chart", payload);
