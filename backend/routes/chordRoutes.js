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

// ✅ Add a review to a chord
router.post("/:id/reviews", async (req, res) => {
  try {
    const { uid, name, photoURL, rating, text } = req.body;

    if (!uid || !name || !rating) {
      return res.status(400).json({ message: "uid, name, rating required" });
    }

    const chord = await Chord.findById(req.params.id);
    if (!chord) return res.status(404).json({ message: "Chord not found" });

    // prevent same user reviewing twice (optional)
    const already = chord.reviews.find((r) => r.uid === uid);
    if (already) {
      return res.status(400).json({ message: "You already reviewed this chord" });
    }

    chord.reviews.push({
      uid,
      name,
      photoURL: photoURL || "",
      rating: Number(rating),
      text: text || "",
    });

    await chord.save();
    res.json(chord);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete a review (only that user) - optional
router.delete("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const { uid } = req.body; // who is deleting
    const chord = await Chord.findById(req.params.id);
    if (!chord) return res.status(404).json({ message: "Chord not found" });

    const review = chord.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.uid !== uid) {
      return res.status(403).json({ message: "Not allowed" });
    }

    review.deleteOne();
    await chord.save();
    res.json(chord);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
