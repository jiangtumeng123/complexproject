// frontend/src/api.js
const API_URL = "http://localhost:5000";

export const fetchBackend = async () => {
  const response = await fetch(`${API_URL}/`);
  return response.text();
};
