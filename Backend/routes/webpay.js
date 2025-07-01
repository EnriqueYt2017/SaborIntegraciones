const express = require("express");
const router = express.Router();
const { WebpayPlus, Options, IntegrationApiKeys, Environment } = require("transbank-sdk");
const oracledb = require("oracledb");
const dbConfig = require("../dbConfig");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

const options = new Options(
  "597055555532", // Código de comercio de pruebas
  IntegrationApiKeys.WEBPAY,
  Environment.Integration
);

const transaction = new WebpayPlus.Transaction(options);

// Función interna para generar voucher (reutilizable)
async function generarVoucherInterno(numero_orden, rut, email) {
  const connection = await oracledb.getConnection(dbConfig);
  
  try {
    // Obtener información del pedido
    const pedido = await connection.execute(
      `SELECT p.*, u.PRIMER_NOMBRE, u.PRIMER_APELLIDO, u.CORREO 
       FROM pedidos p 
       JOIN Usuarios u ON p.rut = u.rut 
       WHERE p.numero_orden = :numero_orden`,
      [numero_orden],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (pedido.rows.length === 0) {
      throw new Error("Pedido no encontrado");
    }
    
    const datoPedido = pedido.rows[0];
    
    // Obtener suscripciones asociadas a esta compra (planes comprados)
    const suscripciones = await connection.execute(
      `SELECT s.*, 'PLAN' as TIPO_ITEM
       FROM SUSCRIPCIONES s 
       WHERE s.RUT = :rut 
       AND s.FECHA_SUSCRIPCION >= (SELECT FECHA_PEDIDO FROM pedidos WHERE numero_orden = :numero_orden)
       AND s.FECHA_SUSCRIPCION <= (SELECT FECHA_PEDIDO + INTERVAL '1' DAY FROM pedidos WHERE numero_orden = :numero_orden)
       ORDER BY s.FECHA_SUSCRIPCION DESC`,
      { rut: rut, numero_orden: numero_orden },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Crear PDF del voucher
    const doc = new PDFDocument();
    let buffers = [];
    
    await new Promise((resolve, reject) => {
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', resolve);
      doc.on('error', reject);
      
      // Generar contenido del PDF
      doc.fontSize(20).text('VOUCHER DE COMPRA', 50, 50, { align: 'center' });
      doc.fontSize(16).text('SportFit', 50, 80, { align: 'center' });
      
      doc.moveDown(2);
      doc.fontSize(12);
      doc.text(`Número de Orden: ${numero_orden}`, 50, 150);
      doc.text(`Cliente: ${datoPedido.PRIMER_NOMBRE} ${datoPedido.PRIMER_APELLIDO}`, 50, 170);
      doc.text(`RUT: ${datoPedido.RUT}`, 50, 190);
      doc.text(`Fecha: ${new Date(datoPedido.FECHA_PEDIDO).toLocaleDateString()}`, 50, 210);
      doc.text(`Total: $${datoPedido.TOTAL}`, 50, 230);
      
      doc.moveDown(2);
      
      if (suscripciones.rows.length > 0) {
        doc.fontSize(14).text('PLANES ADQUIRIDOS:', 50, 270);
        doc.moveDown();
        
        let yPosition = 300;
        suscripciones.rows.forEach((plan, index) => {
          doc.fontSize(12);
          doc.text(`${index + 1}. ${plan.NOMBRE}`, 70, yPosition);
          doc.text(`   Tipo: ${plan.TIPO_PLAN}`, 70, yPosition + 15);
          doc.text(`   Descripción: ${plan.DESCRIPCION}`, 70, yPosition + 30);
          doc.text(`   Fecha inicio: ${plan.FECHAINICIO ? new Date(plan.FECHAINICIO).toLocaleDateString() : 'Por definir'}`, 70, yPosition + 45);
          doc.text(`   Fecha fin: ${plan.FECHAFIN ? new Date(plan.FECHAFIN).toLocaleDateString() : 'Por definir'}`, 70, yPosition + 60);
          doc.text(`   Objetivo: ${plan.OBJETIVO}`, 70, yPosition + 75);
          
          yPosition += 110;
          
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
        });
      }
      
      doc.moveDown(3);
      doc.fontSize(10);
      doc.text('Este voucher es válido como comprobante de compra.', 50, doc.y, { align: 'center' });
      doc.text('SportFit - Tu mejor aliado en fitness y nutrición', 50, doc.y + 15, { align: 'center' });
      
      doc.end();
    });
    
    const pdfData = Buffer.concat(buffers);
    
    // Configurar transporte de correo
    let transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: "esancchezp2005@gmail.com",
        pass: "npwl xjfm qopc lfuv"
      }
    });
    
    // Enviar voucher por correo
    await transporter.sendMail({
      from: '"SportFit" <esancchezp2005@gmail.com>',
      to: datoPedido.CORREO || email,
      subject: `Voucher de Compra - Orden #${numero_orden}`,
      html: `
        <h2>¡Gracias por tu compra!</h2>
        <p>Hola ${datoPedido.PRIMER_NOMBRE},</p>
        <p>Tu compra ha sido procesada exitosamente.</p>
        <p><strong>Número de orden:</strong> ${numero_orden}</p>
        <p><strong>Total:</strong> $${datoPedido.TOTAL}</p>
        ${suscripciones.rows.length > 0 ? `
          <p><strong>Planes adquiridos:</strong></p>
          <ul>
            ${suscripciones.rows.map(plan => 
              `<li><strong>${plan.NOMBRE}</strong> (${plan.TIPO_PLAN}) - ${plan.DESCRIPCION}</li>`
            ).join('')}
          </ul>
        ` : ''}
        <p>Adjunto encontrarás el voucher detallado con todos los productos y servicios adquiridos.</p>
        <br>
        <p>¡Gracias por confiar en SportFit!</p>
      `,
      attachments: [{
        filename: `voucher-${numero_orden}.pdf`,
        content: pdfData
      }]
    });
    
    return { 
      success: true, 
      message: "Voucher generado y enviado por correo",
      voucherData: {
        numero_orden,
        total: datoPedido.TOTAL,
        planes: suscripciones.rows,
        fecha: datoPedido.FECHA_PEDIDO
      }
    };
  } finally {
    await connection.close();
  }
}

