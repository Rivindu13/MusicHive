import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const adminAxios = axios.create({
  baseURL: API_BASE_URL,
});

adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const adminLogin = async (email, password) => {
  const response = await adminAxios.post("/admin/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const getDashboardStats = async () => {
  const response = await adminAxios.get("/admin/dashboard/stats");
  return response.data.data;
};

export default adminAxios;