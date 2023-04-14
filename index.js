const express = require("express");
const mongoose = require("mongoose"); // import mongoose
const cloudinary = require("cloudinary").v2; // Import de cloudinary
const cors = require("cors");
require("dotenv").config();
const app = express(); // import express
app.use(express.json()); // on reçoit désormais des body en req
app.use(cors());

mongoose.connect(process.env.MONGODB_URI); // connexion BDD
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const userRoutes = require("./routes/user"); // import de mes routes user
app.use(userRoutes); // utilisation des routes user

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route doesn't exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
