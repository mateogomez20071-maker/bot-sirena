const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = "mi_token_seguro";

// 👥 Números que pueden usar el sistema
const NUMEROS_PERMITIDOS = [
  "15551739245", 
  "573103532444",
  "573203126914",
  "573225890435"
];

// 👮 Administradores que reciben alertas
const ADMIN_NUMEROS = [
  "573103532444",  
  "573203126914"   
];

// 📲 WhatsApp Cloud API
const PHONE_NUMBER_ID = "996743346852082";
const TOKEN = process.env.WHATSAPP_TOKEN;

// 🔌 Webhooks IFTTT
const IFTTT_URL = "https://maker.ifttt.com/trigger/emergencia2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc";
const IFTTT_OFF_URL = "https://maker.ifttt.com/trigger/apagar2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc";

// 📌 Guardar última activación
let ultimaActivacion = null;


// 📩 Función para enviar mensaje WhatsApp
async function enviarMensaje(numeroDestino, texto) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: numeroDestino,
      text: { body: texto }
    },
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}


// 🔐 Verificación webhook Meta
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});


// 📥 Recibir mensajes de WhatsApp
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message &&
        message.type === "text" &&
        message.text &&
        message.from &&
        !message.from_me // evita eco del bot
        ) {
      const texto = message.text.body || "";
      const numero = message.from;
      const textoNormalizado = texto.trim().toUpperCase();

      const autorizado = NUMEROS_PERMITIDOS.includes(numero);

      console.log("📩 Mensaje:", textoNormalizado, "De:", numero);

      // ===============================
      // 🚨 COMANDO EMERGENCIA
      // ===============================
      if (textoNormalizado === "#EMERGENCIA") {
        if (autorizado) {

          console.log("🚨 ACTIVANDO SIRENA");

          ultimaActivacion = {
            numero,
            fecha: new Date().toLocaleString("es-CO", {
              timeZone: "America/Bogota"
            })
          };

          await axios.get(IFTTT_URL);

          const mensajeAlerta =
            `🚨 ALERTA DE EMERGENCIA\n` +
            `Activado por: ${numero}\n` +
            `Hora: ${ultimaActivacion.fecha}`;

          for (const admin of ADMIN_NUMEROS) {
            await enviarMensaje(admin, mensajeAlerta);
          }

        } else {
          console.log("⛔ Usuario NO autorizado:", numero);
        }
      }


      // ===============================
      // 🛑 COMANDO APAGAR
      // ===============================
      if (textoNormalizado === "#APAGAR") {
        if (autorizado) {

          console.log("🛑 APAGANDO SIRENA");

          await axios.get(IFTTT_OFF_URL);

          const mensajeAlerta =
            `🛑 SIRENA APAGADA\n` +
            `Apagado por: ${numero}\n` +
            `Hora: ${new Date().toLocaleString("es-CO", {
              timeZone: "America/Bogota"
            })}`;

          for (const admin of ADMIN_NUMEROS) {
            await enviarMensaje(admin, mensajeAlerta);
          }

        } else {
          console.log("⛔ Intento NO autorizado de apagar:", numero);
        }
      }
    }

    // obligatorio para Meta
    return res.sendStatus(200);

  } catch (error) {
    console.log("❌ ERROR:", error?.response?.data || error.message);
    return res.sendStatus(500);
  }
});


// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});

