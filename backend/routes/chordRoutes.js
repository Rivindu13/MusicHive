import express from "express";
import {
  createChord,
  getChordsByArtist,
  deleteChord,
} from "../controllers/chordController.js";

const router = express.Router();

// Create chord
router.post("/", createChord);

// Get chords by artist
router.get("/artist/:uid", getChordsByArtist);

// Delete chord by id
router.delete("/:id", deleteChord);

export default router;
