import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// path to your key
const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");

// read + parse JSON
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "musichive-8f11c.firebasestorage.app",
  });
}

const bucket = getStorage().bucket();

export { bucket };
export default admin;