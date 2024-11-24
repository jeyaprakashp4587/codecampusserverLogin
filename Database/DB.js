const mongoose = require("mongoose");
//
const DbConfig =
  "mongodb+srv://jeyaprakashp431:1DaSbsncTW8y1oR0@cluster0.mycbcc2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//
const DB2 = mongoose.createConnection(DbConfig);
module.exports = { DB2 };
