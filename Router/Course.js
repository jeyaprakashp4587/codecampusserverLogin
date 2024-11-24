const express = require("express");
const router = express.Router();
const User = require("../Models/User");

// Add Course
router.post("/addCourse", async (req, res) => {
  const { courseName, userId } = req.body;
  // console.log(courseName);
  try {
    const user = await User.findById(userId);
    if (user) {
      // Check if the course name already exists
      const existsCourse = user.Courses.some(
        (course) => course.Course_Name === courseName
      );

      if (existsCourse) {
        return res.send("Enrolled");
      }

      // Add course if it doesn't exist
      user.Courses.push({ Course_Name: courseName, Technologies: [] });
      await user.save();
      res.send(user);
    } else {
      res.status(404).send("User not found.");
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
});

// Add Technology to Course
router.post("/addTech", async (req, res) => {
  const { TechName, CourseName, UserId } = req.body;
  try {
    const user = await User.findById(UserId);
    if (user) {
      // Find the course
      const course = user.Courses.find(
        (course) => course.Course_Name === CourseName
      );

      if (!course) {
        return res.status(404).send("Course not found.");
      }

      // Check if the technology is already added
      const existsTech = course.Technologies.some(
        (tech) => tech.TechName === TechName
      );

      if (existsTech) {
        return res.send("Enrolled");
      }

      // Add the technology
      course.Technologies.push({ TechName: TechName, Points: 0 });
      await user.save();
      res.status(200).send(user);
    } else {
      res.status(404).send("User not found.");
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
});

// Remove Course
router.post("/removeCourse", async (req, res) => {
  const { userId, CourseName } = req.body;

  try {
    const user = await User.findById(userId);
    if (user) {
      // Find the course index
      const courseIndex = user.Courses.findIndex(
        (course) => course.Course_Name === CourseName
      );

      if (courseIndex === -1) {
        return res.status(404).send("Course not found.");
      }

      // Remove the course
      user.Courses.splice(courseIndex, 1);
      await user.save();
      res.status(200).send(user);
    } else {
      res.status(404).send("User not found.");
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
});

module.exports = router;
