const express = require("express");
const router = express.Router();
const { paymentIntent } = require("../controllers/stripe.controller");

router.post("/", paymentIntent );
module.exports = router;
