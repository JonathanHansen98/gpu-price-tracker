const mongoose = require("mongoose");
const { Schema } = mongoose;
/*
   team: "green", 
   make: "NVIDIA", 
  model: "3060" ,      
  price: parseFloat(priceItem.slice(1).replace(",", "")),
      title: text,
      date_scraped: new Date(),
      date_sold: new Date(dateItem.slice(5)),
      item_id: sha256(text).toString(),
  */
const GPUSchema = new Schema(
  {
    team: String,
    make: String,
    model: String,
    title: String,
    date_scraped: { type: Date, default: new Date() },
    date_sold: Date,
    item_id: String,
    price: Number,
  }
);

const GPU = mongoose.model("GPU", GPUSchema);

module.exports = GPU;
