const mongoose = require("mongoose");

const JournalSchema = new mongoose.Schema(
  {
    debit: {},
    credit: {},
    statement: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("journal", JournalSchema);
