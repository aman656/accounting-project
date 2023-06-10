const router = require("express").Router();
const controllers = require("../controllers");

router.post("/journal", (req, res) => {
  controllers.Journal.createJournalEntry(req, res);
});

module.exports = router;
