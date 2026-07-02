import User from "../models/user.js";

export const getAllArtists = async (req, res) => {
  try {
    const { search = "", role = "", status = "" } = req.query;

    const filter = {
      role: { $in: ["artist", "band"] },
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { uid: { $regex: search, $options: "i" } },
        { "artistProfile.location": { $regex: search, $options: "i" } },
        { "artistProfile.genres": { $regex: search, $options: "i" } },
        { "artistProfile.instruments": { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    const artists = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: artists.length,
      data: artists,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load artists and bands.",
      error: error.message,
    });
  }
};

export const getSingleArtist = async (req, res) => {
  try {
    const artist = await User.findOne({
      _id: req.params.id,
      role: { $in: ["artist", "band"] },
    }).select("-password");

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist or band not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: artist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load artist or band.",
      error: error.message,
    });
  }
};

export const blockArtist = async (req, res) => {
  try {
    const artist = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: { $in: ["artist", "band"] },
      },
      {
        isBlocked: true,
        status: "blocked",
      },
      { new: true }
    ).select("-password");

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist or band not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Artist or band blocked successfully.",
      data: artist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to block artist or band.",
      error: error.message,
    });
  }
};

export const unblockArtist = async (req, res) => {
  try {
    const artist = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: { $in: ["artist", "band"] },
      },
      {
        isBlocked: false,
        status: "active",
      },
      { new: true }
    ).select("-password");

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist or band not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Artist or band unblocked successfully.",
      data: artist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to unblock artist or band.",
      error: error.message,
    });
  }
};

export const deleteArtist = async (req, res) => {
  try {
    const artist = await User.findOneAndDelete({
      _id: req.params.id,
      role: { $in: ["artist", "band"] },
    });

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist or band not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Artist or band deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete artist or band.",
      error: error.message,
    });
  }
};