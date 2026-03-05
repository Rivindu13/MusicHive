import Chord from "../models/chord.js";

// POST /api/chords
export const createChord = async (req, res) => {
  try {
    const { uid, role, title, genre, imageUrl } = req.body;

    if (!uid || !role || !imageUrl) {
      return res.status(400).json({ message: "uid, role and imageUrl required" });
    }

    const chord = await Chord.create({
      uid,
      role,        // ✅ ADD THIS
      title,
      genre,
      imageUrl,
    });

    return res.status(201).json(chord);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/chords/artist/:uid
export const getChordsByArtist = async (req, res) => {
  try {
    const chords = await Chord.find({ uid: req.params.uid, role: "ARTIST" }).sort({
      createdAt: -1,
    });
    return res.json(chords);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ✅ GET /api/chords/customer/:uid
export const getChordsByCustomer = async (req, res) => {
  try {
    const chords = await Chord.find({ uid: req.params.uid, role: "CUSTOMER" }).sort({
      createdAt: -1,
    });
    return res.json(chords);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE /api/chords/:id
export const deleteChord = async (req, res) => {
  try {
    const deleted = await Chord.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Chord not found" });

    return res.json({ message: "Chord deleted", chord: deleted });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};