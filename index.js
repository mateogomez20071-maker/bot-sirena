const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = "mi_token_seguro";

// 📲 WhatsApp Cloud API
const PHONE_NUMBER_ID = "996743346852082";
const TOKEN = process.env.WHATSAPP_TOKEN;

// 👮 Administradores que reciben alertas
const ADMIN_NUMEROS = [
  "573103532444",
  "573203126914"
];

/* ======================================================
   👥 CLIENTES (cada numero tiene su propia sirena)
====================================================== */
const CLIENTES = {
  "573103532444": {
    nombre: "Mateo",
    activar: "https://maker.ifttt.com/trigger/emergencia2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",
    apagar: "https://maker.ifttt.com/trigger/apagar2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",

    ////////////////LUZ ANDREA/////////////////
    activar: "https://maker.ifttt.com/trigger/luz_andreaON/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",
    apagar: "https://maker.ifttt.com/trigger/LUS_ANDREAOFF/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc"
  },

  "573203126914": {
    nombre: "Santiago",
    activar: "https://maker.ifttt.com/trigger/emergencia2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",
    apagar: "https://maker.ifttt.com/trigger/apagar2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc"
  },
  "573107439421":{
    nombre: "Luz Andrea",
    activar: "https://maker.ifttt.com/trigger/luz_andreaON/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",
    apagar: "https://maker.ifttt.com/trigger/LUS_ANDREAOFF/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc"
  },

};

/* ======================================================
   📩 ENVIAR MENSAJE WHATSAPP
====================================================== */
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

/* ======================================================
   🔐 VERIFICACIÓN WEBHOOK META
====================================================== */
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

/* ======================================================
   📥 RECEPCIÓN DE MENSAJES
====================================================== */
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (
      message &&
      message.type === "text" &&
      message.text &&
      message.from
    ) {
      const texto = message.text.body || "";
      const numero = message.from;
      const textoNormalizado = texto.trim().toUpperCase();

      console.log("📩 Mensaje:", textoNormalizado, "De:", numero);

      // 🔎 buscar cliente por numero
      const cliente = CLIENTES[numero];

      if (!cliente) {
        console.log("⛔ Número no registrado:", numero);
        return res.sendStatus(200);
      }

      const hora = new Date().toLocaleString("es-CO", {
        timeZone: "America/Bogota"
      });

      /* ===============================
         🚨 EMERGENCIA
      =============================== */
      if (textoNormalizado === "#EMERGENCIA") {

        console.log("🚨 Activando sirena de:", cliente.nombre);

        await axios.get(cliente.activar);

        const mensajeAlerta =
          `🚨 ALERTA DE EMERGENCIA\n
        La sirena fue activada.
        Por favor:
          * Verificar entorno
          * Reportar novedades
          \n` +
          `Cliente: ${cliente.nombre}\n` +
          `Activado por: ${numero}\n` +
          `Fecha y Hora: ${hora}\n` +
          `Sistema KAS SECURITY`;

        for (const admin of ADMIN_NUMEROS) {
          await enviarMensaje(admin, mensajeAlerta);
        }
      }

      /* ===============================
         🛑 APAGAR
      =============================== */
      if (textoNormalizado === "#APAGAR") {

        console.log("🛑 Apagando sirena de:", cliente.nombre);

        await axios.get(cliente.apagar);

        const mensajeAlerta =
          `🛑 SIRENA APAGADA\n` +
          `Cliente: ${cliente.nombre}\n` +
          `Apagado por: ${numero}\n` +
          `Fecha y Hora: ${hora}\n` +
          `Sistema KAS SECURITY`;

        for (const admin of ADMIN_NUMEROS) {
          await enviarMensaje(admin, mensajeAlerta);
        }
      }
      /* ===============================
         ENCENDIDO LUZ ANDREA
      =============================== */
      if (textoNormalizado === "#ENCENDER") {

        console.log("🚨 Activando Luz de:", cliente.nombre);

        await axios.get(cliente.activar);

        const mensajeAlerta =
          `🚨 ALERTA DE EMERGENCIA\n
        La sirena fue activada.
        Por favor:
          * Verificar entorno
          * Reportar novedades
          \n` +
          `Cliente: ${cliente.nombre}\n` +
          `Activado por: ${numero}\n` +
          `Fecha y Hora: ${hora}\n` +
          `Sistema KAS SECURITY`;

        for (const admin of ADMIN_NUMEROS) {
          await enviarMensaje(admin, mensajeAlerta);
        }
      }

      /* ===============================
         🛑 APAGAR LUZ ANDREA
      =============================== */
      if (textoNormalizado === "#APAGADO") {

        console.log("🛑 Apagando luz de:", cliente.nombre);

        await axios.get(cliente.apagar);

        const mensajeAlerta =
          `🛑 LUZ APAGADA\n` +
          `Cliente: ${cliente.nombre}\n` +
          `Apagado por: ${numero}\n` +
          `Fecha y Hora: ${hora}\n` +
          `Sistema KAS SECURITY`;

        for (const admin of ADMIN_NUMEROS) {
          await enviarMensaje(admin, mensajeAlerta);
        }
      }
    }

    return res.sendStatus(200);

  } catch (error) {
    console.log("❌ ERROR:", error?.response?.data || error.message);
    return res.sendStatus(500);
  }
});

      
/* ======================================================
   🚀 START SERVER
====================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});













