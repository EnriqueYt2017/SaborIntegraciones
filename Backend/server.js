const express = require("express");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const webpayRoutes = require("./routes/webpay");
const { SOAPAdapter, createSOAPRoutes } = require("./soap/soap_adapter");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const path = require("path");
const logo = path.join(__dirname, "routes", "icono-logo.png");
const twilio = require('twilio');
const multer = require("multer");
const dbConfig = require("./dbConfig");
//GMAIL
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

app.use(session({
  secret: "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",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Serialización de usuario
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configura la estrategia de Google
passport.use(new GoogleStrategy({
  clientID: "355316018621-3lhs9of0a3cgl7osov8rjp2jc0gagj0v.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "/auth/google/callback"
},
  async (accessToken, refreshToken, profile, done) => {
    // Aquí puedes buscar/crear el usuario en tu BD
    // Ejemplo simple:
    const user = {
      googleId: profile.id,
      nombre: profile.displayName,
      correo: profile.emails[0].value
    };
    return done(null, user);
  }
));

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.use("/uploads", express.static("uploads"));
dotenv.config();
app.use(express.json());
app.use(cors());

// Middleware para pasar el adaptador SOAP a las rutas
app.use((req, res, next) => {
  req.soapAdapter = app.locals.soapAdapter;
  next();
});

app.use("/webpay", webpayRoutes);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Guarda el archivo con un nombre único y su extensión original
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

function requireRoles(roles) {
  return (req, res, next) => {
    const user = req.body.usuario || req.user || req.decoded || {};
    if (!roles.includes(user.id_rol)) {
      return res.status(403).json({ error: "No tienes permisos para esta acción" });
    }
    next();
  };
}

app.put("/api/Usuarios", async (req, res) => {
  const { correo, rut, dvrut, primer_nombre, primer_apellido, id_rol } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE Usuarios SET 
        rut = :rut,
        dvrut = :dvrut,
        primer_nombre = :primer_nombre,
        primer_apellido = :primer_apellido,
        id_rol = :id_rol
      WHERE correo = :correo AND rut = 12345678 AND dvrut = 0`,
      { rut, dvrut, primer_nombre, primer_apellido, id_rol, correo },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Usuario no encontrado o ya actualizado" });
    }
    res.json({ mensaje: "Datos actualizados correctamente" });
  } catch (err) {
    console.error("Error en /api/Usuarios (Google):", err);
    res.status(500).json({ error: "No se pudo actualizar el usuario" });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/api/Usuarios", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    if (!connection) {
      return res.status(500).send("No se pudo conectar a la base de datos");
    }

    const result = await connection.execute(
      `SELECT rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, telefono, id_rol FROM Usuarios`,
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

app.post("/api/Usuarios", async (req, res) => {
  const {
    rut, dvrut, primer_nombre, segundo_nombre,
    primer_apellido, segundo_apellido, direccion, correo, pass, id_rol
  } = req.body;

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const hashedPassword = await bcrypt.hash(pass, 10);

    await connection.execute(
      `INSERT INTO Usuarios 
        (RUT, DVRUT, PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, DIRECCION, CORREO, PASS, ID_ROL) 
       VALUES 
        (:rut, :dvrut, :primer_nombre, :segundo_nombre, :primer_apellido, :segundo_apellido, :direccion, :correo, :pass, :id_rol)`,
      {
        rut,
        dvrut,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        direccion,
        correo,
        pass: hashedPassword,
        id_rol: Number(id_rol)
      },
      { autoCommit: true }
    );

    res.status(201).json({ mensaje: "Usuario agregado correctamente" });
  } catch (err) {
    console.error("Error al agregar usuario:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

//API EXTERNA SABOR LATINO
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

//API PEDIDOS
app.get("/pedidos", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones, tracking_blue FROM pedidos`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.close();
  }
});



app.put("/pedidos/:numero_orden/estado", async (req, res) => {
  const numero_orden = req.params.numero_orden;
  const { estado } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE pedidos SET estado = :estado WHERE numero_orden = :numero_orden`,
      [estado, numero_orden],
      { autoCommit: true }
    );

    // Si el estado es "Completado", enviar correo y WhatsApp
    if (estado === "Completado") {
      // 1. Obtener datos del pedido y usuario
      const pedidoResult = await connection.execute(
        `SELECT p.numero_orden, p.rut, p.total, p.direccion, u.correo, u.primer_nombre 
         FROM pedidos p 
         JOIN Usuarios u ON p.rut = u.rut 
         WHERE p.numero_orden = :numero_orden`,
        [numero_orden],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const pedido = pedidoResult.rows[0];
      if (pedido && pedido.CORREO) {
        // 2. Enviar correo
        let transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "esancchezp2005@gmail.com",
            pass: "FAQF CZRX TKOB QCNL"
          }
        });
        await transporter.sendMail({
          from: '"SportFit" <esancchezp2005@gmail.com>',
          to: pedido.CORREO,
          subject: "¡Tu pedido ha sido completado!",
          html: `
            <h2>¡Hola ${pedido.PRIMER_NOMBRE}!</h2>
            <p>Tu pedido <b>#${pedido.NUMERO_ORDEN}</b> ha sido <b>completado</b> y está listo para ser retirado o entregado.</p>
            <p><b>Total:</b> $${pedido.TOTAL}</p>
            <p><b>Dirección:</b> ${pedido.DIRECCION}</p>
            <br>
            <p>¡Gracias por confiar en nosotros!</p>
          `
        });
      }

      // 3. Enviar WhatsApp (requiere Twilio o similar)
      // Ejemplo usando Twilio (debes instalarlo: npm install twilio)
      /*
      
      const client = twilio('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');
      await client.messages.create({
        from: 'whatsapp:+14155238886', // Número de Twilio WhatsApp sandbox
        to: 'whatsapp:+569XXXXXXXX',   // Número del usuario (debes guardar el número en la BD)
        body: `¡Hola ${pedido.PRIMER_NOMBRE}! Tu pedido #${pedido.NUMERO_ORDEN} ha sido completado.`
      });
      */
      // Nota: Debes tener el número de WhatsApp del usuario en la BD y configurado en Twilio.
    }

    res.json({ mensaje: "Estado actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el estado" });
  } finally {
    if (connection) await connection.close();
  }
});


