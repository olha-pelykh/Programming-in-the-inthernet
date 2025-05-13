const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");

const authRoutes = require("./app/controllers/Auth");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", authRoutes);

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://olhapelykh:MwMSh8uKSDFubB9w@cluster.f5g3fmj.mongodb.net/Node-API?retryWrites=true&w=majority&appName=Cluster",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected");
    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((err) => console.error(err));
