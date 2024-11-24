const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { mongoose } = require("mongoose");
const cron = require("node-cron");

router.post("/uploadPost", async (req, res) => {
  const { userId, Images, postText, postLink, Time } = req.body;
  console.log(userId, Images, postText, postLink, Time);

  try {
    // Validate input fields
    if (!postText && !Images?.length && !postLink) {
      return res.status(400).send("Post must contain text, images, or a link");
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    // Create a new post object with a timestamp
    const newPost = {
      PostText: postText,
      PostLink: postLink,
      Images: Images,
      Time: Time,
      Like: 0,
      SenderId: user._id,
      Comments: [],
      LikedUsers: [],
      CreatedAt: new Date() // Timestamp for when the post is created
    };

    // Push the new post to the user's Posts array
    user.Posts.push(newPost);
    await user.save();

    // Get the postId of the newly added post
    const postId = user.Posts[user.Posts.length - 1]._id;

    // Share the post with user's connections
    user.Connections.map(async (connection) => {
  // Fetch the connected user's data by their ID
      const connectionUser = await User.findById(connection.ConnectionsdId);
      if (connectionUser) {
        // Check if the user already has more than or equal to 15 connection posts
        if (connectionUser.ConnectionsPost.length >= 15) {
          // Remove the oldest postId (first element in the array)
          connectionUser.ConnectionsPost.shift();
        }
        // Add the new postId to the connection posts
        connectionUser.ConnectionsPost.push({ postId });
        // Save the updated connection user data
        await connectionUser.save();
      }
    });

    cron.schedule('* * * * *', async () => { 
      const now = new Date();
      const postTime = new Date(newPost.CreatedAt);
      const timeDifference = (now - postTime) / (1000 * 60 * 60); 
      // Check if 25 hours have passed since the post was created
      if (timeDifference >= 25) {
        try {
          // Remove the post from all connections
          await User.updateMany(
            { "ConnectionsPost.postId": postId },
            { $pull: { ConnectionsPost: { postId: postId } } }
          );

          // Optionally remove the post from the original user's post array
          await User.findByIdAndUpdate(userId, { 
            $pull: { Posts: { _id: postId } }
          });

          console.log(`Post ${postId} removed after 25 hours`);

        } catch (err) {
          console.error("Error removing post after 25 hours:", err);
        }
      }
    });
    res.status(200).send({ text: "Post uploaded successfully", postId });
  } catch (error) {
    console.error("Error uploading post:", error);
    res.status(500).send("An error occurred while uploading the post.");
  }
});


// Delete post
router.post("/deletePost/:id", async (req, res) => {
  const { postId } = req.body;
  const { id: userId } = req.params;
  console.log(postId);
  try {
    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(postId)
    ) {
      return res.status(400).send("Invalid userId or postId");
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Remove the post from the user's Posts array
    user.Posts = user.Posts.filter((post) => post._id.toString() !== postId);
    await user.save();

    // Remove the post from each connection's ConnectionsPost array
    await Promise.all(
      user.Connections.map(async (connectionId) => {
        const connection = await User.findById(connectionId.ConnectionsdId);
        if (connection) {
          connection.ConnectionsPost = connection.ConnectionsPost.filter(
            (connPost) => connPost.postId.toString() !== postId
          );
          await connection.save();
        }
      })
    );
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while deleting the post.");
  }
});

// Get connection posts
router.get("/getConnectionPosts/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send("Invalid userId");
    }

    // Find the user
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Get post IDs from ConnectionsPost
    const postIds = user.ConnectionsPost.map((post) => post.postId);
    if (postIds.length === 0) {
      return res.status(200).json([]); // No posts found
    }

    // Fetch posts with sender details
    const posts = await User.aggregate([
      { $unwind: "$Posts" },
      {
        $match: {
          "Posts._id": {
            $in: postIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "Posts.SenderId",
          foreignField: "_id",
          as: "SenderDetails",
        },
      },
      { $unwind: "$SenderDetails" },
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
          "SenderDetails._id":1
        },
      },
    ]);

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching connection posts.");
  }
});

// Like post
// Like post
router.post("/likePost/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId, LikedTime } = req.body;

  try {
    // Validate userId and postId
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }

    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });
  
    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the specific post within the user's posts
    const post = postOwner.Posts.id(postId);

    // Check if the user has already liked the post
    const alreadyLiked = post.LikedUsers.some(
      (likeEntry) => likeEntry.LikedUser.toString() === userId
    );

    if (alreadyLiked) {
      return res
        .status(400)
        .json({ message: "User has already liked this post" });
    }

    // Increment the Like count and add the user to the LikedUsers array
    post.Like += 1;
    post.LikedUsers.push({ LikedUser: userId, LikedTime: LikedTime });
    await postOwner.save();

    // Fetch the liked user's details
    const likedUser = await User.findById(userId).select(
      "firstName LastName Images.profile"
    );

    res.status(200).json({
      message: "Post liked successfully",
      likedUser: {
        firstName: likedUser.firstName,
        lastName: likedUser.LastName,
      },
      post,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res
      .status(500)
      .json({ message: "An error occurred while liking the post." });
  }
});

