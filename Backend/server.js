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
app.get("/api/productos", async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT codigo_producto, nombre, descripcion, precio, id_categoria FROM Producto`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // ✅ Adaptar los nombres de las columnas
        const productos = result.rows.map(p => ({
            codigo_producto: p.CODIGO_PRODUCTO || p.codigo_producto,
            nombre: p.NOMBRE || p.nombre,
            descripcion: p.DESCRIPCION || p.descripcion,
            precio: p.PRECIO || p.precio,
            id_categoria: p.ID_CATEGORIA || p.id_categoria
        }));

        console.log("Datos obtenidos:", productos); // ✅ Verificar qué devuelve la consulta
        res.json(productos);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});
//Agregar Producto
app.post("/productos", async (req, res) => {
  console.log("Datos recibidos:", req.body); // ✅ Verificar si llegan correctamente

  const { codigo_producto, nombre, descripcion, precio, id_categoria } = req.body;
  if (!codigo_producto || !nombre || !descripcion || !precio || !id_categoria) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `INSERT INTO Producto (codigo_producto, nombre, descripcion, precio, id_categoria)
             VALUES (:codigo_producto, :nombre, :descripcion, :precio, :id_categoria)`,
      [codigo_producto, nombre, descripcion, precio, id_categoria],
      { autoCommit: true }
    );

    console.log("Producto agregado correctamente:", result);
    res.status(201).json({ mensaje: "Producto agregado correctamente" });
  } catch (error) {
    console.error("Error al agregar producto:", error);
    res.status(500).json({ error: error.message }); // ✅ Enviar mensaje claro de error
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
  } finally {
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


//DASHBOARD PRODUCTOS
app.get("/productos", async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT codigo_producto, nombre, descripcion, precio, id_categoria FROM Producto`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const productos = result.rows.map(p => ({
            codigo_producto: p.CODIGO_PRODUCTO || p.codigo_producto,
            nombre: p.NOMBRE || p.nombre,
            descripcion: p.DESCRIPCION || p.descripcion,
            precio: p.PRECIO || p.precio,
            id_categoria: p.ID_CATEGORIA || p.id_categoria
        }));

        res.json(productos);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

app.put("/productos/:id", async (req, res) => {
  const { nombre, descripcion, precio, id_categoria } = req.body;
  const codigo_producto = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE Producto SET nombre = :nombre, descripcion = :descripcion, precio = :precio, id_categoria = :id_categoria WHERE codigo_producto = :codigo_producto`,
      [nombre, descripcion, precio, id_categoria, codigo_producto],
      { autoCommit: true }
    );
    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.delete("/productos/:id", async (req, res) => {
  const codigo_producto = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `DELETE FROM Producto WHERE codigo_producto = :codigo_producto`,
      [codigo_producto],
      { autoCommit: true }
    );
    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.close();
  }
});

/*FIN CODIGO */
app.get("/", (req, res) => {
  res.send("¡Servidor funcionando en el puerto 5000!");
});
app.listen(5000, () => {
  console.log("✅ Servidor corriendo en http://localhost:5000");
});
