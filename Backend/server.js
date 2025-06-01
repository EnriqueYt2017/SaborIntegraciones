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
dotenv.config();

app.use(express.json());
app.use(cors());

app.use("/webpay", webpayRoutes);


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

//PEDIDOS
app.post("/pedidos", async (req, res) => {
  const { numero_orden, rut, total, direccion, observaciones } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO pedidos (numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones)
       VALUES (:numero_orden, :rut, SYSDATE, 'Sin enviar', :total, :direccion, :observaciones)`,
      [numero_orden, rut, total, direccion, observaciones],
      { autoCommit: true }
    );
    res.status(201).json({ mensaje: "Pedido registrado correctamente" });
  } catch (error) {
    console.error("Error al registrar pedido:", error);
    res.status(500).json({ error: "Error al registrar pedido" });
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
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al buscar pedido:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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

  // --- DISEÑO PROFESIONAL DEL PDF ---

  // Header con degradado verde-azul y logo
  // Simular degradado dibujando rectángulos de diferentes tonos
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
/*FIN CODIGO */
app.get("/", (req, res) => {
  res.send("¡Servidor funcionando en el puerto 5000!");
});
app.listen(5000, () => {
  console.log("✅ Servidor corriendo en http://localhost:5000");
});