// Crear transacción Webpay
router.post("/create", async (req, res) => {
  const { amount, sessionId, buyOrder, returnUrl, rut, direccion, observaciones } = req.body;

  try {
    const response = await transaction.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );
    // Puedes devolver también los datos extra si los necesitas en el frontend
    res.json({ ...response, buyOrder, rut, direccion, observaciones, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirmar pago y guardar pedido
router.post("/commit", async (req, res) => {
  const { token_ws, rut, direccion, observaciones, total, carrito } = req.body;
  try {
    const response = await transaction.commit(token_ws);

    if (response.status === "AUTHORIZED" || response.status === "SUCCESS") {
      const numero_orden = response.buy_order;
      let connection;
      try {
        console.log("Intentando guardar pedido:", { numero_orden, rut, total, direccion, observaciones, carrito });

        connection = await oracledb.getConnection(dbConfig);

        const pedidoExistente = await connection.execute(
          `SELECT 1 FROM pedidos WHERE numero_orden = :numero_orden`,
          { numero_orden },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (pedidoExistente.rows.length === 0) {
          // Solo inserta si no existe
          await connection.execute(
            `INSERT INTO pedidos (id_pedido, numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones)
   VALUES (PEDIDOS_SEQ.NEXTVAL, :numero_orden, :rut, SYSDATE, 'Sin enviar', :total, :direccion, :observaciones)`,
            {
              numero_orden,
              rut,
              total,
              direccion,
              observaciones
            },
            { autoCommit: true }
          );

          // **NUEVA INTEGRACIÓN SOAP**: Crear pedido en SOAP también
          try {
            // Obtener información del usuario
            const userInfo = await connection.execute(
              `SELECT correo, primer_nombre, telefono FROM Usuarios WHERE rut = :rut`,
              [rut],
              { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            const usuario = userInfo.rows[0];
            
            // Preparar productos para SOAP desde el carrito
            let productosSOAP = [];
            if (Array.isArray(carrito) && carrito.length > 0) {
              productosSOAP = carrito.map(item => ({
                id_producto: parseInt(item.codigo_producto) || 999,
                nombre: item.nombre || `Producto ${item.codigo_producto}`,
                precio: parseFloat(item.precio) || 0,
                cantidad: parseInt(item.cantidad) || 1
              }));
            } else {
              // Si no hay carrito, crear un producto genérico
              productosSOAP = [{
                id_producto: 999,
                nombre: `Pedido Webpay #${numero_orden}`,
                precio: parseFloat(total) || 0,
                cantidad: 1
              }];
            }

            // Obtener referencia del adaptador SOAP
            const soapAdapter = req.soapAdapter;
            
            if (soapAdapter) {
              const pedidoSOAP = {
                id_usuario: parseInt(rut),
                direccion_entrega: direccion || "Dirección no especificada",
                telefono: usuario?.TELEFONO || "Sin teléfono",
                email: usuario?.CORREO || "sin-email@ejemplo.com",
                metodo_pago: "WEBPAY",
                productos: productosSOAP
              };

              console.log("🔄 Creando pedido en SOAP:", JSON.stringify(pedidoSOAP, null, 2));
              
              const resultadoSOAP = await soapAdapter.crearPedido(pedidoSOAP);
              
              if (resultadoSOAP.success) {
                console.log(`✅ Pedido SOAP creado exitosamente. ID: ${resultadoSOAP.id_pedido}`);
                
                // Actualizar observaciones para incluir ID SOAP
                await connection.execute(
                  `UPDATE pedidos SET observaciones = :observaciones WHERE numero_orden = :numero_orden`,
                  {
                    observaciones: `${observaciones || ''} | ID SOAP: ${resultadoSOAP.id_pedido}`,
                    numero_orden
                  },
                  { autoCommit: true }
                );
              } else {
                console.warn(`⚠️ Error creando pedido SOAP: ${resultadoSOAP.message}`);
              }
            } else {
              console.warn("⚠️ Adaptador SOAP no disponible");
            }
          } catch (soapError) {
            console.error("❌ Error en integración SOAP:", soapError);
            // No fallar la transacción principal por errores SOAP
          }
        }

        // 2. Obtener dvrut del usuario
        const userResult = await connection.execute(
          `SELECT dvrut FROM Usuarios WHERE rut = :rut`,
          [rut],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 3. Procesar suscripciones de planes si existen en el carrito
        if (Array.isArray(carrito)) {
          for (const item of carrito) {
            // Si es un plan de entrenamiento o nutrición, crear suscripción
            if (item.tipo === "plan_entrenamiento" || item.tipo === "plan_nutricion") {
              try {
                await connection.execute(
                  `INSERT INTO SUSCRIPCIONES 
                   (ID_SUSCRIPCION, ID_PLAN, NOMBRE, DESCRIPCION, FECHAINICIO, FECHAFIN, OBJETIVO, RUT, TIPO_PLAN)
                   VALUES 
                   (SEQ_SUSCRIPCIONES.NEXTVAL, :ID_PLAN, :NOMBRE, :DESCRIPCION, TO_DATE(:FECHAINICIO, 'YYYY-MM-DD'), TO_DATE(:FECHAFIN, 'YYYY-MM-DD'), :OBJETIVO, :RUT, :TIPO_PLAN)`,
                  {
                    ID_PLAN: item.ID_PLAN_ENTRENAMIENTO || item.ID_PLAN_NUTRICION,
                    NOMBRE: item.nombre,
                    DESCRIPCION: item.descripcion,
                    FECHAINICIO: item.planData?.FECHAINICIO ? item.planData.FECHAINICIO.substring(0, 10) : null,
                    FECHAFIN: item.planData?.FECHAFIN ? item.planData.FECHAFIN.substring(0, 10) : null,
                    OBJETIVO: item.planData?.OBJETIVO || item.objetivo,
                    RUT: rut,
                    TIPO_PLAN: item.tipo === "plan_entrenamiento" ? "ENTRENAMIENTO" : "NUTRICION"
                  },
                  { autoCommit: false }
                );
                console.log(`✅ Suscripción creada para plan: ${item.nombre} (${item.tipo})`);
              } catch (subscriptionError) {
                console.error("❌ Error creando suscripción:", subscriptionError);
                // No fallar la transacción principal por errores de suscripción
              }
            }
          }
        }
        // Después de guardar el pedido y antes de finalizar la compra
        console.log("Carrito recibido para descontar stock:", carrito);
        if (Array.isArray(carrito)) {
          for (const item of carrito) {
            await connection.execute(
              `UPDATE Producto SET stock = stock - :cantidad WHERE codigo_producto = :codigo_producto AND stock >= :cantidad`,
              {
                cantidad: item.cantidad,
                codigo_producto: item.codigo_producto
              },
              { autoCommit: false }
            );
          }
          await connection.commit();
        }

        //Guardar historial de transacciones
        await connection.execute(
          `INSERT INTO HISTORIAL (
    ID_HISTORIAL, FECHA_TRANSACCION, METODO_DE_PAGO, MONTO, DESCRIPCION_TRANSACCION, N_ORDEN, RUT
  ) VALUES (
    SEQ_HISTORIAL.NEXTVAL, SYSDATE, :metodo_de_pago, :monto, :descripcion_transaccion, :n_orden, :rut
  )`,
          {
            metodo_de_pago: response.payment_type || "Webpay",
            monto: Number(total),
            descripcion_transaccion: `Compra realizada. Autorización: ${response.authorization_code || response.authorizationCode || "N/A"}`,
            n_orden: String(numero_orden),
            rut: Number(rut)
          },
          { autoCommit: true }
        );

        console.log("Pedido y historial guardados correctamente");
        
        // Si hay planes en el carrito, generar y enviar voucher automáticamente
        const tienePlanes = Array.isArray(carrito) && carrito.some(item => 
          item.tipo === "plan_entrenamiento" || item.tipo === "plan_nutricion"
        );
        
        if (tienePlanes && userInfo.rows.length > 0) {
          try {
            console.log("🎯 Generando voucher automáticamente con planes...");
            // Llamar internamente a la función de generar voucher
            const voucherResponse = await generarVoucherInterno(numero_orden, rut, userInfo.rows[0].CORREO);
            console.log("📄 Voucher generado:", voucherResponse.success ? "exitoso" : "con errores");
          } catch (voucherError) {
            console.error("❌ Error generando voucher automático:", voucherError);
            // No fallar la transacción principal por errores de voucher
          }
        }
      } catch (dbErr) {
        console.error("Error al guardar pedido/historial:", dbErr);
      } finally {
        if (connection) await connection.close();
      }
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generar voucher de compra con planes incluidos
router.post("/generar-voucher", async (req, res) => {
  const { numero_orden, rut, email } = req.body;
  
  try {
    const result = await generarVoucherInterno(numero_orden, rut, email);
    res.json(result);
  } catch (error) {
    console.error("Error generando voucher:", error);
    res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
});

module.exports = router;