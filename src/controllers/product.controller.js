const productMethod = {};
const Product = require("../models/product.model");
const acc = require("../middlewares/accesControl");
const fs = require("fs");

//error messages
function sendErrorResponse(
  req = {},
  res,
  message,
  code = 401,
  filesToDelete = [],

) {
  if (req.files) {
    let poster =
      filesToDelete.includes("poster") && req.files.poster ? true : false;
    let gallery =
      filesToDelete.includes("gallery") && req.files.gallery ? true : false;

    if (poster) {
      if (filesToDelete.includes("poster"))
        fs.unlinkSync(req.files.poster[0].path);
    }
    if (gallery) {
      if (filesToDelete.includes("gallery")) deleteGallery(req.files.gallery);
    }

  }
  //Return error message
  return res.status(code).json({
    status: false,
    message,

  });
}

// sucess messages
function sendSuccessMessage(res, message, data = {}) {
  return res.status(200).json({
    status: true,
    data,
    message: message,
  });
}
//functions helpers
/**
 *  Gets the product from the database
 * @param {*} _field  - Field to search in the database
 * @returns  {Object} returns the product if it is found, false if not
 */
function getProduct(_field) {
  try {
    return Product.findOne(_field);
  } catch (error) {
    return false;
  }
}

/**
 * Converts the gallery array to an array of objects with the filename and the link to the image
 *
 * @param {Array} gallery - Array of objects with the filename and link to the image
 * @returns  {Array} returns an array of objects with the filename and the link to the image
 */
function convertGallery(gallery) {
  if (gallery.length) {
    const galleryArray = [];
    gallery.forEach((image) => {
      galleryArray.push({
        filename: image.filename,
        link: `/img/products/${image.filename}`,
      });
    });
    return galleryArray;
  }
  return [];
}
/**
 * Deletes the gallery of the database  and the files of the product from the server
 *
 * @param {*} gallery
 */
function deleteGallery(gallery) {
  if (gallery && gallery.length) {
    gallery.forEach((image) => fs.unlinkSync(image.path));
  }

}
/**
 * Deletes the gallery of the database and the files of the product
 *
 * @param {Array} gallery  - Array of objects with the filename and link to the image
 * @returns  {Boolean} returns true if the gallery is deleted, false if not
 */
