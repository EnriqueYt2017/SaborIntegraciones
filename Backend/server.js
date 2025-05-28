const express = require("express");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json()); 
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

const dbConfig = {
  user: "BD_Integracion",
  password: "BD_Integracion",
  connectString: "localhost:1521/XE"
};

app.get("/", (req, res) => {
  res.send("¡Servidor funcionando en el puerto 5000!");
});
app.listen(5000, () => {
  console.log("✅ Servidor corriendo en http://localhost:5000");
});