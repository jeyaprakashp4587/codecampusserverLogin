const express = require("express");
const router = express.Router();
const User = require("../Models/User");

// Set a new activity for a user
router.post("/setActivity/:id", async (req, res) => {
  const { ActivityName, Date } = req.body;
  const { id } = req.params;

  try {
    // Find the user
    const user = await User.findById(id);
    if (user) {
      // Check if the date already exists
      const existsDate = user.Activities.find(
        (activity) => activity.date == Date
      );

      if (!existsDate) {
        // If the date doesn't exist, create a new entry
        user.Activities.push({
          date: Date,
          activities: [{ activityName: ActivityName }],
        });
      } else {
        // If the date exists, add a new activity
        existsDate.activities.push({ activityName: ActivityName });
      }
      await user.save();
      res.send("Activity added successfully");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
});

// Get all activity dates for a user
router.post("/getAllActivityDates/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user
    const user = await User.findById(id);
    if (user) {
      const dates = user.Activities.map((activity) => activity.date);
      res.send(dates);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
});

// Get activities for a particular date
router.post("/getParticularDateActivities/:id", async (req, res) => {
  const { id } = req.params;
  const { Date } = req.body;

  try {
    // Find the user
    const user = await User.findById(id);
    if (user) {
      const dateActivities = user.Activities.find(
        (activity) => activity.date == Date
      );
      if (dateActivities) {
        res.send(dateActivities.activities);
      } else {
        res.status(404).send("No activities found for this date");
      }
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
});

module.exports = router;
