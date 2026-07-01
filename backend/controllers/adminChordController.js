import Chord from "../models/chord.js";

export const getAllChords = async (req, res) => {
  try {
    const chords = await Chord.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: chords.length,
      data: chords,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load chords.",
      error: error.message,
    });
  }
};

export const getSingleChord = async (req, res) => {
  try {
    const chord = await Chord.findById(req.params.id);

    if (!chord) {
      return res.status(404).json({
        success: false,
        message: "Chord not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: chord,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load chord.",
      error: error.message,
    });
  }
};

export const deleteChord = async (req, res) => {
  try {
    const chord = await Chord.findByIdAndDelete(req.params.id);

    if (!chord) {
      return res.status(404).json({
        success: false,
        message: "Chord not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chord deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete chord.",
      error: error.message,
    });
  }
};