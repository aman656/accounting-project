const mongoose = require("mongoose");

const TaccountsSchema = new mongoose.Schema(
  {
    account_name: {
      type: String,
      required: true,
    },
    credit: {
      type: Array,
    },
    debit: {
      type: Array,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("taccounts", TaccountsSchema);
