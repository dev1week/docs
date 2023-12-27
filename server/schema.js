const { Schema, model } = require("mongoose");

const googleDocsShema = new Schema({
  _id: String,
  data: Object,
});

module.exports = model("GoogleDocs", googleDocsSchema);
