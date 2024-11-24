const express = require("express");
const router = express.Router();
const User = require("../Models/User");

// Upload user profile and cover photo
router.post("/updateProfileImages", async (req, res) => {
  const { ImageUri, ImageType, userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (ImageType === "profile") {
      user.Images.profile = ImageUri;
    } else if (ImageType === "cover") {
      user.Images.coverImg = ImageUri;
    } else {
      return res.status(400).json({ error: "Invalid ImageType" });
    }
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile data (name, bio)
router.post("/updateProfileData/:id", async (req, res) => {
  const { FirstName, LastName, Bio } = req.body;
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (FirstName) user.firstName = FirstName;
    if (LastName) user.LastName = LastName;
    if (Bio) user.Bio = Bio;

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating profile data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set default profile image if not set
router.post("/setProfile/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.Images.profile || !user.Images) {
      console.log("work");
      
      user.Images.profile =
        user.Gender.toLowerCase() == "male"
          ? "https://i.ibb.co/hBjSQLy/boy.png"
          : "https://i.ibb.co/51W8TcQ/woman.png";

      await user.save();
    }

    res.status(200).send(user);
  } catch (error) {
    console.error("Error setting default profile image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
