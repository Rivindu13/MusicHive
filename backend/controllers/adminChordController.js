import Chord from "../models/chord.js";
import User from "../models/user.js";

export const getAllChords = async (req, res) => {
  try {
    const chords = await Chord.find().sort({ createdAt: -1 });

    const allUids = [...new Set(chords.map((chord) => chord.uid))];

    const users = await User.find({ uid: { $in: allUids } }).select(
      "uid name email role photoURL"
    );

    const userMap = {};
    users.forEach((user) => {
      userMap[user.uid] = user;
    });

    const enrichedChords = chords.map((chord) => ({
      ...chord.toObject(),
      owner: userMap[chord.uid] || null,
      reviewCount: chord.reviews?.length || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enrichedChords.length,
      data: enrichedChords,
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

    const owner = await User.findOne({ uid: chord.uid }).select(
      "uid name email role photoURL"
    );

    return res.status(200).json({
      success: true,
      data: {
        ...chord.toObject(),
        owner,
        reviewCount: chord.reviews?.length || 0,
      },
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