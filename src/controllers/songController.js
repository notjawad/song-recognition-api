const multer = require("multer");
const fpcalc = require("fpcalc");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");

const { safeFilename } = require("../lib/utils");

dotenv.config();
const API_KEY = process.env.ACOUSTID_API_KEY;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, safeFilename(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/mp3") {
      cb(null, true);
    } else {
      cb(new Error("Only .mp3 files are allowed!"), false);
    }
  },
});

exports.recognizeSong = (req, res) => {
  upload.single("songFile")(req, res, function (err) {
    if (err) {
      // If upload error, respond and try to delete file if it exists
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.log("Error deleting file:", unlinkErr);
        });
      }
      return res
        .status(500)
        .json({ message: "Error uploading file.", error: err });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file." });
    }

    fpcalc(req.file.path, async function (err, result) {
      if (err) {
        // On fingerprint calculation error, respond and delete file
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.log("Error deleting file:", unlinkErr);
        });
        return res
          .status(500)
          .json({ message: "Error calculating fingerprint.", error: err });
      }

      try {
        const apiUrl = `https://api.acoustid.org/v2/lookup?client=${API_KEY}&meta=recordings+releasegroups+compress&duration=${
          result.duration
        }&fingerprint=${encodeURIComponent(result.fingerprint)}`;

        const response = await axios.get(apiUrl);

        // Before sending success response, delete file
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.log("Error deleting file:", unlinkErr);
          else {
            res.status(200).json({
              message: "Song information retrieved successfully.",
              data: response.data,
              fileName: req.file.originalname,
              duration: result.duration,
              fingerprint: result.fingerprint,
            });
          }
        });
      } catch (apiError) {
        // On API error, respond and delete file
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.log("Error deleting file:", unlinkErr);
          res.status(500).json({
            message: "Error querying AcoustID API.",
            error: apiError.message,
          });
        });
      }
    });
  });
};
