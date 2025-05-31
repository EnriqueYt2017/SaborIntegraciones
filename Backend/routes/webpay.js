const express = require("express");
const router = express.Router();
const { WebpayPlus, Options, IntegrationApiKeys, Environment } = require("transbank-sdk");

const options = new Options(
  "597055555532", // Código de comercio de pruebas
  IntegrationApiKeys.WEBPAY,
  Environment.Integration
);

const transaction = new WebpayPlus.Transaction(options);

router.post("/create", async (req, res) => {
  const { amount, sessionId, buyOrder, returnUrl } = req.body;

  try {
    const response = await transaction.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/commit", async (req, res) => {
  const { token_ws } = req.body;
  try {
    const response = await transaction.commit(token_ws);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;