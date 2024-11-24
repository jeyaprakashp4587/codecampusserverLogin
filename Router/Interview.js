const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");
// get company details
router.get("/getCompanyDetails", async (req, res) => {
    const companies = DB1.collection("Company");

    if (companies) {
        // Find all companies but only return company name and logo
        const compDetail = await companies.find({}, { projection: { company_name: 1, companyLogo: 1 } }).toArray();
        
        if (compDetail.length > 0) {
            // Send the result as a response
            res.json(compDetail);
        } else {
            // If no companies found, return an appropriate message
            res.status(404).json({ message: "No companies found" });
        }
    } else {
        res.status(500).json({ message: "Error fetching companies" });
    }
});
// get particular
router.post("/getParticularCompany", async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({ error: "Company name is required" });
        }
        const collection = DB1.collection("Company");
        // Use await to get the result and limit the fields to name and logo
        const company = await collection.findOne(
            { company_name: companyName },
        );
        if (company) {
            res.status(200).json(company);
        } else {
            res.status(404).json({ error: "Company not found" });
        }
    } catch (error) {
        // Handle any unexpected errors
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});
// add interview company 
router.post("/addInterView", async (req, res) => {
    const { companyName, userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const existingInterview = user.InterView.find(
            (interview) => interview.companyName === companyName
        );
        if (existingInterview) {
            return res.status(400).json({ message: "Exists" });
        }
        user.InterView.push({ companyName, currentWeek: 1 });
        await user.save();
        res.status(200).json({
            message: "Interview entry added successfully",
            User: user
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
// submit task and add week
router.post('/submitTask', async (req, res) => {
  const { userId, companyName } = req.body;
  try {
    const user = await User.findById(userId);
    const findCompany = user.InterView.find((comp) => comp.companyName === companyName);
    if (findCompany) {
      console.log(findCompany);
      findCompany.currentWeek += 1;
      await user.save();
        res.json({week:findCompany.currentWeek, user: user }); // Use res.json instead of res.send
    } else {
      res.sendStatus(404); // Send 404 if the company is not found
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating week count', error });
  }
});



module.exports = router;