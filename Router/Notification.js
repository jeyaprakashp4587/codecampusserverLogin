const express = require("express");
const router = express.Router();
const User = require("../Models/User");

// GET request to fetch all notifications for a user
router.get("/getNotifications/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (user) {
      if (user.Notifications && user.Notifications.length > 0) {
        // Map over notifications and combine the notification text with sender details
        const notificationsWithSender = await Promise.all(
          user.Notifications.map(async (notification) => {
            // Find the user by ID to get the sender's data
            const sender = await User.findById(
              notification.NotificationSender,
              "firstName lastName Images.profile"
            );

            return {
              NotificationId: notification._id,
              NotificationType: notification.NotificationType,
              NotificationText: notification.NotificationText,
              NotificationSender: notification.NotificationSender,
              Time: notification.Time,
              seen: notification.seen,
              senderFirstName: notification.senderFirstName || sender.firstName, // Fall back to stored data
              senderLastName: notification.senderLastName || sender.LastName,
              senderProfileImage:
                notification.senderProfileImage || sender.Images.profile,
              postId: notification.postId ? notification.postId : null, // Profile image
            };
          })
        );

        res.status(200).send(notificationsWithSender);
      }
    } else {
      res.status(404).send([]);
    }
  } catch (error) {
    res.status(500).send({ message: "Server error.", error: error.message });
  }
});

// PATCH request to mark a notification as seen
router.patch("/markAsSeen/:userId/:notificationId", async (req, res) => {
  const { notificationId } = req.params;
  console.log(notificationId);
  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      const notificationIndex = user.Notifications.findIndex(
        (notification) =>
          notification._id.toString() === req.params.notificationId
      );
      if (notificationIndex !== -1) {
        // Mark the notification as seen
        user.Notifications[notificationIndex].seen = true;
        await user.save();
        res.status(200).send(user.Notifications[notificationIndex]);
      } else {
        res.status(404).send({ message: "Notification not found." });
      }
    } else {
      res.status(404).send({ message: "User not found." });
    }
  } catch (error) {
    res.status(500).send({ message: "Server error.", error: error.message });
  }
});
//
router.get("/getPostDetails/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    // Aggregate query to find the post and the sender details
    const postDetails = await User.aggregate([
      {
        $match: {
          "Posts._id": new mongoose.Types.ObjectId(postId), // Corrected: Instantiate ObjectId using 'new'
        },
      },
      {
        $unwind: "$Posts", // Unwind the Posts array to access individual posts
      },
      {
        $match: {
          "Posts._id": new mongoose.Types.ObjectId(postId), // Corrected: Instantiate ObjectId using 'new'
        },
      },
      {
        $lookup: {
          from: "users", // Reference the User collection to fetch sender details
          localField: "Posts.SenderId",
          foreignField: "_id",
          as: "SenderDetails",
        },
      },
      {
        $unwind: "$SenderDetails", // Unwind the SenderDetails array
      },
      {
        $project: {
          "Posts._id": 1,
          "Posts.PostText": 1,
          "Posts.PostLink": 1,
          "Posts.Images": 1,
          "Posts.Time": 1,
          "Posts.Like": 1,
          "Posts.Comments": 1,
          "Posts.LikedUsers": 1,
          "SenderDetails.firstName": 1,
          "SenderDetails.LastName": 1,
          "SenderDetails.Images.profile": 1,
          "SenderDetails.InstitudeName": 1,
        },
      },
    ]);

    if (!postDetails || postDetails.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(postDetails[0]); // Send the post details
  } catch (error) {
    console.error("Error retrieving post details:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the post details.",
    });
  }
});
module.exports = router;
