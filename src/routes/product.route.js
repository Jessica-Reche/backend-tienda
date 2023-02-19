const express = require("express");
const router = express.Router();
const {
  getProduct,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductPoster,
  updateProductGallery,
  deleteProductGaleryPhoto,
} = require("../controllers/product.controller");
const auth = require("../middlewares/authMiddleware");
const {upload} = require("../middlewares/uploadMiddleware");

//Routes for the products
router
  .get("/getProduct/:id", getProduct)
  .get("/getProducts", getProducts)
  .post(
    "/createProduct",
    auth,
    upload("products").fields([
      { name: "poster", maxCount: 1 },
      { name: "gallery", maxCount: 5 },
    ]),
    createProduct
  )
  .delete("/deleteProduct/:id", auth, deleteProduct)
  .put("/updateProduct/:id", auth, updateProduct)
  .put("/updateProductPoster/:id", auth, upload('products').single("poster"), updateProductPoster)
  .put("/updateProductGallery", auth, upload('products').array("gallery",5), updateProductGallery)
  .delete("/deleteProductGaleryPhoto", auth, deleteProductGaleryPhoto);

module.exports = router;
