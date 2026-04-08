import Chord from "../models/Chord.js";

// Create chord
export const createChord = async (req, res) => {
  try {
    const { uid, role, title, genre, imageUrl } = req.body;

    if (!uid || !role || !imageUrl) {
      return res.status(400).json({
        message: "uid, role and imageUrl are required",
      });
    }

    if (!["ARTIST", "CUSTOMER"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const chord = await Chord.create({
      uid,
      role,
      title: title || "",
      genre: genre || "",
      imageUrl,
    });

    return res.status(201).json(chord);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get artist chords
export const getChordsByArtist = async (req, res) => {
  try {
    const chords = await Chord.find({
      uid: req.params.uid,
      role: "ARTIST",
    }).sort({ createdAt: -1 });

    return res.json(chords);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get customer chords
export const getChordsByCustomer = async (req, res) => {
  try {
    const chords = await Chord.find({
      uid: req.params.uid,
      role: "CUSTOMER",
    }).sort({ createdAt: -1 });

    return res.json(chords);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Explore all chords
export const getAllChords = async (req, res) => {
  try {
    const { search = "", genre = "All Genres" } = req.query;

    const query = {};

    if (genre && genre !== "All Genres") {
      query.genre = genre;
    }

    if (search.trim()) {
      query.title = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const chords = await Chord.find(query).sort({ createdAt: -1 });

    return res.json(chords);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Delete chord
export const deleteChord = async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }

    const chord = await Chord.findById(req.params.id);

    if (!chord) {
      return res.status(404).json({ message: "Chord not found" });
    }

    if (String(chord.uid) !== String(uid)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await chord.deleteOne();

    return res.json({ message: "Chord deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};