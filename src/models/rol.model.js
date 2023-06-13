const { Schema, model } = require("mongoose");
const rols = require("../config/config");

const rolSchema = new Schema({
  name: {
    type: String,
    enum: rols,
    required: true,
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = model("Rol", rolSchema); 
