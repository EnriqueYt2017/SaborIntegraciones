const express = require("express");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json()); 

app.use(cors());


const dbConfig = {
  user: "Base_Datos",
  password: "Base_Datos",
  connectString: "localhost:1521/XE"
};

app.get("/api/Usuarios", async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        if (!connection) {
            return res.status(500).send("No se pudo conectar a la base de datos");
        }

        const result = await connection.execute(
            `SELECT rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo FROM Usuarios`,
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

//API
app.get("/clientes", async (req, res) => {
    try {
        const response = await fetch("https://api-sabor-latino-chile.onrender.com/clientes");
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});




//Registro de Usuario
app.post("/register", async (req, res) => {
  const { rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, pass } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const hashedPassword = await bcrypt.hash(pass, 10);
    await connection.execute(
      `INSERT INTO Usuarios 
        (RUT, DVRUT, PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, DIRECCION, CORREO, PASS) 
       VALUES 
        (:rut, :dvrut, :primer_nombre, :segundo_nombre, :primer_apellido, :segundo_apellido, :direccion, :correo, :pass)`,
      [rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, hashedPassword],
      { autoCommit: true }
    );

    res.status(201).json({ mensaje: "Usuario registrado exitosamente", usuario: { rut, primer_nombre, correo } });
  } catch (err) {
    console.error(err);
    if (err.errorNum === 1) { // ORA-00001: unique constraint violated
      res.status(409).json({ error: "El Usuario ya existe" });
    } else {
      res.status(500).send("Error al registrar Usuario");
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
            "SELECT rut, primer_nombre, pass FROM Usuarios WHERE correo = :correo",
            [correo],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Usuario no encontrado" });
        }

        const usuario = result.rows[0];

        // ✅ Verifica si los datos están en mayúsculas (Oracle suele devolverlos así)
        const rut = usuario.RUT || usuario.rut;
        const primer_nombre = usuario.PRIMER_NOMBRE || usuario.primer_nombre;
        const passwordHash = usuario.PASS || usuario.pass;

        console.log("Usuario autenticado en backend:", { rut, primer_nombre });

        const passwordValida = await bcrypt.compare(pass, passwordHash);
        if (!passwordValida) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { rut, primer_nombre },
            process.env.JWT_SECRET || "default_secret_key",
            { expiresIn: "7h" }
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
            `SELECT * FROM Usuarios WHERE RUT = :rut`,
            [rut],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
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
        `SELECT correo FROM Usuarios WHERE rut = :rut`,
        [rut],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      correo = result.rows[0]?.CORREO || result.rows[0]?.correo || null;
      if (!correo) {
        return res.status(400).json({ error: "No se encontró un correo válido para este usuario." });
      }
    }

    await connection.execute(
      `UPDATE Usuarios 
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



/*PRODUCTOS */
//Listar Prioductos
app.get("/productos", async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        // Si tienes un JOIN, usa alias para cada columna
        const result = await connection.execute(
            `SELECT 
                p.CODIGO_PRODUCTO, 
                p.NOMBRE AS NOMBRE_PRODUCTO, 
                p.PRECIO, 
                p.DESCRIPCION, 
                c.ID_CATEGORIA,
                c.NOMBRE AS NOMBRE_CATEGORIA
            FROM PRODUCTO p
            JOIN CATEGORIA c ON p.ID_CATEGORIA = c.ID_CATEGORIA`
        );
        res.json(result.rows.map(row => ({
            codigo_producto: row.CODIGO_PRODUCTO,
            nombre: row.NOMBRE_PRODUCTO,
            precio: row.PRECIO,
            descripcion: row.DESCRIPCION,
            id_categoria: row.ID_CATEGORIA,
            nombre_categoria: row.NOMBRE_CATEGORIA
        })));
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    } finally {
        if (connection) await connection.close();
    }
});
//Agregar Producto
app.post("/productos", async (req, res) => {
  const { nombre, precio, descripcion, id_categoria } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // Obtener el siguiente valor de la secuencia para el código de producto
    const seqResult = await connection.execute(
      `SELECT SEQ_PRODUCTO.NEXTVAL AS CODIGO_PRODUCTO FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const codigo_producto = seqResult.rows[0].CODIGO_PRODUCTO;

    await connection.execute(
      `INSERT INTO Producto (codigo_producto, nombre, precio, descripcion, id_categoria)
       VALUES (:codigo_producto, :nombre, :precio, :descripcion, :id_categoria)`,
      { codigo_producto, nombre, precio, descripcion, id_categoria },
      { autoCommit: true }
    );
    res.status(201).json({ mensaje: "Producto agregado exitosamente", codigo_producto });
  } catch (err) {
    console.error("Error al agregar producto:", err);
    res.status(500).json({ error: "Error al agregar producto" });
  } finally {
    if (connection) await connection.close();
  }
});



//DASHBOARD
//Clientes
app.get("/dashboard/Usuarios", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo FROM Usuarios`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener Usuarios para dashboard:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Actualizar cliente por rut
app.put('/api/Usuarios/:rut', async (req, res) => {
  const rut = req.params.rut;
  const updatedData = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig); // 🔹 abrir conexión
    await connection.execute(
      `UPDATE Usuarios SET 
        DVRUT = :dvrut,
        PRIMER_NOMBRE = :primer_nombre,
        SEGUNDO_NOMBRE = :segundo_nombre,
        PRIMER_APELLIDO = :primer_apellido,
        SEGUNDO_APELLIDO = :segundo_apellido,
        DIRECCION = :direccion,
        CORREO = :correo
      WHERE RUT = :rut`,
      { ...updatedData, rut },
      { autoCommit: true }
    );

    res.send({ message: 'Usuario actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Error al actualizar Usuarios' });
  }finally {
    if (connection) await connection.close(); // 🔹 cerrar conexión
  }
});


app.delete('/api/Usuarios/:rut', async (req, res) => {
  const rut = req.params.rut;
  let connection; 

  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      'DELETE FROM Usuarios WHERE RUT = :rut',
      [rut],
      { autoCommit: true }
    );
    res.send({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Error al eliminar Usuarios' });
  } finally {
    if (connection) await connection.close(); // 🔹 cerrar conexión
  }
}); 

//API


/*FIN CODIGO */
app.get("/", (req, res) => {
  res.send("¡Servidor funcionando en el puerto 5000!");
});
app.listen(5000, () => {
  console.log("✅ Servidor corriendo en http://localhost:5000");
});
