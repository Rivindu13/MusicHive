import { auth } from "../firebase";

export async function authFetch(url, options = {}) {
  const user = auth.currentUser;

  // If user not logged in
  if (!user) {
    throw new Error("Not logged in");
  }

  const token = await user.getIdToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers });
}