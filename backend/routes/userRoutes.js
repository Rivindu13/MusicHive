import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { uid, email, role, name, photoURL } = req.body;


  let user = await User.findOne({ uid });

  if (!user) {
    user = await User.create({
      uid,
      email,
      role,
      name,
      photoURL
    });

  }

  res.json(user);
});

router.get("/:uid", async (req, res) => {
  const user = await User.findOne({ uid: req.params.uid });
  res.json(user);
});

export default router;
