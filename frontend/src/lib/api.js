import axios from 'axios';

const API_BASE = 'http://localhost:5000';

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

export const requestSynastryReport = (payload) =>
  postJson('/api/calculate-synastry', payload);

export const requestNatalChart = (payload) =>
  postJson('/api/calculate-natal-chart', payload);

export const requestTransits = (payload) =>
  postJson('/api/calculate-transits', payload);

export const requestChat = (payload) =>
  postJson('/api/chat/message', payload);

export const requestDailyInsight = (payload) =>
  postJson('/api/horoscope', payload);
