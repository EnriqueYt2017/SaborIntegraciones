const express = require("express");
const router = express.Router();
const { WebpayPlus, Options, IntegrationApiKeys, Environment } = require("transbank-sdk");
const oracledb = require("oracledb");


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
router.post("/commit", async (req, res) => {
  const { token_ws, rut, direccion, observaciones, total } = req.body;
  try {
    const response = await transaction.commit(token_ws);

    // Solo guardar si el pago fue exitoso
    if (response.status === "AUTHORIZED" || response.status === "SUCCESS") {
      // El número de orden real está en response.buy_order
      const numero_orden = response.buy_order;
      let connection;
      try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
          `INSERT INTO pedidos (numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones)
           VALUES (:numero_orden, :rut, SYSDATE, 'Sin enviar', :total, :direccion, :observaciones)`,
          [numero_orden, rut, total, direccion, observaciones],
          { autoCommit: true }
        );
      } catch (dbErr) {
        console.error("Error al guardar pedido:", dbErr);
        // Puedes decidir si quieres responder error aquí o solo loguear
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