app.get("/pedidos/:numero_orden", async (req, res) => {
  const numero_orden = req.params.numero_orden;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT * FROM pedidos WHERE numero_orden = :numero_orden`,
      [numero_orden],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    // Adaptar nombres de columnas a minúsculas para el frontend
    const row = result.rows[0];
    const pedido = {
      numero_orden: row.NUMERO_ORDEN || row.numero_orden,
      rut: row.RUT || row.rut,
      fecha_pedido: row.FECHA_PEDIDO || row.fecha_pedido,
      estado: row.ESTADO || row.estado,
      total: row.TOTAL || row.total,
      direccion: row.DIRECCION || row.direccion,
      observaciones: row.OBSERVACIONES || row.observaciones,
      tracking_blue: row.TRACKING_BLUE || row.tracking_blue
    };
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
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
        (RUT, DVRUT, PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, DIRECCION, CORREO, PASS, ID_ROL) 
       VALUES 
        (:rut, :dvrut, :primer_nombre, :segundo_nombre, :primer_apellido, :segundo_apellido, :direccion, :correo, :pass, :id_rol)`,
      [rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, hashedPassword, 1],
      { autoCommit: true }
    );

    res.status(201).json({ 
      mensaje: "Usuario registrado exitosamente", 
      usuario: { rut, primer_nombre, correo, id_rol: 1 } 
    });

  } catch (err) {
    console.error("Error al registrar usuario:", err);
    
    if (err.errorNum === 1) { // ORA-00001: unique constraint violated
      res.status(409).json({ error: "El Usuario ya existe" });
    } else {
      res.status(500).json({ error: "Error al registrar Usuario" });
    }
    
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error al cerrar la conexión:", err);
      }
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
      "SELECT rut, primer_nombre, pass, id_rol FROM Usuarios WHERE correo = :correo",
      [correo],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];
    const id_rol = usuario.ID_ROL || usuario.id_rol;


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
      usuario: { rut, primer_nombre, correo, id_rol }
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
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.put("/perfil", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  let connection;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
    const rutToken = decoded.rut;
    let { rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, telefono } = req.body;

    connection = await oracledb.getConnection(dbConfig);

    // Obtén el usuario actual por RUT del token
    const userResult = await connection.execute(
      `SELECT rut, dvrut FROM Usuarios WHERE rut = :rut`,
      [rutToken],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const usuarioActual = userResult.rows[0];

    // Solo permitir editar si el rut actual es temporal (8 dígitos) y dvrut es "0"
    const esRutTemporal = usuarioActual && usuarioActual.RUT && /^\d{8}$/.test(usuarioActual.RUT) && usuarioActual.DVRUT === "0";

    if (!esRutTemporal) {
      // Si no es temporal, no permitir editar rut/dvrut
      rut = usuarioActual.RUT;
      dvrut = usuarioActual.DVRUT;
    } else {
      // Si quiere poner un rut, verifica que no exista (excepto si es el mismo usuario)
      if (rut && dvrut) {
        const existeRut = await connection.execute(
          `SELECT rut FROM Usuarios WHERE rut = :rut AND dvrut = :dvrut AND rut <> :rutToken`,
          [rut, dvrut, rutToken],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (existeRut.rows.length > 0) {
          return res.status(409).json({ error: "El RUT y DVRUT ya están registrados por otro usuario." });
        }
      }
    }


    // Actualiza usando el rut del token como identificador
    await connection.execute(
      `UPDATE Usuarios 
       SET rut = :rut,
           dvrut = :dvrut,
           primer_nombre = :primer_nombre, 
           segundo_nombre = :segundo_nombre, 
           primer_apellido = :primer_apellido, 
           segundo_apellido = :segundo_apellido, 
           direccion = :direccion,
            telefono = :telefono
       WHERE rut = :rutToken`,
      [rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, telefono, rutToken],
      { autoCommit: true }
    );
    // ...después de actualizar el usuario...
    const nuevoToken = jwt.sign(
      { rut, primer_nombre, correo, id_rol: usuarioActual.ID_ROL || usuarioActual.id_rol || 1 },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7h" }
    );

    res.json({ mensaje: "Perfil actualizado correctamente", rut, dvrut, token: nuevoToken });

  } catch (error) {
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
      "SELECT * FROM Producto",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const productos = result.rows.map(p => ({
      codigo_producto: p.CODIGO_PRODUCTO,
      nombre: p.NOMBRE,
      descripcion: p.DESCRIPCION,
      precio: p.PRECIO,
      id_categoria: p.ID_CATEGORIA,
      stock: p.STOCK,
      imagen: p.IMAGEN
        ? `${req.protocol}://${req.get("host")}/uploads/${p.IMAGEN}`
        : null
    }));
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.close();
  }
});
//Agregar Producto
app.post("/productos", upload.single("imagen"), async (req, res) => {
  console.log("Datos recibidos:", req.body); // ✅ Verificar si llegan correctamente

  const { codigo_producto, nombre, descripcion, precio, id_categoria, stock } = req.body;
  const imagen = req.file ? req.file.filename : null;
  if (!codigo_producto || !nombre || !descripcion || !precio || !id_categoria || !stock) {
    return res.status(400).json({ error: "Todos los campos menos imagen son obligatorios" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO Producto (codigo_producto, nombre, descripcion, precio, id_categoria, stock, imagen)
       VALUES (:codigo_producto, :nombre, :descripcion, :precio, :id_categoria, :stock, :imagen)`,
      [codigo_producto, nombre, descripcion, precio, id_categoria, stock, imagen],
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
app.use("/uploads", express.static("uploads"));



//HISTORIAL DE COMPRAS
app.get("/api/historial", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID_HISTORIAL, FECHA_TRANSACCION, METODO_DE_PAGO, MONTO, DESCRIPCION_TRANSACCION, N_ORDEN, RUT FROM HISTORIAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const historial = result.rows.map(row => ({
      id_historial: row.ID_HISTORIAL,
      fecha_transaccion: row.FECHA_TRANSACCION,
      metodo_de_pago: row.METODO_DE_PAGO,
      monto: row.MONTO,
      descripcion_transaccion: row.DESCRIPCION_TRANSACCION,
      n_orden: row.N_ORDEN,
      rut: row.RUT
    }));
    res.json(historial); // <-- CORRIGE AQUÍ
  } catch (err) {
    console.error("Error al obtener historial:", err);
    res.status(500).json({ error: "No se pudo obtener el historial" });
  } finally {
    if (connection) await connection.close();
  }
});

//PLANES
//ENTRENAMIENTO
app.get("/api/planes-entrenamiento", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID_PLAN_ENTRENAMIENTO, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA, DURACION, NIVEL, TIPO, OBJETIVO, RUT, PRECIO FROM PLAN_ENTRENAMIENTO`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener planes de entrenamiento:", err);
    res.status(500).json({ error: "No se pudieron obtener los planes" });
  } finally {
    if (connection) await connection.close();
  }
});

app.post("/api/planes-entrenamiento", async (req, res) => {
  let connection;
  try {
    const {
      NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA,
      DURACION, NIVEL, TIPO, OBJETIVO, RUT
    } = req.body;

    connection = await oracledb.getConnection(dbConfig);

    // Obtener el siguiente ID
    const result = await connection.execute(
      `SELECT NVL(MAX(ID_PLAN_ENTRENAMIENTO),0)+1 AS NEXT_ID FROM PLAN_ENTRENAMIENTO`
    );
    const nextId = result.rows[0].NEXT_ID;

    await connection.execute(
      `INSERT INTO PLAN_ENTRENAMIENTO (
    ID_PLAN_ENTRENAMIENTO, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA, DURACION, NIVEL, TIPO, OBJETIVO, RUT, PRECIO
  ) VALUES (
    SEQ_PLAN_ENTRENAMIENTO.NEXTVAL, :NOMBRE, :DESCRIPCION, TO_DATE(:FECHAINICIO, 'YYYY-MM-DD'), TO_DATE(:FECHAFIN, 'YYYY-MM-DD'), :FRECUENCIA, :DURACION, :NIVEL, :TIPO, :OBJETIVO, :RUT, :PRECIO
  )`,
      {
        NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA,
        DURACION: Number(DURACION),
        NIVEL, TIPO, OBJETIVO,
        RUT: Number(RUT),
        PRECIO: 0 // Asignar un precio por defecto, puedes cambiarlo según tu lógica
      },
      { autoCommit: true }
    );

    res.status(201).json({
      ID_PLAN_ENTRENAMIENTO: nextId,
      NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA,
      DURACION, NIVEL, TIPO, OBJETIVO, RUT, PRECIO: 0,
    });
  } catch (err) {
    console.error("Error al agregar plan de entrenamiento:", err);
    res.status(500).json({ error: "No se pudo agregar el plan" });
  } finally {
    if (connection) await connection.close();
  }
});

// Eliminar plan de entrenamiento
app.delete("/api/planes-entrenamiento/:id", async (req, res) => {
  const id = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      "DELETE FROM PLAN_ENTRENAMIENTO WHERE ID_PLAN_ENTRENAMIENTO = :id",
      [id],
      { autoCommit: true }
    );
    res.json({ mensaje: "Plan de entrenamiento eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar el plan" });
  } finally {
    if (connection) await connection.close();
  }
});

