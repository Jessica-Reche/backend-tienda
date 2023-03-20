const userMethods = {};
require("dotenv").config();
const User = require("../models/user.model");
const Rol = require("../models/rol.model");
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
//Register
userMethods.register = async (req, res) => {
  const { rolID, username, email, password, name } = req.body;

  // Verificar que se hayan proporcionado los campos requeridos
  if (!username || !email || !password) {
    return res.status(400).json({
      status: false,
      message: "Please fill in all required fields",
    });
  }

  try {
    // Obtener el rol si se proporcionó un ID de rol válido
    let rol = null;
    if (rolID) {
      rol = await getRol(rolID);
      if (!rol) {
        return res.status(400).json({
          status: false,
          message: "Invalid rol ID",
        });
      }
    }

    // Verificar que el nombre de usuario y el correo electrónico no estén en uso
    const existingUsername = await getUser({ username });
    if (existingUsername) {
      return res.status(400).json({
        status: false,
        message: "The username is already taken",
      });
    }
    const existingEmail = await getUser({ email });
    if (existingEmail) {
      return res.status(400).json({
        status: false,
        message: "The email is already taken",
      });
    }

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
    if (rol) {
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
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (user) {
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
    return sendErrorResponse(res, missingFieldsMsgs, 400);
  }

  try {
    await user.save();
    return sendSuccessMessage(res, "User was updated successfully", user);
  } catch (error) {
    console.log(error);
    return sendErrorResponse(
      res,
      "There was a problem updating the user",
      400
    );
  }
};





module.exports = userMethods;
