import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function normalizeUrl(path) {
  if (!path) {
    return API_BASE;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function extractErrorMessage(error) {
  const fallback = 'İstek sırasında bir sorun oluştu. Lütfen tekrar dene.';
  if (!error) {
    return fallback;
  }

  const responseMessage =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.response?.data?.detail;

  if (responseMessage) {
    return responseMessage;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}

async function postJson(path, payload) {
  try {
    const url = normalizeUrl(path);
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export const requestNatalChart = (payload) =>
  postJson('/natal-chart', payload);

export const requestSynastryReport = (payload) =>
  postJson('/calculate_synastry_chart', payload);

export const requestChat = (payload) =>
  postJson('/chat/message', payload);
