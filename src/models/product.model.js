const { Schema, model } = require("mongoose");

const postSchema = new Schema({
  filename: { type: String, required: true },
  link: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  poster: {
    type: postSchema,
    required: true,
  },
  gallery: Array,
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    enum: ['tartas', 'cupcakes', 'donnuts', 'cookies', 'cajasdulces'],
    required: true
  }
  

  
});

module.exports = model("Product", productSchema);
