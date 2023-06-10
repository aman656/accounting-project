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


exports.trialBalance = async(req,res)=>{
  try{
    const tAccounts = await db.tAccounts.aggregate([
      {
        "$project":{
          account_name:1,
          "credit":{
            "$subtract":[{"$sum":"$credit"},{"$sum":"$debit"}]
          },
          "debit":{
            "$subtract":[{"$sum":"$debit"},{"$sum":"$credit"}]
        }}
      }
    ])

    res.status(200).send({ success: true ,data:tAccounts});
  }catch(err){
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
}


exports.incomeStatement =async(req,res)=>{
  try{
    let exp_arr=[]
    let rev_arr =[]
    const allAccounts = await db.tAccounts.aggregate([
      {
        "$project":{
          account_name:1,
          "credit":{
            "$subtract":[{"$sum":"$credit"},{"$sum":"$debit"}]
          },
          "debit":{
            "$subtract":[{"$sum":"$debit"},{"$sum":"$credit"}]
        }}
      }
    ])

    for(var i=0;i<tAccounts.length;i++){
      if(tAccounts[i].account_name.includes("REVENUE")){
        rev_arr.push({name:tAccounts[i].account_name,amount:tAccounts[i].credit>0 ? tAccounts[i].credit:tAccounts[i].debit})
      }if(tAccounts[i].account_name.includes("EXPENSE")){
        exp_arr.push({name:tAccounts[i].account_name,amount:tAccounts[i].credit>0 ? tAccounts[i].credit:tAccounts[i].debit})
      }
    }
    res.status(200).send({ success: true,exp_arr,rev_arr});
  }catch(err){
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
}