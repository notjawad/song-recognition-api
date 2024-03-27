const path = require("path");

function safeFilename(originalName) {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "");
  const extension = path.extname(safeOriginalName);
  return uniqueSuffix + extension;
}

module.exports = {
  safeFilename,
};