// Modificar plan de entrenamiento
app.put("/api/planes-entrenamiento/:id", async (req, res) => {
  const id = req.params.id;
  const {
    NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA,
    DURACION, NIVEL, TIPO, OBJETIVO, RUT, PRECIO
  } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE PLAN_ENTRENAMIENTO SET
        NOMBRE = :NOMBRE,
        DESCRIPCION = :DESCRIPCION,
        FECHAINICIO = TO_DATE(:FECHAINICIO, 'YYYY-MM-DD'),
        FECHAFIN = TO_DATE(:FECHAFIN, 'YYYY-MM-DD'),
        FRECUENCIA = :FRECUENCIA,
        DURACION = :DURACION,
        NIVEL = :NIVEL,
        TIPO = :TIPO,
        OBJETIVO = :OBJETIVO,
        RUT = :RUT,
        PRECIO = :PRECIO
      WHERE ID_PLAN_ENTRENAMIENTO = :id`,
      {
        NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA,
        DURACION, NIVEL, TIPO, OBJETIVO, RUT, PRECIO, id
      },
      { autoCommit: true }
    );
    res.json({ mensaje: "Plan de entrenamiento actualizado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo actualizar el plan" });
  } finally {
    if (connection) await connection.close();
  }
});

// Obtener mensajes del foro
app.get("/api/foro-entrenamiento", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT * FROM FORO_ENTRENAMIENTO ORDER BY fecha_publicacion ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log("Mensajes en BD:", result.rows); // <-- AGREGA ESTO
    res.json(result.rows.map(row => ({
      id_foro: row.ID_FORO,
      rut: row.RUT,
      nombre: row.NOMBRE,
      rol: row.ROL,
      mensaje: row.MENSAJE,
      fecha_publicacion: row.FECHA_PUBLICACION
    })));
  } catch (err) {
    res.status(500).json({ error: "No se pudieron obtener los mensajes" });
  } finally {
    if (connection) await connection.close();
  }
});

// Enviar mensaje al foro
app.post("/api/foro-entrenamiento", async (req, res) => {
  const { rut, nombre, rol, mensaje } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO FORO_ENTRENAMIENTO (ID_FORO, RUT, NOMBRE, ROL, MENSAJE, FECHA_PUBLICACION)
       VALUES (SEQ_FORO_ENTRENAMIENTO.NEXTVAL, :rut, :nombre, :rol, :mensaje, SYSDATE)`,
      { rut, nombre, rol, mensaje },
      { autoCommit: true }
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "No se pudo guardar el mensaje" });
  } finally {
    if (connection) await connection.close();
  }
});

//NUTRICION
app.post("/api/planes-nutricion", async (req, res) => {
  const {
    NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, CALORIAS_DIARIAS,
    MACRONUTRIENTES, TIPODIETA, OBJETIVO, OBSERVACIONES, RUT, PRECIO
  } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO PLAN_NUTRICION (
        ID_PLAN_NUTRICION, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN,
        CALORIAS_DIARIAS, MACRONUTRIENTES, TIPODIETA, OBJETIVO, OBSERVACIONES, RUT, PRECIO
      ) VALUES (
        SEQ_PLAN_NUTRICION.NEXTVAL, :NOMBRE, :DESCRIPCION,
        TO_DATE(:FECHAINICIO, 'YYYY-MM-DD'), TO_DATE(:FECHAFIN, 'YYYY-MM-DD'),
        :CALORIAS_DIARIAS, :MACRONUTRIENTES, :TIPODIETA,
        :OBJETIVO, :OBSERVACIONES, :RUT, :PRECIO
      )`,
      {
        NOMBRE,
        DESCRIPCION,
        FECHAINICIO: FECHAINICIO ? FECHAINICIO.substring(0, 10) : null,
        FECHAFIN: FECHAFIN ? FECHAFIN.substring(0, 10) : null,
        CALORIAS_DIARIAS: Number(CALORIAS_DIARIAS),
        MACRONUTRIENTES,
        TIPODIETA,
        OBJETIVO,
        OBSERVACIONES,
        RUT: Number(RUT),
        PRECIO: Number(PRECIO)
      },
      { autoCommit: true }
    );
    res.status(201).json({ mensaje: "Plan de nutrición agregado correctamente" });
  } catch (err) {
    console.error("Error al agregar plan de nutrición:", err);
    res.status(500).json({ error: "No se pudo agregar el plan" });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/api/planes-nutricion", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID_PLAN_NUTRICION, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, CALORIAS_DIARIAS, MACRONUTRIENTES, TIPODIETA, OBJETIVO, OBSERVACIONES, RUT, NVL(PRECIO, 0)  AS PRECIO FROM PLAN_NUTRICION`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener planes de nutrición:", err);
    res.status(500).json({ error: "No se pudieron obtener los planes" });
  } finally {
    if (connection) await connection.close();
  }
});

// Eliminar plan de nutrición
app.delete("/api/planes-nutricion/:id", async (req, res) => {
  const id = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      "DELETE FROM PLAN_NUTRICION WHERE ID_PLAN_NUTRICION = :id",
      [id],
      { autoCommit: true }
    );
    res.json({ mensaje: "Plan de nutrición eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar el plan" });
  } finally {
    if (connection) await connection.close();
  }
});

