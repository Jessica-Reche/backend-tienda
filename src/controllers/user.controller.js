const userMethods = {};
require("dotenv").config();
const User = require("../models/user.model");
const Rol = require("../models/rol.model");
const acc = require("../middlewares/accesControl");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");



async function getUser(param) {
  try {
    return User.findOne(param);
  } catch (error) {
    return false;
  }
};
async function getRol(_id) {
  try {
    return Rol.findById(_id);
  } catch (error) {
    return false;
  }
};


//get users
userMethods.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (users) {
      return res.status(200).json({
        status: true,
        message: "Users found",
        users,
      });
    }
  } catch (error) {
    return res.status(404).json({
      status: false,
      message: "There are no users",
    });
  }
};

//Login
userMethods.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await getUser({ email });
  if (!user) {
    return res.status(401).json({ status: false, message: "Email or pasword is incorrect" });
  }
  const verifyPassword = await user.verifyPassword(password);
  if (!verifyPassword) {
    return res.status(404).json({ status: false, message: "Email or pasword is incorrect" });
  }
  try {
    const token = jwt.sign(user._id.toString(), process.env.PRIVATE_KEY);
    return res.status(200).json({
      status: true,
      message: "Login successfull",
      token,
      user
    });
  } catch (error) {
    return res.status(404).json({
      status: false,
      message: "There was a problem, please try again",
    });
  }


};
const validateRegistration = async ({ rolID, username, email, password, name }) => {
  const errors = [];

  if (!username) errors.push("Username is required");
  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");

  if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,20}$/.test(password)) {
    errors.push("Invalid password. Example: Example123!");
  }

  if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    errors.push("Invalid email. Example: example@gmail.com");
  }

  if (name && !/^[a-zA-Z ]{2,30}$/.test(name)) {
    errors.push("Invalid name. Example: John Doe");
  }

  if (rolID) {
    const rol = await getRol(rolID);
    if (!rol) {
      errors.push("Invalid rol ID");
    }
  }

  if (username) {
    const existingUsername = await getUser({ username });
    if (existingUsername) {
      errors.push("Username is already taken");
    }
  }

  if (email) {
    const existingEmail = await getUser({ email });
    if (existingEmail) {
      errors.push("Email is already taken");
    }
  }

  return errors;
};

userMethods.register = async (req, res) => {
  const { rolID, username, email, password, name } = req.body;

  const errors = await validateRegistration({ rolID, username, email, password, name });
  if (errors.length) {
    const errorMessage = errors.join(", ");
    return res.status(400).json({
      status: false,
      message: errorMessage,
    });
  }
  
  try {
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el objeto de usuario
    const newUser = {
      username,
      email,
      password: hashedPassword,
    };

    // Agregar el nombre si se proporcionó
    if (name) {
      newUser.name = name;
    }

    // Agregar el rol si se proporcionó un ID de rol válido
    if (rolID) {
      const rol = await getRol(rolID);
      newUser.rol = {
        rolID: rol._id,
        name: rol.name,
      };
    }

    // Guardar el usuario en la base de datos
    const savedUser = await User.create(newUser);
    if (savedUser) {
      return res.status(200).json({
        status: true,
        message: "User created successfully",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "There was a problem, please try again",
      });
    }
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "There was an error, please try again",
    });
  }
};

//authenticate
userMethods.authenticate = (req, res) => {
  try {
    const token = req.headers["authorization"];
    console.log(token);

    if (token) {
      const verify = jwt.verify(token, process.env.PRIVATE_KEY);

      if (verify) {
        return res.status(200).json({
          status: true,
          message: "The token is valid.",
        });
      } else {
        return res.status(400).json({
          status: false,
          message: "The token is incorrect.",
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "The token is required.",
      });
    }
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "The token is invalid.",
    });
  }
};
//Delete user
userMethods.deleteUser = async (req, res) => {
  try {
    const permission = acc.can(req.user.rol.name).deleteAny("user").granted;
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!permission) {
      return res.status(400).json({
        status: false,
        message: "You don't have permission to delete users",
      });
    }

    if (user && permission) {
      const userDeleted = user.delete();
      if (userDeleted) {
        return res.status(200).json({
          status: true,
          message: "User deleted successfully",
        });
      }

    } else {
      return res.status(400).json({
        status: false,
        message: "There was a problem, please try again",
      });
    }
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "There was an error, please try again",
    });
  }

};

//Update user
userMethods.updateUser = async (req, res) => {
  const { name, username, email, password, rolID } = req.body;
  const { id } = req.params;

  const user = await getUser({ _id: id });
  const permission = acc.can(req.user.rol.name).updateAny("user").granted;
  const missingFieldsMsgs = [];

  if (!permission)
    missingFieldsMsgs.push("You don't have permission to do this");
  if (!id) missingFieldsMsgs.push("The id is required");
  if (!user) missingFieldsMsgs.push("No user found");
  if (username) {
    const verifyUsername = await getUser({ username });
    if (verifyUsername && verifyUsername._id.toString() !== id) {
      missingFieldsMsgs.push("The username is already taken");
    } else {
      user.username = username;
    }
  }
  if (email) {
    const verifyEmail = await getUser({ email });
    if (verifyEmail && verifyEmail._id.toString() !== id) {
      missingFieldsMsgs.push("The email is already taken");
    } else {
      user.email = email;
    }
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    user.password = hashPassword;
  }
  if (name) {
    user.name = name;
  }
  if (rolID) {
    console.log("este es el rolID: " + rolID);
    const rol = await getRol(rolID);
    if (rol) {
      user.rol = {
        rolID: rol._id,
        name: rol.name,
      };
    } else {
      missingFieldsMsgs.push("Invalid role");
    }
  }

  if (missingFieldsMsgs.length) {
    return res.status(400).json({
      status: false,
      message: missingFieldsMsgs,
    });

  }

  try {
    await user.save();
    return res.status(200).json({
      status: true,
      message: "User updated successfully",
      user,
    });


  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: false,
      message: "There was an error, please try again",
    });



  }
};





module.exports = userMethods;
