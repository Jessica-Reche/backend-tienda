const rolMethod = {};
const Rol = require("../models/rol.model");
const acc = require("../middlewares/accesControl");

//ERROR MESSAGES
function sendErrorMessage(res, message, codeError = 401) {
  return res.status(codeError).json({
    status: false,
    message: message,
  });
}
// SUCCESS MESSAGES
function sendSuccessMessage(res, message, data = {}) {
  return res.status(200).json({
    status: true,
    data,
    message: message,
  });
}

async function getRol(_id) {
  try {
    return Rol.findById(_id);
  } catch (error) {
    return false;
  }
}

rolMethod.getRols = async (req, res) => {
  const permission = acc.can(req.user.rol.name).readAny("rol").granted;
  if (!permission)
    return sendErrorMessage(res, "You don't have permission to read a rol");

  try {
    const rols = await Rol.find();
    if (rols) {
      return sendSuccessMessage(res, "Rols find", rols);
    }
  } catch (error) {
    return sendErrorMessage(res, "There are no rols");
  }
};

rolMethod.getRol = async (req, res) => {
  const permission = acc.can(req.user.rol.name).readAny("rol").granted;
  if (!permission) {
    return sendErrorMessage(res, "You don't have permission to read a rol");
  }
  try {
    const rolID = req.params.id;
    if (rolID) {
      const rol = await getRol(rolID);
      if (rol) {
        return sendSuccessMessage(res, "Rol found", rol);
      } else {
        return sendErrorMessage(res, "The id is required");
      }
    } else {
      return sendErrorMessage(res, "There are no rols", 404);
    }
  } catch (error) {
    return sendErrorMessage(res, "There are no rol");
  }
};

rolMethod.createRol = async (req, res) => {
  console.log(Object.values(rols));
  console.log(req.user);
  // Verify permission
  const permission = acc.can(req.user.rol.name).createAny("rol").granted;
  if (!permission) {
    return sendErrorMessage(res, "You don't have permission to create a rol");
  };

  // Verify data
  const { name } = req.body;
  if (!name) {
    return sendErrorMessage(res, "Please fill all fields");
  };

  const verify = Object.values(rols).some((rol) => rol === name);
  
  if (!verify) {
    return sendErrorMessage(res, "The name doesn't match with any rol");
  };

  try {
    // Create rol
    const rol = new Rol({ name });
    if (await rol.save()) {
      return sendSuccessMessage(res, "Rol created successfully");
    };
    return sendErrorMessage(res, "The are a problem, please try again", 400);
  } catch (error) {
    return sendErrorMessage(res, "The are a problem, please try again", 400);
  };
};

rolMethod.updateRol = async (req, res) => {
  const permission = acc.can(req.user.rol.name).updateAny("rol").granted;
  if (!permission)
    return sendErrorMessage(res, "You don't have permission to create a rol", 400);

  const { rolID, name } = req.body;
  if (!rolID || !name) return sendErrorMessage(res, "fill all required fields", 400);

  try {
    const rol = await getRol(rolID);
    if (!rol) return sendErrorMessage(res, "The rolID,wasn't found", 401);

    const verify = Object.values(rols).some((rol) => rol === name);
    if (!verify) return sendErrorMessage(res, "The name doesn't match with any rol");

    const updated = await rol.updateOne({ name });

    if (updated) return sendSuccessMessage(res, "Rol updated successfully");

    return sendErrorMessage(res, "The are a problem, please try again", 400);
  } catch (error) {
    console.log(error);
    return sendErrorMessage(res, "The are a problem, please try again", 400);
  }
};

rolMethod.deleteRol = async (req, res) => {
  const permission = acc.can(req.user.rol.name).deleteAny("rol").granted;

  if (!permission) {
    return sendErrorMessage(req, res, "You don't have permission to delete a rol");
  }

  const { rolID } = req.body;

  if (!rolID) {
    return sendErrorMessage(req, res, "The rolID is required");
  }

  try {
    const rol = await getRol(rolID);

    if (!rol) {
      return sendErrorMessage(req, res, "The rolID,wasn't found", 401);
    }

    if (await rol.deleteOne()) {
      return sendSuccessMessage(res, "Rol deleted successfully");
    } else {
      return sendErrorMessage(req, res, "The are a problem, please try again", 400);
    }
  } catch (error) {
    return sendErrorMessage(req, res, "The are a problem, please try again", 400);
  }
};

module.exports = rolMethod;
