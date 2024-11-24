const express = require("express");
const router = express.Router();
const User = require("../Models/User");

// Search all users by name
router.post("/getUserName/:id", async (req, res) => {
  const { userName } = req.body;
   console.log(userName);
   
  try {
    if (userName && userName.trim().length > 1) {
      // Only search if userName is provided and is not an empty string
      const searchQuery = userName.trim().toLowerCase();

      // Use MongoDB $regex for case-insensitive search, limiting the search fields
      const users = await User.find({
        $or: [
          { firstName: { $regex: searchQuery, $options: "i" } }, // Case-insensitive match for firstName
          { LastName: { $regex: searchQuery, $options: "i" } }, // Case-insensitive match for lastName
        ],
      }).limit(20); // Optionally limit the results to 20 for performance

      res.status(200).json(users); // Return matched users as JSON
    } else {
      res.status(200).json([]); // Send an empty array when userName is not provided
    }
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
