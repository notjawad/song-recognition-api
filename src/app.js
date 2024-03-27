const express = require("express");
const bodyParser = require("body-parser");
const songRoutes = require("./routes/index");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", songRoutes);

app.listen(port, () => {
  console.log(`Song Recognizer API listening at http://localhost:${port}`);
});

module.exports = app;
