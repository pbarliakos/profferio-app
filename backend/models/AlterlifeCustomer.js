const mongoose = require("mongoose");

const alterlifeCustomerSchema = new mongoose.Schema({
  customerId: { type: Number, required: true, unique: true },
  fullName: String,
  phone: String,
  email: String,
  birthdate: Date,
  contractDuration: Number,
  contractEndDate: Date,
  currentService: String,
  type: String,
  currentFee: Number,
  gym: String,
  offer1: String,
  offer2: String,
  offer3: String,
});

module.exports = mongoose.model("AlterlifeCustomer", alterlifeCustomerSchema);