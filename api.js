import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 🔧 Axios Instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Fetch Wrapper
async function fetchApi(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  // Handle errors or auto-parse JSON
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API Error');
  }
  return data;
}

export { axiosInstance as api, fetchApi };
