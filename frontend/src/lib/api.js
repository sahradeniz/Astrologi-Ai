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

async function put(path, payload) {
  try {
    const response = await axios.put(makeUrl(path), payload, {
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

export const getInterpretation = async (chartData) => {
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

  const data = await post("/interpretation", {
    chart: preparedChart,
    chart_data: preparedChart,
  });

  const legacyText = data?.life_narrative?.text || data?.text || "";

  if (!data?.life_narrative?.card) {
    const fallbackCard = {
      title: "Hayat Anlatısı",
      narrative: { main: legacyText },
      reasons: { psychology: [] },
      actions: [],
      tags: [],
      confidence_label: "Dengeli",
    };
    return {
      ...data,
      life_narrative: {
        ...(data?.life_narrative || {}),
        version: data?.life_narrative?.version || "v1",
        axis: data?.life_narrative?.axis || null,
        confidence_label: data?.life_narrative?.confidence_label || "Dengeli",
        text: legacyText,
        card: fallbackCard,
      },
      cards: data?.cards || { life: fallbackCard },
    };
  }

  return data;
};

export const getAlternateNarrative = async (chartData, strategy = "secondary") => {
  const preparedChart =
    typeof chartData === "string"
      ? (() => {
          try {
            return JSON.parse(chartData);
          } catch (error) {
            console.warn("Unable to parse chart data string:", error);
            return null;
          }
        })()
      : chartData;

  const data = await post("/interpretation", {
    chart: preparedChart,
    chart_data: preparedChart,
    alt_strategy: strategy,
  });

  return data?.life_narrative || {
    version: "v1",
    axis: null,
    themes: [],
    focus: null,
    derived_from: [],
    confidence: null,
    strategy,
    text: data?.text || "",
  };
};

export const calculateSynastry = (payload) =>
  post("/calculate_synastry_chart", payload);

export const saveUserProfile = (profile) => post("/api/profile", profile);

export const fetchUserProfile = async (email) => {
  if (!email) {
    throw new Error("Profil için e-posta sağlanmalı.");
  }
  const result = await get(`/api/profile?email=${encodeURIComponent(email)}`);
  if (!result) return null;
  if (result.profile !== undefined) {
    return result.profile;
  }
  return result;
};

export const updateUserProfile = (profile) => put("/api/profile", profile);

export const sendChatMessage = async (message, chartData) => {
  try {
    const response = await post("/chat/message", { message, chart: chartData });
    return response.reply;
  } catch (error) {
    console.error("Chat error:", error);
    return "Üzgünüm, şu anda yanıt veremiyorum.";
  }
};