// Modificar plan de nutrición
app.put("/api/planes-nutricion/:id", async (req, res) => {
  const id = req.params.id;
  const {
    NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, CALORIAS_DIARIAS,
    MACRONUTRIENTES, TIPODIETA, OBJETIVO, OBSERVACIONES, RUT, PRECIO
  } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE PLAN_NUTRICION SET
        NOMBRE = :NOMBRE,
        DESCRIPCION = :DESCRIPCION,
        FECHAINICIO = TO_DATE(:FECHAINICIO, 'YYYY-MM-DD'),
        FECHAFIN = TO_DATE(:FECHAFIN, 'YYYY-MM-DD'),
        CALORIAS_DIARIAS = :CALORIAS_DIARIAS,
        MACRONUTRIENTES = :MACRONUTRIENTES,
        TIPODIETA = :TIPODIETA,
        OBJETIVO = :OBJETIVO,
        OBSERVACIONES = :OBSERVACIONES,
        RUT = :RUT,
        PRECIO = :PRECIO
      WHERE ID_PLAN_NUTRICION = :id`,
      {
        NOMBRE,
        DESCRIPCION,
        FECHAINICIO: FECHAINICIO ? FECHAINICIO.substring(0, 10) : null,
        FECHAFIN: FECHAFIN ? FECHAFIN.substring(0, 10) : null,
        CALORIAS_DIARIAS: Number(CALORIAS_DIARIAS),
        MACRONUTRIENTES,
        TIPODIETA,
        OBJETIVO,
        OBSERVACIONES,
        RUT: Number(RUT),
        PRECIO: Number(PRECIO),
        id
      },
      { autoCommit: true }
    );
    res.json({ mensaje: "Plan de nutrición actualizado correctamente" });
  } catch (err) {
    console.error("Error al modificar plan de nutrición:", err);
    res.status(500).json({ error: "No se pudo modificar el plan" });
  } finally {
    if (connection) await connection.close();
  }
});
//INTEGRACION GMAIL
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    const { googleId, nombre, correo } = req.user;
    let connection;
    try {
      connection = await oracledb.getConnection(dbConfig);

      // Busca usuario por correo
      const result = await connection.execute(
        "SELECT rut, primer_nombre, correo, id_rol FROM Usuarios WHERE correo = :correo",
        [correo],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      let usuario = result.rows[0];
      let rut, primer_nombre, id_rol;

      if (!usuario) {
        // Si no existe, crea uno SIN rut ni dvrut
        primer_nombre = nombre.split(" ")[0];
        id_rol = 1; // Cliente por defecto

        const rutTemporal = 12345678; // Un número único temporal

        await connection.execute(
          `INSERT INTO Usuarios 
    (RUT, DVRUT, PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, DIRECCION, CORREO, PASS, ID_ROL)
   VALUES 
    (:rut, :dvrut, :primer_nombre, :segundo_nombre, :primer_apellido, :segundo_apellido, :direccion, :correo, :pass, :id_rol)`,
          {
            rut: 12345678,
            dvrut: 0,
            primer_nombre: primer_nombre,
            segundo_nombre: null,         // Usa null, no ""
            primer_apellido: null,
            segundo_apellido: null,
            direccion: null,
            correo: correo,
            pass: "",                     // Si PASS es NOT NULL, usa un string seguro
            id_rol: 1
          },
          { autoCommit: true }
        );
        rut = rutTemporal; // Para que el frontend detecte que falta completar
      } else {
        rut = usuario.RUT || usuario.rut || "";
        primer_nombre = usuario.PRIMER_NOMBRE || usuario.primer_nombre;
        id_rol = usuario.ID_ROL || usuario.id_rol;
      }

      // Genera el JWT
      const token = jwt.sign(
        { rut, primer_nombre, correo, id_rol },
        process.env.JWT_SECRET || "default_secret_key",
        { expiresIn: "7h" }
      );

      // Redirige al frontend con el token y los datos
      res.redirect(
        `http://localhost:5173/google-success?token=${token}&rut=${encodeURIComponent(rut)}&nombre=${encodeURIComponent(primer_nombre)}&correo=${encodeURIComponent(correo)}&id_rol=${id_rol}`
      );
    } catch (err) {
      console.error("Error en Google callback:", err);
      res.redirect("http://localhost:5173/login?error=google");
    } finally {
      if (connection) await connection.close();
    }
  }
);
//CONTACTENOS
app.post("/contactenos", async (req, res) => {
  const { nombre, correo, mensaje } = req.body;
  const numeroSolicitud = Date.now(); // Usamos timestamp como número único

  // 1. Guardar en la base de datos
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO Contactenos (numerosolicitud, nombre, correo, mensaje)
             VALUES (:numerosolicitud, :nombre, :correo, :mensaje)`,
      [numeroSolicitud, nombre, correo, mensaje],
      { autoCommit: true }
    );
  } catch (err) {
    console.error("Error al guardar en Contactenos:", err);
    return res.status(500).json({ error: "No se pudo guardar la consulta" });
  } finally {
    if (connection) await connection.close();
  }

  // 2. Configura tu transportador
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "esancchezp2005@gmail.com",
      pass: "FAQF CZRX TKOB QCNL"
    }
  });

  // 3. Correos
  const adminMail = {
    from: '"Contacto Web" <TU_CORREO@gmail.com>',
    to: "esancchezp2005@gmail.com",
    subject: `Nueva consulta #${numeroSolicitud}`,
    html: `
            <h2>Nueva consulta recibida</h2>
            <b>Número de solicitud:</b> ${numeroSolicitud}<br>
            <b>Nombre:</b> ${nombre}<br>
            <b>Email:</b> ${correo}<br>
            <b>Mensaje:</b><br>
            <pre>${mensaje}</pre>
            <br>
            <a href="mailto:${correo}?subject=Respuesta a tu consulta #${numeroSolicitud}">Responder a este usuario</a>
        `
  };

  const userMail = {
    from: '"Sabor Integraciones" <esancchezp2005@gmail.com>',
    to: correo,
    subject: `Hemos recibido tu consulta (#${numeroSolicitud})`,
    html: `
            <h2>¡Gracias por contactarnos!</h2>
            <p>Hemos recibido tu mensaje y te responderemos pronto.</p>
            <b>Número de solicitud:</b> ${numeroSolicitud}<br>
            <b>Tu mensaje:</b><br>
            <pre>${mensaje}</pre>
            <br>
            <p>Si tienes más dudas, responde a este correo.</p>
        `
  };

  try {
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);
    res.json({ ok: true, numeroSolicitud });
  } catch (err) {
    console.error("Error enviando correos:", err);
    res.status(500).json({ error: "No se pudo enviar el mensaje" });
  }
});

