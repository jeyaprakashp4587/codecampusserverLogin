const mongoose = require("mongoose");
//
const DbConfig =
  "mongodb+srv://jeyaprakashp431:KOuDbfkcGShd3way@codecampusdata.btln4ke.mongodb.net/CodeCampusDB?retryWrites=true&w=majority&appName=CodeCampusData";
//
const DB1 = mongoose.createConnection(DbConfig);
module.exports = { DB1 };
