const router = require("express").Router();
const controllers = require("../controllers");

router.post("/journal", (req, res) => {
  controllers.Journal.createJournalEntry(req, res);
});
router.post("/trial", (req, res) => {
  controllers.Journal.trialBalance(req, res);
});
router.post("/incomeStatement", (req, res) => {
  controllers.Journal.incomeStatement(req, res);
});
router.post("/balanceSheet", (req, res) => {
  controllers.Journal.balanceSheet(req, res);
});
router.post("/equity", (req, res) => {
  controllers.Journal.ownerEquity(req, res);
});
module.exports = router;