function deleteUploadedGallery(gallery) {
  try {
    if (gallery.length > 0) {
      for (const path of gallery) {
        fs.unlinkSync(__dirname + `/../../public/${path.link}`);
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Deletes the poster and the gallery of the database and the files of the product
 *
 * @param {*} product  - Product object
 * @param {*} res  - Response object for the request
 * @returns
 */
const deleteUploadedPoster = async (product, res) => {
  try {
    if (product) {
      //DELETE POSTER FILE
      fs.unlink(
        __dirname + `/../../public/${product.poster.link}`,
        async (error) => {
          if (error) console.log(error);
          //DELETE GALLERY FILES
          if (product.gallery.length) {
            try {
              await deleteUploadedGallery(product.gallery);
            } catch (error) {
              console.log(error);
              return false;
            }
          }

          return true;
        }
      );
    }
  } catch (error) {
    console.log(error);
    return sendErrorResponse(
      req,
      res,
      "There was a problem deleting the product"
    );
  }
};
/**
 *  This function updates the poster of the product if it is sent in the request
 * @param {*} files  - Files object
 * @param {*} product  - Product object
 * @returns
 */
const updateFilePoster = async (files, product) => {
  try {
    if (!files) sendErrorResponse(req, res, "No files were uploaded", 400);
    if (!product) sendErrorResponse(req, res, "Product not found", 404);

    if (!Array.isArray(files)) {
      files = [files];
    }

    const filePath = `/../../public${product.poster.link}`;
    const filename = files[0].filename;

    if (fs.existsSync(__dirname + filePath)) {
      await fs.unlink(__dirname + filePath, async (err) => {
        if (err) {
          throw new Error("Failed to delete existing file");
        }
        // Update product poster information in the database

        await product.updateOne(
          {
            poster: {
              filename: filename,
              link: `/img/products/${filename}`,
            },
          },
          { new: true }
        );
      });
      return true;
    } else {
      await product.updateOne(
        {
          poster: {
            filename: filename,
            link: `/img/products/${filename}`,
          },
        },
        { new: true }
      );
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

//FUNCTIONS CRUD
/**
 *  Gets all the products in the database and returns the products

 * @param {*} res  - Response object for the request
 * @returns  {Object} returns an object with the status, message and the product created
 */

productMethod.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    if (products) {
      return sendSuccessMessage(res, "Products find", products);
    }
  } catch (error) {
    return sendErrorResponse(req, res, "Products not found", 400);
  }
};

/**
 * Gets a product in the database and returns the product
 *
 * @returns  {Object} returns an object with the status, message and the product created
 */
productMethod.getProduct = async (req, res) => {
  try {
    const productID = req.params.id;
    const product = await getProduct({ _id: productID });
    if (!productID)
      return sendErrorResponse(req, res, "Product not found", 400);
    if (!product) return sendErrorResponse(req, res, "Product not found", 400);
    return sendSuccessMessage(res, "Product found", product);
  } catch (error) {
    return sendErrorResponse(req, res, "Product not found", 400);
  }
};
/**
 *  Creates a new product in the database and returns the product created
 * @param {*} req  - Request object for the request
 * @param {*} res  - Response object for the request
 * @returns
 */
productMethod.createProduct = async (req, res) => {

  if (req.body) {

    const permission = acc.can(req.user.rol.name).createAny("product").granted;
    const { name, description, price, discount, stock, sku, category } = req.body;
    const verifySKU = await getProduct({ sku });
    const gallery = req.files && req.files["gallery[]"] ? convertGallery(req.files["gallery[]"]) : [];
    const missingFieldsMsgs = [];
    const rating = req.body.rating ? req.body.rating : 0;


    console.log(req.files);

    if (!permission)
      missingFieldsMsgs.push("You don't have permission to do this");
    if (verifySKU) missingFieldsMsgs.push("The SKU is already in use");
    if (!name) missingFieldsMsgs.push("Name is required");
    if (!description) missingFieldsMsgs.push("Description is required");
    if (!price) missingFieldsMsgs.push("Price is required");

    if (!stock) missingFieldsMsgs.push("Stock is required");
    if (!sku) missingFieldsMsgs.push("SKU is required");
    if (!category) missingFieldsMsgs.push("Category is required");
    if (!req.files || !req.files.poster) {
      return missingFieldsMsgs.push("Poster is required");
    }
    if (missingFieldsMsgs.length) {
      return sendErrorResponse(req, res, missingFieldsMsgs, 400, [
        "poster",
        "gallery",
      ]);
    }
    //verificar que el file sea correcto


    try {

      const product = new Product({
        name,
        description,
        poster: {
          filename: req.files.poster[0].filename,
          link: `/img/products/${req.files.poster[0].filename}`,
        },
        gallery,
        price,
        discount,
        stock,
        sku,
        rating,
        category,
      });
      await product.save();
      return sendSuccessMessage(res, "Product created successfully");
    } catch (error) {
      console.log(error);
      return sendErrorResponse(
        req,
        res,
        "There was a problem creating the product",
        500,
        ["poster", "gallery"]
      );
    }


  } else {
    return sendErrorResponse(
      req,
      res,
      "There was a problem creating the product, missing fields",
      400,
      ["poster", "gallery"]
    );
  }





};

/**
 *  Deletes a product in the database
 * @param {*} req  - Request object for the request
 * @param {*} res  - Response object for the request
 * @returns
 */
productMethod.deleteProduct = async (req, res) => {
  const permission = acc.can(req.user.rol.name).updateAny("product").granted;
  const { id } = req.params;
  const product = await getProduct({ _id: id });
  if (!permission) {
    return sendErrorResponse(
      req,
      res,
      "You don't have permission to do this",
      401
    );
  }

  if (!id) {
    return sendErrorResponse(req, res, "The productID is required");
  }
  if (!product) return sendErrorResponse(req, res, "No product found", 400);

  //delete product
  try {
    product.deleteOne();
    deleteUploadedPoster(product, res);
    return sendSuccessMessage(res, "Product was deleted successfully");
  } catch (error) {
    console.log(error);
    return sendErrorResponse(
      req,
      res,
      "There was a problem deleting the product",
      400
    );
  }
};
productMethod.deleteProductGaleryPhoto = async (req, res) => {
  const permission = acc.can(req.user.rol.name).updateAny("product").granted;
  const { productID, photo } = req.body;
  const product = await getProduct({ _id: productID });
  const missingFieldsMsgs = [];
  const pathPhoto = __dirname + `/../../public/img/products/${photo}`;

  if (!permission)
    missingFieldsMsgs.push("You don't have permission to do this");
  if (!productID) missingFieldsMsgs.push("The productID is required");
  if (!photo) missingFieldsMsgs.push("The photo is required");
  if (!product) missingFieldsMsgs.push("No product found");

  if (missingFieldsMsgs.length) {
    return sendErrorResponse(req, res, missingFieldsMsgs, 400);
  }

  try {
    if (product && fs.existsSync(pathPhoto)) {
      fs.unlink(pathPhoto, async (err) => {
        if (err) {
          console.log(err);
        }
        let newGallery = product.gallery.filter(
          (photos) => photos.filename !== photo
        );

        let photoUpdated = await product.updateOne({ gallery: newGallery });
        if (photoUpdated)
          return sendSuccessMessage(
            res,
            "Photo was deleted successfully",
            newGallery
          );
      });
    } else {
      return sendErrorResponse(req, res, "Photo not found", 404);
    }
  } catch (error) {
    console.log(error);
    missingFieldsMsgs.push("There was a problem deleting the photo");
    return sendErrorResponse(req, res, missingFieldsMsgs, 400);
  }
};
/**
 * Updates a product in the database and returns the product updated
 *
 *
 * @param {*} req  - Request object for the request
 * @param {*} res  - Response object for the request
 * @returns  {Object} returns an object with the status, message and the product created
 */
productMethod.updateProduct = async (req, res) => {
  if (req.body) {
    console.log(req.body)
    const permission = acc.can(req.user.rol.name).updateAny("product").granted;
    const { id } = req.params;
    const product = await getProduct({ _id: id });
    const { sku } = req.body;
    const errors = [];

    if (!permission) {
      errors.push("You don't have permission to update this product");
    };

    if (!id) {
      errors.push("The product ID is required");
    };

    if (!product) {
      errors.push("No product found with the given ID");
    };

    if (sku && sku !== product.sku) {
      const existingProduct = await getProduct({ sku: req.body.sku });
      if (existingProduct) {
        errors.push("The SKU is already in use by another product");
      };
    };

    if (errors.length) {
      return res.status(400).json({ errors });
    };

    try {
      const updatedProduct = await Product.findOne({ _id: id });

      if (req.body.name) updatedProduct.name = req.body.name;
      if (req.body.description) updatedProduct.description = req.body.description;
      if (req.body.price) updatedProduct.price = req.body.price;
      if (req.body.discount) updatedProduct.discount = req.body.discount;
      if (req.body.stock) updatedProduct.stock = req.body.stock;
      if (req.body.sku) updatedProduct.sku = req.body.sku;
      if (req.body.rating) updatedProduct.rating = req.body.rating;
      if (req.body.category) updatedProduct.category = req.body.category;


      await updatedProduct.save();
      return res.status(200).json({ message: "Product updated successfully", product: updatedProduct })

    } catch (error) {
      console.log(error);
      return res.status(500).json({ errors: ["There was a problem updating the product"] })
    }
  } else {
    return res.status(400).json({ errors: ["Missing fields"] });
  }

};

/**
 * Updates the poster of the product in his path and in the database
 *
 * @param {*} req
 * @param {*} res
 * @returns
 */
productMethod.updateProductPoster = async (req, res) => {

  if (req.body) {

    const permission = acc.can(req.user.rol.name).updateAny("product").granted;
    const { id } = req.params;
    const product = await getProduct({ _id: id });
    const missingFieldsMsgs = [];

    if ((req.file && !permission) || !permission)
      res.status(401).json({ message: "You don't have permission to do this" });
    if (!req.file) missingFieldsMsgs.push("You must upload a poster");
    if (!id) missingFieldsMsgs.push("The productID is required");
    if (!product) missingFieldsMsgs.push("No product found");

    if (missingFieldsMsgs.length) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return sendErrorResponse(req, res, missingFieldsMsgs, 400);
    }

    try {
      if (product && req.file) {
        const poster = await updateFilePoster(req.file, product);
        if (poster) {
          return sendSuccessMessage(res, "Poster was updated successfully");
        }
      }


      if (poster) {
        return sendSuccessMessage(res, "Poster was updated successfully");
      }
    } catch (error) {
      console.log(error);
      return sendErrorResponse(
        req,
        res,
        "There was a problem updating the poster",
        400
      );
    }

    return sendErrorResponse(
      req,
      res,
      "There was a problem updating the poster",
      400
    );


  } else {
    return sendErrorResponse(
      req,
      res,
      "There was a problem updating the poster, missing fields",
      400
    );
  }

};


productMethod.updateProductGallery = async (req, res) => {
  console.log(req.files)
  if (req.files) {

    const permission = acc.can(req.user.rol.name).updateAny("product").granted;

    const { id } = req.params;
    const product = await getProduct({ _id: id });
    const missingFieldsMsgs = [];
    var galleryDB = [];
    const files = req.files;


    if ((files && !permission) || !permission)
      res.status(401).json({ message: "You don't have permission to do this" });

  
    if (!id) missingFieldsMsgs.push("The product id is required");
    if (!product) missingFieldsMsgs.push("No product found");
   // if (product && product.gallery.length + files.length > 5) missingFieldsMsgs.push("You can upload 5 images max");
    if (missingFieldsMsgs.length) {
      if (files)deleteGallery(files);
      return sendErrorResponse(req, res, missingFieldsMsgs, 400);
    }

    try {

      if (product.gallery) galleryDB = [...product.gallery];
      files.forEach((image) => {
        galleryDB.push({ 
          filename: image.filename,
          link: `/img/products/${image.filename}`
        });
      });
      
         
      let galleryUpdated = await product.updateOne({ gallery: galleryDB });

      if (galleryUpdated) {
        return sendSuccessMessage(res, "Gallery was updated successfully");
      }
    } catch (error) {
      console.log(error);
      deleteGallery(files);
      missingFieldsMsgs.push("There was a problem updating the gallery");
      console.log(missingFieldsMsgs);
      return sendErrorResponse(req, res, missingFieldsMsgs, 400);
    }
  } else {
    return sendErrorResponse(
      req,
      res,
      "There was a problem updating the gallery, missing fields",
      400
    );

  };
};

  module.exports = productMethod;
