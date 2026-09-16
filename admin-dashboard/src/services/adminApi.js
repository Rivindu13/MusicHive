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

export const updateUserRole = async (userId, role) => {
  const response = await adminAxios.patch(`/admin/users/${userId}/role`, {
    role,
  });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await adminAxios.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getArtists = async () => {
  const response = await adminAxios.get("/admin/artists");
  return response.data.data;
};

export const blockArtist = async (artistId) => {
  const response = await adminAxios.patch(`/admin/artists/${artistId}/block`);
  return response.data;
};

export const unblockArtist = async (artistId) => {
  const response = await adminAxios.patch(`/admin/artists/${artistId}/unblock`);
  return response.data;
};

export const deleteArtist = async (artistId) => {
  const response = await adminAxios.delete(`/admin/artists/${artistId}`);
  return response.data;
};

export const getBookings = async () => {
  const response = await adminAxios.get("/admin/bookings");
  return response.data.data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const response = await adminAxios.patch(`/admin/bookings/${bookingId}/status`, {
    status,
  });
  return response.data;
};

export const updateBookingPaymentStatus = async (bookingId, paymentStatus) => {
  const response = await adminAxios.patch(
    `/admin/bookings/${bookingId}/payment-status`,
    { paymentStatus }
  );
  return response.data;
};

export const deleteBooking = async (bookingId) => {
  const response = await adminAxios.delete(`/admin/bookings/${bookingId}`);
  return response.data;
};

export const getChords = async () => {
  const response = await adminAxios.get("/admin/chords");
  return response.data.data;
};

export const deleteChord = async (chordId) => {
  const response = await adminAxios.delete(`/admin/chords/${chordId}`);
  return response.data;
};

export const getReviews = async () => {
  const response = await adminAxios.get("/admin/reviews");
  return response.data.data;
};

export const getReports = async () => {
  const response = await adminAxios.get("/admin/reports");
  return response.data.data;
};

export const updateReportStatus = async (reportId, status) => {
  const response = await adminAxios.patch(`/admin/reports/${reportId}/status`, { status });
  return response.data;
};

export const deleteReview = async (reviewId) => {
  const response = await adminAxios.delete(`/admin/reviews/${reviewId}`);
  return response.data;
};

export const getAdminProfile = async () => {
  const response = await adminAxios.get("/admin/auth/profile");
  return response.data.admin;
};

export const getPaymentSummary = async () => {
  const response = await adminAxios.get("/admin/payments/summary");
  return response.data.data;
};

export const getPayments = async () => {
  const response = await adminAxios.get("/admin/payments");
  return response.data.data;
};

export const updatePaymentStatus = async (bookingId, paymentStatus) => {
  const response = await adminAxios.patch(
    `/admin/payments/${bookingId}/status`,
    { paymentStatus }
  );
  return response.data;
};

export default adminAxios;