//SUSCRIPCIONES
app.get("/api/suscripciones", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID_PLAN, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, OBJETIVO, RUT, TIPO_PLAN FROM SUSCRIPCIONES`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener suscripciones:", err);
    res.status(500).json({ error: "No se pudieron obtener las suscripciones" });
  } finally {
    if (connection) await connection.close();
  }
});

app.post("/api/suscripciones", async (req, res) => {
  const { ID_PLAN, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, OBJETIVO, RUT, TIPO_PLAN } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO SUSCRIPCIONES 
        (ID_SUSCRIPCION, ID_PLAN, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, OBJETIVO, RUT, TIPO_PLAN)
       VALUES 
        (SEQ_SUSCRIPCIONES.NEXTVAL, :ID_PLAN, :NOMBRE, :DESCRIPCION, TO_DATE(:FECHAINICIO, 'YYYY-MM-DD'), TO_DATE(:FECHAFIN, 'YYYY-MM-DD'), :OBJETIVO, :RUT, :TIPO_PLAN)`,
      { ID_PLAN, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, OBJETIVO, RUT, TIPO_PLAN },
      { autoCommit: true }
    );
    res.status(201).json({ message: "Suscripción creada correctamente" });
  } catch (err) {
    console.error("Error al guardar suscripción:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

//COMENTARIOS
app.get("/api/comentarios", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT 
        ID_COMENTARIO,
        VALORACION,
        FECHA_PUBLICACION,
        TEXTO,
        CODIGO_PRODUCTO 
      FROM COMENTARIOS 
      ORDER BY FECHA_PUBLICACION ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const comentarios = result.rows.map(row => ({
      id_comentario: row.ID_COMENTARIO,
      valoracion: row.VALORACION,
      fecha_publicacion: row.FECHA_PUBLICACION,
      texto: row.TEXTO,
      codigo_producto: row.CODIGO_PRODUCTO
    }));
    res.json(comentarios);
  } catch (err) {
    console.error("Error al obtener comentarios:", err);
    res.status(500).json({ error: "No se pudieron obtener los comentarios" });
  } finally {
    if (connection) await connection.close();
  }
});

// Endpoint para crear nuevo comentario
app.post("/api/comentarios", async (req, res) => {
  const { valoracion, texto, codigo_producto } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO COMENTARIOS (
        ID_COMENTARIO,
        VALORACION,
        FECHA_PUBLICACION,
        TEXTO,
        CODIGO_PRODUCTO
      ) VALUES (
        SEQ_COMENTARIOS.NEXTVAL,
        :valoracion,
        SYSDATE,
        :texto,
        :codigo_producto
      )`,
      {
        valoracion: Number(valoracion),
        texto,
        codigo_producto
      },
      { autoCommit: true }
    );
    res.status(201).json({ mensaje: "Comentario agregado correctamente" });
  } catch (err) {
    console.error("Error al agregar comentario:", err);
    res.status(500).json({ error: "No se pudo agregar el comentario" });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/api/comentarios/:codigo_producto", async (req, res) => {
  const codigo_producto = req.params.codigo_producto;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT 
        ID_COMENTARIO,
        VALORACION,
        FECHA_PUBLICACION,
        TEXTO,
        CODIGO_PRODUCTO 
      FROM COMENTARIOS 
      WHERE CODIGO_PRODUCTO = :codigo_producto 
      ORDER BY FECHA_PUBLICACION DESC`,
      [codigo_producto],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows) {
      return res.json([]);
    }

    const comentarios = result.rows.map(row => ({
      id_comentario: row.ID_COMENTARIO,
      valoracion: row.VALORACION,
      fecha_publicacion: row.FECHA_PUBLICACION,
      texto: row.TEXTO,
      codigo_producto: row.CODIGO_PRODUCTO
    }));

    res.json(comentarios);
  } catch (err) {
    console.error("Error al obtener comentarios:", err);
    res.status(500).json({ error: "No se pudieron obtener los comentarios" });
  } finally {
    if (connection) await connection.close();
  }
});

app.delete("/api/comentarios/:id", async (req, res) => {
  const id = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      "DELETE FROM COMENTARIOS WHERE ID_COMENTARIO = :id",
      [id],
      { autoCommit: true }
    );
    res.json({ mensaje: "Comentario eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar comentario:", err);
    res.status(500).json({ error: "No se pudo eliminar el comentario" });
  } finally {
    if (connection) await connection.close();
  }
});
// Agregar después de los otros endpoints

//RESERVAS
app.post("/api/reservas", async (req, res) => {
  const { fecha_reserva, usuario, productos, numero_reserva } = req.body;
  let connection;

  try {
    // Validate required data
    if (!usuario || !usuario.rut || !productos || !Array.isArray(productos)) {
      return res.status(400).json({
        error: "Datos incompletos",
        recibido: { usuario, productos }
      });
    }

    connection = await oracledb.getConnection(dbConfig);

    // Insert each reserved product
    for (const p of productos) {
      await connection.execute(
        `INSERT INTO reserva_producto (
          id_reserva,
          fecha_reserva,
          cantidad,
          rut,
          dvrut,
          codigo_producto
        ) VALUES (
          SEQ_RESERVA.NEXTVAL,
          TO_DATE(:fecha_reserva, 'YYYY-MM-DD'),
          :cantidad,
          :rut,
          :dvrut,
          :codigo_producto
        )`,
        {
          fecha_reserva,
          cantidad: p.cantidad,
          rut: usuario.rut,
          dvrut: usuario.dvrut || '0',
          codigo_producto: p.codigo_producto
        },
        { autoCommit: false }
      );
    }

    await connection.commit();
    res.status(201).json({
      mensaje: "Reserva creada correctamente",
      numero_reserva
    });

  } catch (err) {
    console.error("Error al guardar reserva:", err);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("Error en rollback:", rollbackErr);
      }
    }
    res.status(500).json({ error: "No se pudo guardar la reserva" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error al cerrar la conexión:", err);
      }
    }
  }
});

