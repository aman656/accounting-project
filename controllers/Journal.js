const db = require("../models");

exports.createJournalEntry = async (req, res) => {
  try {
    const data = await db
      .journal({
        debit: {
          amount: Number(req.body.debit.amount),
          account: req.body.debit.account.toUpperCase(),
          account_type: req.body.debit.type
        },
        credit: {
          amount: Number(req.body.credit.amount),
          account: req.body.credit.account.toUpperCase(),
          account_type: req.body.credit.type
        },
        statement: req.body.statement ? req.body.statement : null,
      })
      .save();
    const creditAccount = await db.tAccounts.findOne({
      account_name: req.body.credit.account.toUpperCase(),
    });
    if (creditAccount) {
      creditAccount.credit.push(Number(req.body.credit.amount));
      await creditAccount.save();
    } else {
      await db
        .tAccounts({
          account_name: req.body.credit.account.toUpperCase(),
          credit: [Number(req.body.credit.amount)],
          account_type: req.body.credit.type,
        })
        .save();
    }
    const debitAccount = await db.tAccounts.findOne({
      account_name: req.body.debit.account.toUpperCase(),
    });
    if (debitAccount) {
      debitAccount.debit.push(Number(req.body.debit.amount));
      await debitAccount.save();
    } else {
      await db
        .tAccounts({
          account_name: req.body.debit.account.toUpperCase(),
          debit: [Number(req.body.debit.amount)],
          account_type: req.body.debit.type,
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

exports.trialBalance = async (req, res) => {
  try {
    var debit = 0;
    var credit = 0;
    const tAccounts = await db.tAccounts.aggregate([
      {
        $project: {
          account_name: 1,
          account_type: 1,
          credit: {
            // "$subtract":[{"$sum":"$credit"},{"$sum":"$debit"}]
            $sum: "$credit",
          },
          debit: {
            // "$subtract":[{"$sum":"$debit"},{"$sum":"$credit"}]
            $sum: "$debit",
          },
        },
      },
    ]);

    for (var i = 0; i < tAccounts.length; i++) {
      if (tAccounts[i].credit - tAccounts[i].debit > 0) {
        tAccounts[i].credit = tAccounts[i].credit - tAccounts[i].debit;
        tAccounts[i].debit = 0;
        credit += tAccounts[i].credit;
        debit += tAccounts[i].debit;
      } else {
        tAccounts[i].debit = tAccounts[i].debit - tAccounts[i].credit;
        tAccounts[i].credit = 0;
        credit += tAccounts[i].credit;
        debit += tAccounts[i].debit;
      }
    }
    // for(var i=0;i<tAccounts.length;i++){
    //   debit+=tAccounts[i].debit
    //   credit+=tAccounts[i].credit
    // }
    res
      .status(200)
      .send({ success: true, tAccounts, total: { debit, credit } });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
};

exports.incomeStatement = async (req, res) => {
  try {
    let exp_arr = [];
    let rev_arr = [];
    let total_rev = 0;
    let total_exp = 0;
    const allAccounts = await db.tAccounts.aggregate([
      {
        $project: {
          account_name: 1,
          account_type: 1,
          credit: {
            // "$subtract":[{"$sum":"$credit"},{"$sum":"$debit"}]
            $sum: "$credit",
          },
          debit: {
            // "$subtract":[{"$sum":"$debit"},{"$sum":"$credit"}]
            $sum: "$debit",
          },
        },
        //   "credit":{
        //     "$subtract":[{"$sum":"$credit"},{"$sum":"$debit"}]
        //   },
        //   "debit":{
        //     "$subtract":[{"$sum":"$debit"},{"$sum":"$credit"}]
        // }}
      },
    ]);

    for (var i = 0; i < allAccounts.length; i++) {
      if (allAccounts[i].account_name.includes("REVENUE")) {
        if (!allAccounts[i].account_name.includes("UNEARNED")) {
          rev_arr.push({
            name: allAccounts[i].account_name,
            amount: allAccounts[i].credit - allAccounts[i].debit,
          });
          total_rev += allAccounts[i].credit - allAccounts[i].debit;
        }
      }
      if (allAccounts[i].account_name.includes("EXPENSE")) {
        exp_arr.push({
          name: allAccounts[i].account_name,
          amount: allAccounts[i].debit - allAccounts[i].credit,
        });
        total_exp += allAccounts[i].debit - allAccounts[i].credit;
      }
    }
    res.status(200).send({
      success: true,
      exp_arr,
      rev_arr,
      "netincome/loss": total_rev - total_exp,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
};

exports.balanceSheet = async (req, res) => {
  try {
    let asset = 0;
    let liab = 0;
    let equi = 5600;
    var debit = 0;
    var credit = 0;
    const tAccounts = await db.tAccounts.aggregate([
      {
        $project: {
          account_name: 1,
          account_type: 1,
          credit: {
            // "$subtract":[{"$sum":"$credit"},{"$sum":"$debit"}]
            $sum: "$credit",
          },
          debit: {
            // "$subtract":[{"$sum":"$debit"},{"$sum":"$credit"}]
            $sum: "$debit",
          },
        },
      },
    ]);

    for (var i = 0; i < tAccounts.length; i++) {
      if (tAccounts[i].credit - tAccounts[i].debit > 0) {
        tAccounts[i].credit = tAccounts[i].credit - tAccounts[i].debit;
        tAccounts[i].debit = 0;
        credit += tAccounts[i].credit;
        debit += tAccounts[i].debit;
      } else {
        tAccounts[i].debit = tAccounts[i].debit - tAccounts[i].credit;
        tAccounts[i].credit = 0;
        credit += tAccounts[i].credit;
        debit += tAccounts[i].debit;
      }
    }

    for (var i = 0; i < tAccounts.length; i++) {
      if (tAccounts[i].account_type) {
        if (tAccounts[i].account_type == "asset") {
          if (tAccounts[i].debit == 0) {
            asset -= tAccounts[i].credit;
          } else {
            asset += tAccounts[i].debit;
          }
        } else if (tAccounts[i].account_type == "liability") {
          if (tAccounts[i].credit == 0) {
            liab -= tAccounts[i].debit;
          } else {
            liab += tAccounts[i].credit;
          }
        } else {
          if (tAccounts[i].credit == 0) {
            equi -= tAccounts[i].debit;
          } else {
            equi += tAccounts[i].credit;
          }
        }
      }
    }

    res.status(200).send({ success: true, asset, liab, equi });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
};

exports.ownerEquity = async (req, res) => {
  try {
    let exp_arr = [];
    let rev_arr = [];
    let total_rev = 0;
    let total_exp = 0;
    let equity = 0;
    let equity_account = [];
    const allAccounts = await db.tAccounts.aggregate([
      {
        $project: {
          account_name: 1,
          account_type: 1,
          credit: {
            $sum: "$credit",
          },
          debit: {
            $sum: "$debit",
          },
        },
      },
    ]);

    for (var i = 0; i < allAccounts.length; i++) {
      if (allAccounts[i].account_name.includes("REVENUE")) {
        if (!allAccounts[i].account_name.includes("UNEARNED")) {
          rev_arr.push({
            name: allAccounts[i].account_name,
            amount: allAccounts[i].credit - allAccounts[i].debit,
          });
          total_rev += allAccounts[i].credit - allAccounts[i].debit;
        }
      }
      if (allAccounts[i].account_name.includes("EXPENSE")) {
        exp_arr.push({
          name: allAccounts[i].account_name,
          amount: allAccounts[i].debit - allAccounts[i].credit,
        });
        total_exp += allAccounts[i].debit - allAccounts[i].credit;
      }
      if (allAccounts[i].account_type == "owner equity") {
        equity_account.push(allAccounts[i]);
        equity += allAccounts[i].credit;
      }
    }
    equity_account.push({
      account_name: "Net Profit/Loss",
      credit: total_rev - total_exp,
    });
    console.log("263", total_exp);
    console.log("264", total_rev);
    console.log("265", equity);

    res.status(200).send({
      success: true,
      owner_equity: equity + (total_rev - total_exp),
      equity_account,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
};
