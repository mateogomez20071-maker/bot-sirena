const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = "mi_token_seguro"; // luego lo usarás en Meta

const NUMEROS_PERMITIDOS = [
  "15551739245", 
  "573103532444",
  "573203126914"
];

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

      console.log("Mensaje:", texto, "De:", numero);

      const textoNormalizado = texto.trim().toUpperCase();
      const autorizado = NUMEROS_PERMITIDOS.includes(numero);

      if (textoNormalizado === "#EMERGENCIA" && autorizado) {
        console.log("🚨 ACTIVANDO SIRENA - Usuario autorizado");

        await axios.get("https://maker.ifttt.com/trigger/emergencia2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc");

      } else if (textoNormalizado === "#EMERGENCIA" && !autorizado) {
        console.log("⛔ Intento NO autorizado desde:", numero);
      }
    }

    // 👇 esto es OBLIGATORIO para WhatsApp
    res.sendStatus(200);

  } catch (error) {
    console.log("ERROR:", error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo"));