app.post("/enviar-voucher-reserva", async (req, res) => {
  const { numeroReserva, usuario, sucursal, productos, total, fechaReserva, fechaLimite } = req.body;

  // 1. Generar el PDF en memoria
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  let buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", async () => {
    const pdfData = Buffer.concat(buffers);

    // 2. Configura tu transportador de correo
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "esancchezp2005@gmail.com",
        pass: "FAQF CZRX TKOB QCNL"
      }
    });

    // 3. Enviar el correo con el PDF adjunto
    try {
      await transporter.sendMail({
        from: '"SportFit" <esancchezp2005@gmail.com>',
        to: usuario.email,
        subject: "Voucher de Reserva",
        html: `<p>Adjuntamos tu voucher de reserva en PDF.<br>¡Gracias por reservar con nosotros!</p>`,
        attachments: [
          {
            filename: `${numeroReserva}.pdf`,
            content: pdfData,
            contentType: "application/pdf"
          }
        ]
      });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error enviando correo:", err);
      res.status(500).json({ error: "No se pudo enviar el correo" });
    }
  });



  const headerHeight = 100;
  for (let i = 0; i < headerHeight; i++) {
    // Interpolar color entre #43e97b (verde) y #38f9d7 (azul claro)
    const r1 = 67, g1 = 233, b1 = 123;
    const r2 = 56, g2 = 249, b2 = 215;
    const t = i / headerHeight;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    doc.rect(0, i, doc.page.width, 1).fill(`rgb(${r},${g},${b})`);
  }
  // Logo y título
  doc.image(logo, doc.page.width - 120, 20, { width: 80, height: 60, align: "right" });
  doc.fontSize(28).fillColor("#fff").font("Helvetica-Bold").text("Voucher de Reserva", 40, 35, { align: "left", width: doc.page.width - 180 });

  // Sombra para el contenido principal
  doc.rect(30, headerHeight + 15, doc.page.width - 60, doc.page.height - headerHeight - 80)
    .fillOpacity(0.07).fillAndStroke("#222", "#222");
  doc.fillOpacity(1);

  // Datos de la reserva (en dos columnas)
  let y = headerHeight + 35;
  const leftX = 50, rightX = doc.page.width / 2 + 10;
  doc.fontSize(14).fillColor("#222").font("Helvetica-Bold");
  doc.text(`N° Reserva:`, leftX, y, { continued: true }).font("Helvetica").text(numeroReserva);
  doc.font("Helvetica-Bold").text(`Nombre:`, leftX, doc.y + 5, { continued: true }).font("Helvetica").text(`${usuario.primer_nombre} ${usuario.primer_apellido}`);
  doc.font("Helvetica-Bold").text(`RUT:`, leftX, doc.y + 5, { continued: true }).font("Helvetica").text(usuario.rut);
  doc.font("Helvetica-Bold").text(`Email:`, leftX, doc.y + 5, { continued: true }).font("Helvetica").text(usuario.email);

  // Columna derecha
  let yRight = y;
  doc.font("Helvetica-Bold").text(`Sucursal:`, rightX, yRight, { continued: true }).font("Helvetica").text(sucursal.nombre);
  yRight = doc.y + 5;
  doc.font("Helvetica-Bold").text(`Fecha Reserva:`, rightX, yRight, { continued: true }).font("Helvetica").text(fechaReserva);
  yRight = doc.y + 5;
  doc.font("Helvetica-Bold").text(`Fecha Límite:`, rightX, yRight, { continued: true }).font("Helvetica").text(fechaLimite);

  // Línea divisoria
  y = Math.max(doc.y, doc.page.height / 4);
  doc.moveTo(50, y + 10).lineTo(doc.page.width - 50, y + 10).strokeColor("#43e97b").lineWidth(2).stroke();
  y += 25;

  // Tabla de productos
  doc.fontSize(16).fillColor("#43e97b").font("Helvetica-Bold").text("Productos Reservados:", 50, y, { underline: true });
  y = doc.y + 8;

  // Encabezado de tabla
  const colX = [60, 260, 340, 420, 510];
  const colW = [200, 80, 80, 90];
  doc.fontSize(13).fillColor("#222").font("Helvetica-Bold");
  doc.text("Producto", colX[0], y, { width: colW[0] });
  doc.text("Cantidad", colX[1], y, { width: colW[1], align: "center" });
  doc.text("Precio", colX[2], y, { width: colW[2], align: "center" });
  doc.text("Subtotal", colX[3], y, { width: colW[3], align: "right" });
  y += 18;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor("#e0e0e0").lineWidth(1).stroke();
  y += 8;

  // Filas de productos (máximo 8 por página)
  doc.font("Helvetica").fillColor("#222").fontSize(12);
  productos.forEach((p, idx) => {
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 50;
    }
    doc.text(p.nombre, colX[0], y, { width: colW[0], ellipsis: true });
    doc.text(p.cantidad.toString(), colX[1], y, { width: colW[1], align: "center" });
    doc.text(`$${p.precio.toLocaleString()}`, colX[2], y, { width: colW[2], align: "center" });
    doc.text(`$${(p.precio * p.cantidad).toLocaleString()}`, colX[3], y, { width: colW[3], align: "right" });
    y += 22;
  });

  // Total destacado
  doc.moveTo(50, y + 5).lineTo(doc.page.width - 50, y + 5).strokeColor("#43e97b").lineWidth(1.5).stroke();
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#43e97b").text(`Total: $${total.toLocaleString()}`, 360, y + 15, { width: 180, align: "right" });
  y += 45;

  // Fechas de retiro
  doc.fontSize(13).fillColor("#222").font("Helvetica-Bold").text("Retiro de productos:", 50, y, { underline: true });
  y = doc.y + 5;
  doc.font("Helvetica").fontSize(12).fillColor("#222").text(
    `Puedes retirar tus productos entre el ${fechaReserva} y el ${fechaLimite} (10 días hábiles desde la reserva).`,
    60, y, { width: doc.page.width - 120 }
  );
  y = doc.y + 5;
  doc.text("Horario de atención: 10:00 AM a 7:00 PM.", 60, y, { width: doc.page.width - 120 });
  y = doc.y + 15;

  // Aviso importante
  doc.rect(50, y, doc.page.width - 100, 60).fillOpacity(0.12).fillAndStroke("#e53935", "#e53935");
  doc.fillOpacity(1).fontSize(12).fillColor("#e53935").font("Helvetica-Bold").text("¡Importante!", 60, y + 5);
  doc.font("Helvetica").fillColor("#222").fontSize(11).text(
    "El sistema de reservas funciona de la siguiente manera: No tiene costo adicional la reserva de un producto, pero tendrás un plazo de 10 días hábiles para ir a retirar el producto. Desde las 10AM hasta las 7PM. Si no retiras el producto en ese plazo, se liberará el stock y podrás volver a reservarlo.",
    60, doc.y + 5, { width: doc.page.width - 120 }
  );

  // Footer
  doc.fontSize(13).fillColor("#43e97b").font("Helvetica-Bold").text("¡Gracias por reservar con nosotros!", 0, doc.page.height - 70, { align: "center" });
  doc.fontSize(10).fillColor("#888").font("Helvetica").text("SportFit - Todos los derechos reservados", 0, doc.page.height - 50, { align: "center" });

  doc.end();
});

