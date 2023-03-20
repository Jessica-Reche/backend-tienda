const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

//Schema for the user model
const UserSchema = new Schema({
  rol: {
    type: Object,
    default: { rolID: "63ed70c9bc14ae28b2162da1", name: "client" },
  }
  ,
  username: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: "client",

  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});
//Methods
//This method is used to compare the password entered by the user with the password stored in the database
UserSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.password);
};
//This method is used to encrypt the password entered by the user
UserSchema.methods.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

module.exports = model("User", UserSchema);
