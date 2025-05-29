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
  const { rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, pass } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const hashedPassword = await bcrypt.hash(pass, 10);
    await connection.execute(
      `INSERT INTO Cliente 
        (RUT, DVRUT, PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, DIRECCION, CORREO, PASS) 
       VALUES 
        (:rut, :dvrut, :primer_nombre, :segundo_nombre, :primer_apellido, :segundo_apellido, :direccion, :correo, :pass)`,
      [rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, hashedPassword],
      { autoCommit: true }
    );

    res.status(201).json({ mensaje: "Cliente registrado exitosamente", usuario: { rut, primer_nombre, correo } });
  } catch (err) {
    console.error(err);
    if (err.errorNum === 1) { // ORA-00001: unique constraint violated
      res.status(409).json({ error: "El cliente ya existe" });
    } else {
      res.status(500).send("Error al registrar cliente");
    }
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

//Perfil
app.get("/perfil", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "No autorizado" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
        const { rut } = decoded;

        let connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM Cliente WHERE RUT = :rut`,
            [rut],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error al obtener perfil:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.put("/perfil", async (req, res) => {
  console.log("Solicitud recibida en /perfil:", req.body); 
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  let connection;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
    const { rut } = decoded;
    let { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo } = req.body;

    connection = await oracledb.getConnection(dbConfig);

    // Si no viene correo, obtén el actual de la BD
    if (!correo) {
      const result = await connection.execute(
        `SELECT correo FROM Cliente WHERE rut = :rut`,
        [rut],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      correo = result.rows[0]?.CORREO || result.rows[0]?.correo || null;
      if (!correo) {
        return res.status(400).json({ error: "No se encontró un correo válido para este usuario." });
      }
    }

    await connection.execute(
      `UPDATE Cliente 
       SET primer_nombre = :primer_nombre, 
         segundo_nombre = :segundo_nombre, 
         primer_apellido = :primer_apellido, 
         segundo_apellido = :segundo_apellido, 
         direccion = :direccion, 
         correo = :correo 
       WHERE rut = :rut`,
      [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, rut],
      { autoCommit: true }
    );

    res.json({ mensaje: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/", (req, res) => {
  res.send("¡Servidor funcionando en el puerto 5000!");
});
app.listen(5000, () => {
  console.log("✅ Servidor corriendo en http://localhost:5000");
});
