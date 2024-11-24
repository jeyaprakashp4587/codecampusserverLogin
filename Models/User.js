const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DB2 } = require("../Database/DB");

const UserSchema = new Schema({
  firstName: String,
  LastName: String,
  Email: String,
  Password: String,
  Gender: String,
  DateOfBirth: String,
  Degreename: String,
  InstitudeName: String,
  State: String,
  District: String,
  Nationality: String,
  Bio: String,
  SocketId: String,
  Images: {
    profile: String,
    coverImg: String,
  },
  Posts: [
    {
      PostText: String,
      PostLink: String,
      Images: Array,
      Time: String,
      Like: Number,
      SenderId: mongoose.Types.ObjectId,
      Comments: [
        {
          commentedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          commentText: { type: String, required: true },
          commentedAt: String,
        },
      ],
      LikedUsers: [
        {
          LikedUser: mongoose.Types.ObjectId,
          LikedTime: String,
        },
      ],
    },
  ],
  Connections: [{ ConnectionsdId: String }],
  Courses: [{
    Course_Name: String, Technologies: [
      { TechName: String, Points: { default: 0 ,type: Number} }
  ] }],
  Reawards: [],
  Challenges: [
    {
      ChallengeName: String,
      ChallengeImage: String,
      ChallengeLevel: String,
      status: String,
      RepoLink: String,
      LiveLink: String,
      SnapImage: Array,
      ChallengeType: String,
    },
  ],
  Activities: [{ date: String, activities: [{ activityName: String }] }],
  ConnectionsPost: [{ postId: String }],
  Notifications: [
    {
      NotificationType: String,
      NotificationText: String,
      Time: String,
      NotificationSender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the User model
      senderFirstName: String, // Store the first name when notification is created
      senderLastName: String, // Store the last name when notification is created
      senderProfileImage: String, // Store the profile image when notification is created
      seen: Boolean,
      postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    },
  ],
  Assignments: [
    {
      AssignmentType: String,
      AssignmentLevel: [{ LevelType: String, point: Number }],
    },
  ],
  Wallet: {
    TotalWallet: {
      type: Number,
      default: 0,
    },
    GpayAccount: {
      GpayAccountName: String,
      GpayUpiId: String
    },
    WithdrawHistory: [
      {
        Time: String,
        WithdrawAmount: Number,
        status: String
      }
    ]
  },
  InterView: [
    {
      companyName: String,
      currentWeek:{default:1,type: Number}
    }
  ]
});

module.exports = DB2.model("user", UserSchema);