// Unlike post
router.post("/unlikePost/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;
  // console.log(userId);
  try {
    // Validate userId and postId
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }

    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });

    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the specific post within the user's posts
    const post = postOwner.Posts.id(postId);

    // Check if the user has already liked the post
    const alreadyLiked = post.LikedUsers.some(
      (likeEntry) => likeEntry.LikedUser.toString() === userId
    );

    if (!alreadyLiked) {
      return res
        .status(400)
        .json({ message: "User has not liked this post yet" });
    }

    // Decrement the Like count and remove the user from the LikedUsers array
    post.Like -= 1;
    post.LikedUsers = post.LikedUsers.filter(
      (likeEntry) => likeEntry.LikedUser.toString() !== userId
    );
    await postOwner.save();

    res.status(200).json({
      message: "Post unliked successfully",
      post,
    });
  } catch (error) {
    console.error("Error unliking post:", error);
    res
      .status(500)
      .json({ message: "An error occurred while unliking the post." });
  }
});
// --------
router.get("/getLikedUsers/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });

    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Extract the specific post from the user's Posts array
    const post = postOwner.Posts.id(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Extract the LikedUsers array (which contains user IDs and LikedTime)
    const likedUserIds = post.LikedUsers.map((user) => user.LikedUser);
    const likedUsersData = post.LikedUsers.map((user) => ({
      LikedUser: user.LikedUser,
      LikedTime: user.LikedTime,
    }));

    // Find the details of the users who liked the post (firstName, lastName, profilePicture)
    const likedUsers = await User.find(
      { _id: { $in: likedUserIds } },
      "firstName LastName Images.profile _id"
    );

    // Combine user details with the liked time
    const response = likedUsers.map((user) => {
      const userLikeData = likedUsersData.find(
        (likeData) => likeData.LikedUser.toString() === user._id.toString()
      );
      return {
        firstName: user?.firstName,
        LastName: user?.LastName,
        profile: user?.Images.profile,
        LikedTime: userLikeData?.LikedTime,
        userId: user?._id,
      };
    });

    return res.status(200).json({ likedUsers: response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});
// -------- comments
router.post("/commentPost/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId, commentText, commentTime } = req.body;
  // console.log(userId, commentText, commentTime, postId);
  try {
    // Validate userId and postId
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }

    if (!commentText) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });

    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the specific post within the user's posts
    const post = postOwner.Posts.id(postId);

    // Add the comment to the post's Comments array
    post.Comments.push({
      commentedBy: userId,
      commentText,
      commentedAt: commentTime,
    });

    await postOwner.save();

    // Fetch the commented user's details
    const commentedUser = await User.findById(userId).select(
      "firstName LastName Images.profile"
    );

    res.status(200).json({
      message: "Comment added successfully",
      comment: {
        commentText,
        commentedAt: Date.now(),
        commentedBy: {
          firstName: commentedUser.firstName,
          lastName: commentedUser.LastName,
          profile: commentedUser.Images.profile,
        },
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the comment." });
  }
});
// ---- get comments
router.get("/getComments/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });

    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the specific post within the user's posts
    const post = postOwner.Posts.id(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Fetch the user details for each comment
    const commentUserIds = post.Comments.map((comment) => comment.commentedBy);
    const commentedUsers = await User.find(
      { _id: { $in: commentUserIds } },
      "firstName LastName Images.profile _id"
    );

    const commentsWithUserDetails = post.Comments.map((comment) => {
      const commentedUser = commentedUsers.find(
        (user) => user._id.toString() === comment.commentedBy.toString()
      );
      return {
        commentText: comment.commentText,
        commentedAt: comment.commentedAt,
        commentedBy: {
          userId: commentedUser._id,
          firstName: commentedUser.firstName,
          LastName: commentedUser.LastName,
          profile: commentedUser.Images.profile,
        },
      };
    });

    res.status(200).json({ comments: commentsWithUserDetails });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching comments." });
  }
});
// get the particular post
router.get("/getPostDetails/:postId", async (req, res) => {
  const { postId } = req.params;
  // console.log(postId);
  try {
    // Aggregate query to find the post and the sender details
    const postDetails = await User.aggregate([
      {
        $match: {
          "Posts._id": new mongoose.Types.ObjectId(postId), // Match the post ID
        },
      },
      {
        $unwind: "$Posts", // Unwind the Posts array to access individual posts
      },
      {
        $match: {
          "Posts._id": new mongoose.Types.ObjectId(postId), // Match the specific post by ID again after unwind
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
    // console.log(postDetails[0]);
    res.send(postDetails[0]); // Send the post details
  } catch (error) {
    console.error("Error retrieving post details:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the post details.",
    });
  }
});

module.exports = router;
