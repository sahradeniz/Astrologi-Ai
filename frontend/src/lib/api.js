import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

if (!import.meta.env.VITE_API_URL) {
  console.warn(
    "⚠️ VITE_API_URL is missing. Falling back to http://localhost:5000. Configure .env or vite.config.js for production deployments."
  );
}

function makeUrl(path) {
  if (!path) return BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
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
    console.error(`❌ API Error on ${path}:`, error.response?.data || error.message);
    throw new Error(extractMessage(error));
  }
}

async function get(path) {
  try {
    const response = await axios.get(makeUrl(path), { timeout: 15000 });
    return response.data;
  } catch (error) {
    console.error(`❌ API Error on ${path}:`, error.response?.data || error.message);
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(extractMessage(error));
  }
}

export const calculateNatalChart = (payload) => post("/natal-chart", payload);

export const getInterpretation = (chartData) => {
  let preparedChart = chartData;
  if (typeof preparedChart === "string") {
    try {
      preparedChart = JSON.parse(preparedChart);
    } catch (error) {
      console.warn("Unable to parse chart data string:", error);
      preparedChart = null;
    }
  }

  if (!preparedChart || typeof preparedChart !== "object") {
    console.warn("Invalid chart data supplied to getInterpretation", chartData);
  }

  return post("/interpretation", {
    chart: preparedChart,
    chart_data: preparedChart,
  });
};

export const calculateSynastry = (payload) =>
  post("/calculate_synastry_chart", payload);

export const saveUserProfile = (profile) => post("/save-profile", profile);

export const fetchUserProfile = async () => {
  const result = await get("/get-profile");
  if (!result) return null;
  if (result.profile !== undefined) {
    return result.profile;
  }
  return result;
};

export const updateUserProfile = (profile) => post("/update-profile", profile);

export const sendChatMessage = async (message, chartData) => {
  try {
    const response = await post("/chat/message", { message, chart: chartData });
    return response.reply;
  } catch (error) {
    console.error("Chat error:", error);
    return "Üzgünüm, şu anda yanıt veremiyorum.";
  }
};
