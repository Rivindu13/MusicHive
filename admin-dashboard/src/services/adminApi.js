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

export const getUsers = async () => {
  const response = await adminAxios.get("/admin/users");
  return response.data.data;
};

export const blockUser = async (userId) => {
  const response = await adminAxios.patch(`/admin/users/${userId}/block`);
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await adminAxios.patch(`/admin/users/${userId}/unblock`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await adminAxios.delete(`/admin/users/${userId}`);
  return response.data;
};

export default adminAxios;