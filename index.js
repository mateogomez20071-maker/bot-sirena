const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = "mi_token_seguro"; // luego lo usarás en Meta
const NUMERO_PERMITIDO = "+1 555 173 9245"; // tu numero con codigo pais
const ESP_URL = "http://192.168.1.50/activar"; // IP de tu ESP

// verificacion de webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// recibir mensajes
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message && message.text) {
      const texto = message.text.body;
      const numero = message.from;

      console.log("Mensaje:", texto);

      if (numero === NUMERO_PERMITIDO && texto === "#EMERGENCIA") {
        console.log("🚨 ACTIVANDO SIRENA");
        await axios.get("https://maker.ifttt.com/trigger/emergencia/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc");
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo"));




