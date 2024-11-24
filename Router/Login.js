const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const nodemailer = require("nodemailer");

router.post("/splash", async (req, res) => {
  const { Email } = req.body;
  const user = await User.findOne({ Email: Email });
  if (user) {
    res.send(user);
  }
});

// SignIn route
router.post("/signIn", async (req, res) => {
  const { Email, Password } = req.body;
  // Convert the email to lowercase
  const lowerCaseEmail = Email.toLowerCase().trim();

  // Find the email user id
  const findEmailUser = await User.findOne({ Email: lowerCaseEmail });
  if (findEmailUser) {
    if (findEmailUser.Password === Password) {
      res.send(findEmailUser);
    } else {
      res.send("Password is Incorrect");
    }
  } else {
    res.send("Email or Password is Incorrect");
  }
});

// SignUp route
router.post("/signUp", async (req, res) => {
  const {
    First_Name,
    Last_Name,
    Email,
    Password,
    Gender,
    Date_Of_Birth,
    Degree_name,
    Institute_Name,
    State,
    District,
    Nationality,
  } = req.body;

  // Convert the email to lowercase
  const lowerCaseEmail = Email.toLowerCase().trim();
  const lowerGender = Gender.toLowerCase().trim();

  // Check if the email already exists
  const existMail = await User.findOne({ Email: Email });
  if (existMail) {
    res.send("Email has Already Been Taken");
  } else {
    const user = await User({
      firstName: First_Name,
      LastName: Last_Name,
      Email: lowerCaseEmail, // Save email in lowercase
      Password: Password,
      Gender: lowerGender,
      DateOfBirth: Date_Of_Birth,
      Degreename: Degree_name,
      InstitudeName: Institute_Name,
      State: State,
      District: District,
      Nationality: Nationality,
    });
    // Save the user details in signup
    await user.save();
    // create node mailer for welcome message
    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jeyaprakashp431@gmail.com',
      pass: 'qiri pwwh hcyn nrek ', // Use App Password here if using Gmail
    },
  });

  // Compose email
 const mailOptions = {
  from: 'jeyaprakashp431@gmail.com',
  to: lowerCaseEmail,
  subject: 'Welcome to CodeCampus!',
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h1 style="color: #4CAF50;">Welcome to CodeCampus, ${First_Name}!</h1>
      <p>Thank you for signing up for <strong>CodeCampus</strong>, the ultimate learning hub for coding enthusiasts like you.</p>
      <h2>About CodeCampus</h2>
      <p>At CodeCampus, we aim to make learning programming languages and software development both fun and accessible. Whether you're a beginner or an expert, you'll find something here for you!</p>
      <h3>Here’s what you can explore:</h3>
      <ul>
        <li><strong>Learn to Code:</strong> Comprehensive tutorials for front-end, back-end, and app development.</li>
        <li><strong>Take Challenges:</strong> Test your skills with coding challenges across various levels.</li>
        <li><strong>Socialize:</strong> Share your achievements, connect with friends, and get inspired by others.</li>
        <li><strong>Job Placements:</strong> Stay updated with job opportunities and placement tips (coming soon).</li>
      </ul>
      <h3>Get Started</h3>
      <p>Log in now and dive into the world of coding. Let’s embark on this exciting journey together!</p>
      <p>If you have any questions, feel free to contact us anytime. We're here to help.</p>
      <p style="margin-top: 20px;">Happy Coding!<br><strong>The CodeCampus Team</strong></p>
    </div>
    `,
   };
    await transporter.sendMail(mailOptions);
    // 
    res.json({ message:"SignUp Sucessfully",user:user});
  }
});

// get the user details for update when component refresh
router.post("/getUser", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  // console.log(userId);
  if (user) {
    // console.log("send");
    res.send(user);
  }
  // console.log("userId", userId);
});

module.exports = router;