//ENDPOINT PARA ESTADÍSTICAS DEL ADMINISTRADOR
// Endpoint de estadísticas para el dashboard
app.get("/api/estadisticas-admin", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // 1. Total de usuarios registrados
    const totalUsuarios = await connection.execute(
      `SELECT COUNT(*) as total_usuarios FROM Usuarios`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 2. Total de productos disponibles
    const totalProductos = await connection.execute(
      `SELECT COUNT(*) as total_productos FROM Producto`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 3. Total de ventas/pedidos
    const totalVentas = await connection.execute(
      `SELECT COUNT(*) as total_ventas FROM pedidos`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 4. Ingresos totales del historial de compras
    const ingresosTotales = await connection.execute(
      `SELECT NVL(SUM(MONTO), 0) as ingresos_totales FROM HISTORIAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 5. Ingresos adicionales de suscripciones de entrenamiento
    const ingresosEntrenamiento = await connection.execute(
      `SELECT NVL(SUM(PRECIO), 0) as ingresos_entrenamiento FROM PLAN_ENTRENAMIENTO`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 6. Ingresos adicionales de suscripciones de nutrición
    const ingresosNutricion = await connection.execute(
      `SELECT NVL(SUM(PRECIO), 0) as ingresos_nutricion FROM PLAN_NUTRICION`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 7. Productos más vendidos (simular basándose en productos reales)
    const productosPopulares = await connection.execute(
      `SELECT 
         p.NOMBRE as NOMBRE,
         CASE 
           WHEN p.STOCK = 0 THEN 15  -- Si no hay stock, se vendieron muchos
           WHEN p.STOCK <= 3 THEN 10  -- Stock muy bajo, ventas altas
           WHEN p.STOCK <= 9 THEN 5   -- Stock bajo, ventas moderadas
           ELSE 2                     -- Stock normal, pocas ventas
         END as TOTAL_VENDIDO,
         CASE 
           WHEN p.STOCK = 0 THEN 15 * NVL(p.PRECIO, 1000)
           WHEN p.STOCK <= 3 THEN 10 * NVL(p.PRECIO, 1000)
           WHEN p.STOCK <= 9 THEN 5 * NVL(p.PRECIO, 1000)
           ELSE 2 * NVL(p.PRECIO, 1000)
         END as INGRESOS
       FROM Producto p 
       ORDER BY 
         CASE 
           WHEN p.STOCK = 0 THEN 15
           WHEN p.STOCK <= 3 THEN 10
           WHEN p.STOCK <= 9 THEN 5
           ELSE 2
         END DESC
       FETCH FIRST 5 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 8. Stock bajo de productos
    const stockBajo = await connection.execute(
      `SELECT NOMBRE, STOCK FROM Producto 
       WHERE STOCK IS NOT NULL AND STOCK < 10 
       ORDER BY STOCK ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 9. Suscripciones activas de entrenamiento
    const suscripcionesEntrenamiento = await connection.execute(
      `SELECT COUNT(*) as cantidad FROM PLAN_ENTRENAMIENTO`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 10. Suscripciones activas de nutrición
    const suscripcionesNutricion = await connection.execute(
      `SELECT COUNT(*) as cantidad FROM PLAN_NUTRICION`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 11. Usuarios activos (por defecto todos los usuarios ya que no hay campo fecha_registro)
    const usuariosActivos = await connection.execute(
      `SELECT COUNT(*) as usuarios_activos FROM Usuarios`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 12. Ingresos por mes (últimos 6 meses del historial)
    const ingresosPorMes = await connection.execute(
      `SELECT 
         EXTRACT(MONTH FROM FECHA_TRANSACCION) as mes,
         COUNT(*) as cantidad_pedidos,
         NVL(SUM(MONTO), 0) as total_ingresos
       FROM HISTORIAL 
       WHERE FECHA_TRANSACCION IS NOT NULL AND FECHA_TRANSACCION >= ADD_MONTHS(SYSDATE, -6)
       GROUP BY EXTRACT(MONTH FROM FECHA_TRANSACCION)
       ORDER BY mes`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Calcular ingresos totales incluyendo suscripciones
    const ingresosHistorial = ingresosTotales.rows[0]?.INGRESOS_TOTALES || 0;
    const ingresosPlanes = (ingresosEntrenamiento.rows[0]?.INGRESOS_ENTRENAMIENTO || 0) +
      (ingresosNutricion.rows[0]?.INGRESOS_NUTRICION || 0);
    const ingresosTotalesCompletos = ingresosHistorial + ingresosPlanes;

    // Estructurar respuesta
    res.json({
      resumen: {
        total_usuarios: totalUsuarios.rows[0]?.TOTAL_USUARIOS || 0,
        total_productos: totalProductos.rows[0]?.TOTAL_PRODUCTOS || 0,
        total_ventas: totalVentas.rows[0]?.TOTAL_VENTAS || 0,
        ingresos_totales: ingresosTotalesCompletos
      },
      ingresos_totales: ingresosTotalesCompletos,
      total_pedidos: totalVentas.rows[0]?.TOTAL_VENTAS || 0,
      productos_mas_vendidos: productosPopulares.rows.map(row => ({
        nombre: row.NOMBRE,
        total_vendido: row.TOTAL_VENDIDO,
        ingresos: row.INGRESOS
      })) || [],
      usuarios_activos: usuariosActivos.rows[0]?.USUARIOS_ACTIVOS || totalUsuarios.rows[0]?.TOTAL_USUARIOS || 0,
      pedidos_por_mes: ingresosPorMes.rows.map(row => ({
        mes: row.MES,
        cantidad_pedidos: row.CANTIDAD_PEDIDOS,
        total_ingresos: row.TOTAL_INGRESOS
      })) || [],
      stock_bajo: stockBajo.rows.map(row => ({
        nombre: row.NOMBRE,
        stock: row.STOCK
      })) || [],
      categorias_vendidas: [
        { categoria: "Entrenamiento", cantidad_vendida: suscripcionesEntrenamiento.rows[0]?.CANTIDAD || 0 },
        { categoria: "Nutrición", cantidad_vendida: suscripcionesNutricion.rows[0]?.CANTIDAD || 0 }
      ],
      productos_populares: productosPopulares.rows.slice(0, 3).map(row => ({
        descripcion: row.NOMBRE,
        cantidad_compras: row.TOTAL_VENDIDO
      })) || [],
      suscripciones_activas: [
        { tipo_plan: "plan_entrenamiento", cantidad: suscripcionesEntrenamiento.rows[0]?.CANTIDAD || 0 },
        { tipo_plan: "plan_nutricion", cantidad: suscripcionesNutricion.rows[0]?.CANTIDAD || 0 }
      ]
    });

  } catch (err) {
    console.error("Error al obtener estadísticas:", err);

    // En caso de error, intentar cargar datos de demostración como fallback
    try {
      const estadisticasDemo = require('./estadisticas_demo');
      res.json(estadisticasDemo);
    } catch (fallbackErr) {
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error al cerrar la conexión:", err);
      }
    }
  }
});

app.get("/", (req, res) => {
  res.send("¡Servidor funcionando en el puerto 5000!");
});

// Inicializar y configurar SOAP
async function initializeSOAP() {
  console.log("🚀 Inicializando adaptador SOAP...");
  const soapAdapter = new SOAPAdapter();
  const initialized = await soapAdapter.initialize();

  if (initialized) {
    // Configurar rutas SOAP
    createSOAPRoutes(app, soapAdapter);
    console.log("✅ Adaptador SOAP configurado correctamente");
  } else {
    console.warn("⚠️  Adaptador SOAP no pudo inicializarse. Funcionalidad SOAP limitada.");
  }

  return soapAdapter;
}

// Iniciar servidor con SOAP
async function startServer() {
  try {
    // Inicializar SOAP
    const soapAdapter = await initializeSOAP();

    // Guardar referencia del adaptador para uso en las rutas
    app.locals.soapAdapter = soapAdapter;

    // Iniciar servidor HTTP
    const server = app.listen(5000, () => {
      console.log("✅ Servidor corriendo en http://localhost:5000");
      console.log("📡 Servicios SOAP disponibles en /api/soap/*");
      console.log("🔄 Sincronización SOAP disponible en /api/sincronizar-pedidos-soap");
      console.log("📋 Pedidos unificados en /api/pedidos-unificados/:usuario_id");
    });

    // Manejar cierre graceful
    process.on('SIGINT', async () => {
      console.log('\n🛑 Cerrando servidor...');
      if (soapAdapter) {
        await soapAdapter.detenerServicio();
      }
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

// Ruta para sincronizar pedidos existentes con SOAP
app.post("/api/sincronizar-pedidos-soap", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Obtener todos los pedidos que no están en SOAP
    const result = await connection.execute(
      `SELECT p.id_pedido, p.numero_orden, p.rut, p.fecha_pedido, p.estado, 
              p.total, p.direccion, p.observaciones, u.correo, u.telefono
       FROM pedidos p
       JOIN Usuarios u ON p.rut = u.rut
       WHERE p.estado != 'CANCELADO'
       ORDER BY p.fecha_pedido DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const pedidosSincronizados = [];
    const errores = [];

    for (const row of result.rows) {
      try {
        // Crear pedido en SOAP
        const soapAdapter = req.app.locals.soapAdapter;
        if (soapAdapter) {
          const pedidoSOAP = {
            id_usuario: row.RUT,
            direccion_entrega: row.DIRECCION || "Dirección no especificada",
            telefono: row.TELEFONO || "Sin teléfono",
            email: row.CORREO || "sin-email@ejemplo.com",
            metodo_pago: "WEBPAY",
            productos: [
              {
                id_producto: 999, // ID genérico para pedidos existentes
                nombre: `Pedido #${row.NUMERO_ORDEN}`,
                precio: parseFloat(row.TOTAL) || 0,
                cantidad: 1
              }
            ]
          };

          const resultado = await soapAdapter.crearPedido(pedidoSOAP);
          if (resultado.success) {
            pedidosSincronizados.push({
              numero_orden: row.NUMERO_ORDEN,
              id_soap: resultado.id_pedido,
              estado: "SINCRONIZADO"
            });
          } else {
            errores.push({
              numero_orden: row.NUMERO_ORDEN,
              error: resultado.message
            });
          }
        } else {
          errores.push({
            numero_orden: row.NUMERO_ORDEN,
            error: "Servicio SOAP no disponible"
          });
        }
      } catch (error) {
        errores.push({
          numero_orden: row.NUMERO_ORDEN,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      sincronizados: pedidosSincronizados.length,
      errores: errores.length,
      detalles: {
        pedidosSincronizados,
        errores
      }
    });

  } catch (error) {
    console.error("Error sincronizando pedidos:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      message: error.message
    });
  } finally {
    if (connection) await connection.close();
  }
});

// Ruta para crear pedido directo (integración completa)
app.post("/api/pedidos-soap", async (req, res) => {
  const { id_usuario, direccion_entrega, telefono, email, productos, metodo_pago = "WEBPAY" } = req.body;

  if (!id_usuario || !productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Datos insuficientes. Se requiere id_usuario y productos."
    });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Verificar que el usuario existe
    const userResult = await connection.execute(
      `SELECT rut, correo, primer_nombre, direccion, telefono FROM Usuarios WHERE rut = :rut`,
      [id_usuario],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }

    const usuario = userResult.rows[0];

    // Preparar datos para SOAP usando datos del usuario si no se proporcionan
    const datosSOAP = {
      id_usuario: parseInt(id_usuario),
      direccion_entrega: direccion_entrega || usuario.DIRECCION || "Dirección no especificada",
      telefono: telefono || usuario.TELEFONO || "Sin teléfono",
      email: email || usuario.CORREO || "sin-email@ejemplo.com",
      metodo_pago,
      productos: productos.map(prod => ({
        id_producto: parseInt(prod.id_producto || prod.codigo_producto),
        nombre: prod.nombre,
        precio: parseFloat(prod.precio),
        cantidad: parseInt(prod.cantidad)
      }))
    };

    // Crear pedido en SOAP
    const soapAdapter = req.app.locals.soapAdapter;
    if (!soapAdapter) {
      return res.status(503).json({
        success: false,
        error: "Servicio SOAP no disponible"
      });
    }

    const resultadoSOAP = await soapAdapter.crearPedido(datosSOAP);

    if (resultadoSOAP.success) {
      // Calcular total
      const total = productos.reduce((sum, prod) => sum + (parseFloat(prod.precio) * parseInt(prod.cantidad)), 0);

      // Crear pedido en la base de datos tradicional también
      const numero_orden = `SOAP-${resultadoSOAP.id_pedido}-${Date.now()}`;

      await connection.execute(
        `INSERT INTO pedidos (id_pedido, numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones)
         VALUES (PEDIDOS_SEQ.NEXTVAL, :numero_orden, :rut, SYSDATE, 'PENDIENTE', :total, :direccion, 'Pedido creado via SOAP')`,
        {
          numero_orden,
          rut: id_usuario,
          total,
          direccion: datosSOAP.direccion_entrega,
          observaciones: `ID SOAP: ${resultadoSOAP.id_pedido}`
        },
        { autoCommit: true }
      );

      res.json({
        success: true,
        message: "Pedido creado exitosamente",
        id_pedido_soap: resultadoSOAP.id_pedido,
        numero_orden_tradicional: numero_orden,
        pedido: resultadoSOAP.pedido
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Error creando pedido SOAP",
        message: resultadoSOAP.message
      });
    }

  } catch (error) {
    console.error("Error creando pedido SOAP:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      message: error.message
    });
  } finally {
    if (connection) await connection.close();
  }
});



// Ruta para buscar pedidos tanto en sistema tradicional como SOAP
app.get("/api/pedidos-unificados/:usuario_id", async (req, res) => {
  const usuario_id = req.params.usuario_id;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    // Obtener pedidos tradicionales
    const pedidosTradicionales = await connection.execute(
      `SELECT id_pedido, numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones
       FROM pedidos 
       WHERE rut = :usuario_id
       ORDER BY fecha_pedido DESC`,
      [usuario_id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Obtener pedidos SOAP
    let pedidosSOAP = [];
    const soapAdapter = req.app.locals.soapAdapter;
    if (soapAdapter) {
      try {
        pedidosSOAP = await soapAdapter.listarPedidosUsuario(usuario_id);
      } catch (soapError) {
        console.warn("Error obteniendo pedidos SOAP:", soapError.message);
      }
    }

    // Formatear pedidos tradicionales
    const pedidosFormateados = pedidosTradicionales.rows.map(row => ({
      id: row.ID_PEDIDO,
      numero_orden: row.NUMERO_ORDEN,
      tipo: "TRADICIONAL",
      fecha_pedido: row.FECHA_PEDIDO,
      estado: row.ESTADO,
      total: parseFloat(row.TOTAL),
      direccion: row.DIRECCION,
      observaciones: row.OBSERVACIONES,
      origen: "Sistema Tradicional"
    }));

    // Formatear pedidos SOAP
    const pedidosSOAPFormateados = pedidosSOAP.map(pedido => ({
      id: pedido.id_pedido,
      numero_orden: `SOAP-${pedido.id_pedido}`,
      tipo: "SOAP",
      fecha_pedido: pedido.fecha_pedido,
      estado: pedido.estado,
      total: parseFloat(pedido.total),
      direccion: pedido.direccion_entrega,
      telefono: pedido.telefono,
      email: pedido.email,
      productos: pedido.productos || [],
      origen: "Sistema SOAP"
    }));

    // Combinar y ordenar por fecha
    const todosPedidos = [...pedidosFormateados, ...pedidosSOAPFormateados]
      .sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido));

    res.json({
      success: true,
      total_pedidos: todosPedidos.length,
      tradicionales: pedidosFormateados.length,
      soap: pedidosSOAPFormateados.length,
      pedidos: todosPedidos
    });

  } catch (error) {
    console.error("Error obteniendo pedidos unificados:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      message: error.message
    });
  } finally {
    if (connection) await connection.close();
  }
});
