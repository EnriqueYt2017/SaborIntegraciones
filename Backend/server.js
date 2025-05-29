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

app.get("/data", async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        if (!connection) {
            return res.status(500).send("No se pudo conectar a la base de datos");
        }

        const result = await connection.execute(
            `SELECT rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo FROM Cliente`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error al conectar con la base de datos:", err);
        res.status(500).json({ error: err.message }); // ✅ Corrección aquí
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});


//Registro de cliente
app.post("/register", async (req, res) => {
    const { rut, dvrut, primer_nombre, correo, pass } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const hashedPassword = await bcrypt.hash(pass, 10);
        await connection.execute(
            `INSERT INTO Cliente (RUT, DVRUT, PRIMER_NOMBRE, CORREO, PASS) 
             VALUES (:rut, :dvrut, :primer_nombre, :correo, :pass)`,
            [rut, dvrut, primer_nombre, correo, hashedPassword],
            { autoCommit: true }
        );

        // ✅ Devolver los datos del usuario recién registrado
        res.status(201).json({ mensaje: "Cliente registrado exitosamente", usuario: { rut, primer_nombre, correo } });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al registrar cliente");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

//Inicio de sesión
app.post("/login", async (req, res) => {
    const { correo, pass } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            "SELECT rut, primer_nombre, pass FROM Cliente WHERE correo = :correo",
            [correo],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Cliente no encontrado" });
        }

        const cliente = result.rows[0];

        // ✅ Verifica si los datos están en mayúsculas (Oracle suele devolverlos así)
        const rut = cliente.RUT || cliente.rut;
        const primer_nombre = cliente.PRIMER_NOMBRE || cliente.primer_nombre;
        const passwordHash = cliente.PASS || cliente.pass;

        console.log("Usuario autenticado en backend:", { rut, primer_nombre });

        const passwordValida = await bcrypt.compare(pass, passwordHash);
        if (!passwordValida) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { rut, primer_nombre },
            process.env.JWT_SECRET || "default_secret_key",
            { expiresIn: "1h" }
        );

        res.json({
            mensaje: "Inicio de sesión exitoso",
            token,
            usuario: { rut, primer_nombre, correo }
        });

    } catch (err) {
        console.error("Error al autenticar usuario:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.get("/", (req, res) => {
  res.send("¡Servidor funcionando en el puerto 5000!");
});
app.listen(5000, () => {
  console.log("✅ Servidor corriendo en http://localhost:5000");
});