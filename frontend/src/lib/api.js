import axios from "axios";

const API_BASE = "https://astrolog-ai.onrender.com";

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

async function get(path) {
  try {
    const response = await axios.get(makeUrl(path), { timeout: 15000 });
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error));
  }
}

export const calculateNatalChart = (payload) => post("/natal-chart", payload);

export const getInterpretation = (chartData) =>
  post("/interpretation", { chart: chartData });

export const calculateSynastry = (payload) =>
  post("/calculate_synastry_chart", payload);

export const saveUserProfile = (profile) => post("/save-profile", profile);

export const fetchUserProfile = () => get("/get-profile");

export const sendChatMessage = async (message, chartData) => {
  try {
    const response = await post("/chat/message", { message, chart: chartData });
    return response.reply;
  } catch (error) {
    console.error("Chat error:", error);
    return "Üzgünüm, şu anda yanıt veremiyorum.";
  }
};
