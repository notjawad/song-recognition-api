const express = require("express");
const router = express.Router();
const { recognizeSong } = require("../controllers/songController");

router.post("/recognize", recognizeSong);

module.exports = router;
