const express = require("express");
const router = express.Router();
const { WebpayPlus, Options, IntegrationApiKeys, Environment } = require("transbank-sdk");
const oracledb = require("oracledb");
const dbConfig = require("../dbConfig");

const options = new Options(
  "597055555532", // Código de comercio de pruebas
  IntegrationApiKeys.WEBPAY,
  Environment.Integration
);

const transaction = new WebpayPlus.Transaction(options);

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
// ...existing code...
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
          [numero_orden],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (pedidoExistente.rows.length === 0) {
          // Solo inserta si no existe
          await connection.execute(
            `INSERT INTO pedidos (id_pedido, numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones)
     VALUES (PEDIDOS_SEQ.NEXTVAL, :numero_orden, :rut, SYSDATE, 'Sin enviar', :total, :direccion, :observaciones)`,
            [numero_orden, rut, total, direccion, observaciones],
            { autoCommit: true }
          );
        }

        // 2. Obtener dvrut del usuario
        const userResult = await connection.execute(
          `SELECT dvrut FROM Usuarios WHERE rut = :rut`,
          [rut],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        // Después de guardar el pedido y antes de finalizar la compra
        console.log("Carrito recibido para descontar stock:", carrito);
        if (Array.isArray(carrito)) {
          for (const item of carrito) {
            console.log("Descontando stock de:", item.codigo_producto, "cantidad:", item.cantidad);
            const result = await connection.execute(
              `UPDATE Producto SET stock = stock - :cantidad WHERE codigo_producto = :codigo_producto AND stock >= :cantidad`,
              [item.cantidad, item.codigo_producto],
              { autoCommit: false }
            );
            console.log("Filas afectadas:", result.rowsAffected);
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

module.exports = router;