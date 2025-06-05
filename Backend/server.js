const express = require("express");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const webpayRoutes = require("./routes/webpay");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const path = require("path");
const logo = path.join(__dirname, "routes", "icono-logo.png");
const twilio = require('twilio');
dotenv.config();
const dbConfig = require("./dbConfig");
app.use(express.json());
app.use(cors());

app.use("/webpay", webpayRoutes);



function requireRoles(roles) {
  return (req, res, next) => {
    const user = req.body.usuario || req.user || req.decoded || {};
    if (!roles.includes(user.id_rol)) {
      return res.status(403).json({ error: "No tienes permisos para esta acción" });
    }
    next();
  };
}

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


//API DE BLUEEXPRESS y PEDIDOS
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

app.put("/pedidos/:numero_orden/tracking", async (req, res) => {
  const numero_orden = req.params.numero_orden;
  const { tracking_blue } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE pedidos SET tracking_blue = :tracking_blue WHERE numero_orden = :numero_orden`,
      [tracking_blue, numero_orden],
      { autoCommit: true }
    );
    res.json({ mensaje: "Tracking actualizado" });
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el tracking" });
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

// POST para simular la creación de envío y guardar tracking
app.post("/pedidos/:numero_orden/bluex", async (req, res) => {
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
    // Aquí deberías llamar a la API real de Blue Express y obtener el tracking
    const tracking_blue = "SIMULADO123456"; // Reemplaza por el real

    await connection.execute(
      `UPDATE pedidos SET tracking_blue = :tracking_blue WHERE numero_orden = :numero_orden`,
      [tracking_blue, numero_orden],
      { autoCommit: true }
    );
    res.json({ mensaje: "Envío creado y tracking guardado", tracking_blue });
  } catch (error) {
    res.status(500).json({ error: "No se pudo crear el envío Blue Express" });
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
      [rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, hashedPassword, 1], // id_rol = 1 (cliente)
      { autoCommit: true }
    );

    res.status(201).json({ mensaje: "Usuario registrado exitosamente", usuario: { rut, primer_nombre, correo, id_rol: 1 } });
  } catch (err) {
    // ...existing code...
  } finally {
    console.error(err);
    if (err.errorNum === 1) { // ORA-00001: unique constraint violated
      res.status(409).json({ error: "El Usuario ya existe" });
    } else {
      res.status(500).send("Error al registrar Usuario");
    }
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
      `SELECT codigo_producto, nombre, descripcion, precio, id_categoria, stock FROM Producto`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // ✅ Adaptar los nombres de las columnas
    const productos = result.rows.map(p => ({
      codigo_producto: p.CODIGO_PRODUCTO || p.codigo_producto,
      nombre: p.NOMBRE || p.nombre,
      descripcion: p.DESCRIPCION || p.descripcion,
      precio: p.PRECIO || p.precio,
      id_categoria: p.ID_CATEGORIA || p.id_categoria,
      stock: p.STOCK || p.stock // <-- agrega esto
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

  const { codigo_producto, nombre, descripcion, precio, id_categoria, stock } = req.body;
  if (!codigo_producto || !nombre || !descripcion || !precio || !id_categoria || !stock) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `INSERT INTO Producto (codigo_producto, nombre, descripcion, precio, id_categoria, stock)
             VALUES (:codigo_producto, :nombre, :descripcion, :precio, :id_categoria, :stock)`,
      [codigo_producto, nombre, descripcion, precio, id_categoria, stock],
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



//HISTORIAL DE COMPRAS
app.get("/api/historial", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT id_historial, fecha_transaccion, metodo_de_pago, monto, descripcion_transaccion, n_orden, rut FROM Historial`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // Adaptar nombres de columnas para el frontend
    const historial = result.rows.map(row => ({
      id_historial: row.ID_HISTORIAL || row.id_historial,
      fecha_transaccion: row.FECHA_TRANSACCION || row.fecha_transaccion,
      metodo_de_pago: row.METODO_DE_PAGO || row.metodo_de_pago,
      monto: row.MONTO || row.monto,
      descripcion_transaccion: row.DESCRIPCION_TRANSACCION || row.descripcion_transaccion,
      n_orden: row.N_ORDEN || row.n_orden,
      rut: row.RUT || row.rut
    }));
    res.json(historial);
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
      `SELECT ID_PLAN_ENTRENAMIENTO, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA, DURACION, NIVEL, TIPO, OBJETIVO, RUT FROM PLAN_ENTRENAMIENTO`,
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
    ID_PLAN_ENTRENAMIENTO, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA, DURACION, NIVEL, TIPO, OBJETIVO, RUT
  ) VALUES (
    SEQ_PLAN_ENTRENAMIENTO.NEXTVAL, :NOMBRE, :DESCRIPCION, TO_DATE(:FECHAINICIO, 'YYYY-MM-DD'), TO_DATE(:FECHAFIN, 'YYYY-MM-DD'), :FRECUENCIA, :DURACION, :NIVEL, :TIPO, :OBJETIVO, :RUT
  )`,
      {
        NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA,
        DURACION: Number(DURACION),
        NIVEL, TIPO, OBJETIVO,
        RUT: Number(RUT)
      },
      { autoCommit: true }
    );

    res.status(201).json({
      ID_PLAN_ENTRENAMIENTO: nextId,
      NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, FRECUENCIA,
      DURACION, NIVEL, TIPO, OBJETIVO, RUT
    });
  } catch (err) {
    console.error("Error al agregar plan de entrenamiento:", err);
    res.status(500).json({ error: "No se pudo agregar el plan" });
  } finally {
    if (connection) await connection.close();
  }
});

//NUTRICION
app.get("/api/planes-nutricion", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID_PLAN_NUTRICION, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, CALORIAS_DIARIAS, MACRONUTRIENTES, TIPODIETA, OBJETIVO, OBSERVACIONES, RUT FROM PLAN_NUTRICION`,
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

app.post("/api/planes-nutricion", async (req, res) => {
  let connection;
  try {
    const {
      NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, CALORIAS_DIARIAS,
      MACRONUTRIENTES, TIPODIETA, OBJETIVO, OBSERVACIONES, RUT
    } = req.body;

    connection = await oracledb.getConnection(dbConfig);

    await connection.execute(
      `INSERT INTO PLAN_NUTRICION (
        ID_PLAN_NUTRICION, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN,
        CALORIAS_DIARIAS, MACRONUTRIENTES, TIPODIETA, OBJETIVO, OBSERVACIONES, RUT
      ) VALUES (
        SEQ_PLAN_NUTRICION.NEXTVAL, :NOMBRE, :DESCRIPCION,
        TO_DATE(:FECHAINICIO, 'YYYY-MM-DD'), TO_DATE(:FECHAFIN, 'YYYY-MM-DD'),
        :CALORIAS_DIARIAS, :MACRONUTRIENTES, :TIPODIETA,
        :OBJETIVO, :OBSERVACIONES, :RUT
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
        RUT: Number(RUT)
      },
      { autoCommit: true }
    );

    res.status(201).json({ mensaje: "Plan de nutrición agregado correctamente" });
  } catch (err) {
    console.error("Error al agregar plan de nutrición:", err);
    res.status(500).json({ error: "No se pudo agregar el plan" });
  }
  finally {
    if (connection) await connection.close();
  }
});
//HISTORIAL
app.get("/api/historial", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID_HISTORIAL, FECHA_TRANSACCION, METODO_DE_PAGO, MONTOS, DESCRIPCION_TRANSACCION, N_ORDEN, RUT FROM HISTORIAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(historial);
  } catch (err) {
    console.error("Error al obtener historial:", err);
    res.status(500).json({ error: "No se pudo obtener el historial" });
  } finally {
    if (connection) await connection.close();
  }
});

//SUSCRIPCION
//VER SUSCRIPCIONES
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

//DASHBOARD
//Clientes
app.get("/dashboard/Usuarios", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT rut, dvrut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, correo, id_rol FROM Usuarios`,
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
  const { nombre, descripcion, precio, id_categoria, stock } = req.body;
  const codigo_producto = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE Producto SET nombre = :nombre, descripcion = :descripcion, precio = :precio, id_categoria = :id_categoria, stock = :stock WHERE codigo_producto = :codigo_producto`,
      [nombre, descripcion, precio, id_categoria, stock, codigo_producto],
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

    // Elimina primero los registros relacionados en reserva_producto (y otras tablas si aplica)
    await connection.execute(
      `DELETE FROM reserva_producto WHERE codigo_producto = :codigo_producto`,
      [codigo_producto],
      { autoCommit: false }
    );
    // Agrega aquí más deletes si hay otras tablas relacionadas

    // Ahora elimina el producto
    await connection.execute(
      `DELETE FROM Producto WHERE codigo_producto = :codigo_producto`,
      [codigo_producto],
      { autoCommit: false }
    );

    await connection.commit();
    res.json({ mensaje: "Producto y registros relacionados eliminados correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.close();
  }
});


//RESERVAS
app.post("/api/reservas", async (req, res) => {
  const { usuario, productos } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Obtén el último id_reserva o usa una secuencia si tienes
    const result = await connection.execute(
      "SELECT NVL(MAX(id_reserva), 0) + 1 AS next_id FROM reserva_producto"
    );
    const nextId = result.rows[0].NEXT_ID || result.rows[0].next_id;
    let dvrut = usuario.dvrut;
    if (!dvrut) {
      const userResult = await connection.execute(
        "SELECT dvrut FROM Usuarios WHERE rut = :rut",
        [usuario.rut],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      dvrut = userResult.rows[0]?.DVRUT || userResult.rows[0]?.dvrut || null;
    }
    // Inserta cada producto reservado
    for (const p of productos) {
      await connection.execute(
        `INSERT INTO reserva_producto (id_reserva, fecha_reserva, cantidad, rut, dvrut, codigo_producto)
     VALUES (SEQ_RESERVA.NEXTVAL, SYSDATE, :cantidad, :rut, :dvrut, :codigo_producto)`,
        [
          p.cantidad,
          usuario.rut,
          usuario.dvrut,
          p.codigo_producto
        ],
        { autoCommit: false }
      );
    }
    await connection.commit();
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al guardar reserva:", err);
    res.status(500).json({ error: "No se pudo guardar la reserva" });
  } finally {
    if (connection) await connection.close();
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

//COMENTARIOS
// Obtener comentarios (ordenados por fecha)
app.get("/api/comentarios", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT * FROM Comentarios ORDER BY fecha_publicacion DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT } // <-- Agrega esto
    );
    res.json(result.rows.map(row => ({
      id_comentario: row.ID_COMENTARIO,
      valoracion: row.VALORACION,
      fecha_publicacion: row.FECHA_PUBLICACION,
      texto: row.TEXTO
    })));
  } catch (err) {
    console.error("Error al obtener comentarios:", err);
    res.status(500).json({ error: "No se pudieron obtener los comentarios" });
  } finally {
    if (connection) await connection.close();
  }
});

// Guardar nuevo comentario
app.post("/api/comentarios", async (req, res) => {
  const { valoracion, texto } = req.body;
  const fecha_publicacion = new Date();
  const id_comentario = Date.now();

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO Comentarios (id_comentario, valoracion, fecha_publicacion, texto)
             VALUES (:id_comentario, :valoracion, :fecha_publicacion, :texto)`,
      [id_comentario, valoracion, fecha_publicacion, texto],
      { autoCommit: true }
    );
    // Opcional: guardar el nombre en otra tabla o asociar con usuario si tienes login
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al guardar comentario:", err);
    res.status(500).json({ error: "No se pudo guardar el comentario" });
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
