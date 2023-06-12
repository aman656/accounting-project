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
          account_type:req.body.credit.type
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
          account_type:req.body.debit.type
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
    var debit = 0
    var credit = 0
    const tAccounts = await db.tAccounts.aggregate([
      {
        "$project":{
          account_name:1,
          account_type:1,
          "credit":{
            // "$subtract":[{"$sum":"$credit"},{"$sum":"$debit"}]
            "$sum":"$credit"
          },
          "debit":{
            // "$subtract":[{"$sum":"$debit"},{"$sum":"$credit"}]
            "$sum":"$debit"
        }}
      },
    ])

    for(var i=0;i<tAccounts.length;i++){
      if(tAccounts[i].credit - tAccounts[i].debit >0){
        tAccounts[i].credit = tAccounts[i].credit - tAccounts[i].debit
        tAccounts[i].debit = 0
        credit+=tAccounts[i].credit 
        debit+= tAccounts[i].debit
      }else{
        tAccounts[i].debit = tAccounts[i].debit - tAccounts[i].credit
        tAccounts[i].credit = 0
        credit+=tAccounts[i].credit 
        debit+= tAccounts[i].debit

      }
    }
// for(var i=0;i<tAccounts.length;i++){
//   debit+=tAccounts[i].debit
//   credit+=tAccounts[i].credit
// }
    res.status(200).send({ success: true ,tAccounts,total:{debit,credit}});
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
          account_type:1,
          "credit":{
            "$subtract":[{"$sum":"$credit"},{"$sum":"$debit"}]
          },
          "debit":{
            "$subtract":[{"$sum":"$debit"},{"$sum":"$credit"}]
        }}
      }
    ])

    for(var i=0;i<allAccounts.length;i++){
      if(allAccounts[i].account_name.includes("REVENUE")){
        if(!allAccounts[i].account_name.includes("UNEARNED")){
        rev_arr.push({name:allAccounts[i].account_name,amount:allAccounts[i].credit>0 ? allAccounts[i].credit:allAccounts[i].debit})
      }
      }if(allAccounts[i].account_name.includes("EXPENSE")){
        exp_arr.push({name:allAccounts[i].account_name,amount:allAccounts[i].credit>0 ? allAccounts[i].credit:allAccounts[i].debit})
      }
    }
    res.status(200).send({ success: true,exp_arr,rev_arr});
  }catch(err){
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
}


exports.balanceSheet = async(req,res)=>{
  try{
    let asset = [];
    let liab = [];
    let equi = []
    let netincome = 0
    let netloss = 0
    const allAccounts = await db.tAccounts.aggregate([
      {"$match":{account_type:{"$exists":true}}},
      {
        
        "$project":{
          account_name:1,
          account_type:1,
          "credit":{
            "$sum":"$credit"
          },
          "debit":{
            "$sum":"$debit"
        }}
      }
    ])

for(var i=0;i<allAccounts.length;i++){
  if(allAccounts[i].account_type=="asset"){
    asset.push(allAccounts[i])
  }else if(allAccounts[i].account_type=="liability"){
    liab.push(allAccounts[i])
  }else{
    equi.push(allAccounts[i])
  }
}
// if(netincome-netloss>0){
//   equi.push({
//     account_name:"netincome/loss",
//     amount:netincome-netloss
//   })
// }else{
//   liab.push({
//     account_name:"netincome/loss",
//     amount:netincome-netloss
//   })
// }

    res.status(200).send({ success: true,asset,liab,equi,allAccounts});
  }catch(err){
    console.log(err);
    res.status(500).send({ success: false, message: "An error occured." });
  }
}
