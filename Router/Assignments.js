const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");

//
router.get("/getAssignments/:assignmentTye", async (req, res) => {
  const { assignmentTye } = req.params;
  // console.log(assignmentTye);
  const collection = DB1.collection("Quiz");
  const findAssignment = await collection.findOne({
    AssignmentType: assignmentTye,
  });
  //   console.log(findAssignment);
  res.send(findAssignment.Quiz);
});

// save the assignment
router.post("/saveAssignment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { AssignmentType, point, level } = req.body;
    console.log(AssignmentType,point,level);
    
    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update or add assignment
    let assignment = user.Assignments.find(a => a.AssignmentType === AssignmentType);
    if (assignment) {
      assignment.AssignmentLevel.push({ LevelType: level, point });
    } else {
      user.Assignments.push({
        AssignmentType,
        AssignmentLevel: [{ LevelType: level, point }]
      });
    }

    // Increment course points if the technology matches the assignment type
    const course = user.Courses.find(course =>
      course.Technologies.some(tech => tech.TechName.toLowerCase() == AssignmentType.toLowerCase())
    );

    if (course) {
      const tech = course.Technologies.find(
        tech => tech.TechName.toLowerCase() == AssignmentType.toLowerCase()
      );

      if (tech) {
        switch (level.toLowerCase()) {
          case "easy":
            tech.Points += 2;
            break;
          case "medium":
            tech.Points += 3;
            break;
          case "hard":
            tech.Points += 5;
            break;
        }
      }
    }

    // Save the updated user data
    await user.save();

    // Send the updated user data in the response
    res.send(user).status(200);
  } catch (error) {
    console.error("Server error while saving assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
