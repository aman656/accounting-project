const db = require("../models");

exports.createJournalEntry = async (req, res) => {
  try {
    const data = await db
      .journal({
        debit: {
          amount: req.body.debit.amount,
          account: req.body.debit.account.toUpperCase(),
        },
        credit: {
          amount: req.body.credit.amount,
          account: req.body.credit.account.toUpperCase(),
        },
        statement: req.body.statement ? req.body.statement : null,
      })
      .save();
    const creditAccount = await db.tAccounts.findOne({
      account_name: req.body.credit.account.toUpperCase(),
    });
    if (creditAccount) {
      creditAccount.credit.push(req.body.credit.amount);
      await creditAccount.save();
    } else {
      await db
        .tAccounts({
          account_name: req.body.credit.account.toUpperCase(),
          credit: [req.body.credit.amount],
        })
        .save();
    }
    const debitAccount = await db.tAccounts.findOne({
      account_name: req.body.debit.account.toUpperCase(),
    });
    if (debitAccount) {
      debitAccount.debit.push(req.body.debit.amount);
      await debitAccount.save();
    } else {
      await db
        .tAccounts({
          account_name: req.body.debit.account.toUpperCase(),
          debit: [req.body.debit.amount],
        })
        .save();
    }
    res
      .status(200)
      .send({ success: true, message: "Entry saved Successfully." });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
};
