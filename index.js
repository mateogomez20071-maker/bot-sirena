const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

/* ======================================================
   🔐 CONFIGURACIÓN GENERAL
====================================================== */

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
   👥 CLIENTES Y DISPOSITIVOS
   Cada cliente tiene sus propios comandos y URLs
====================================================== */

const CLIENTES = {

  "573103532444": {
    nombre: "Mateo",
    comandos: {
      "#EMERGENCIA": "https://maker.ifttt.com/trigger/emergencia2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",
      "#APAGAR": "https://maker.ifttt.com/trigger/apagar2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc"

      "#ENCENDER": "https://maker.ifttt.com/trigger/luz_andreaON/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",
      "#APAGADO": "https://maker.ifttt.com/trigger/luz_andreaOFF/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc"
    }
  },

  "573203126914": {
    nombre: "Santiago",
    comandos: {
      "#EMERGENCIA": "https://maker.ifttt.com/trigger/emergencia2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",
      "#APAGAR": "https://maker.ifttt.com/trigger/apagar2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc"
    }
  },

  "573107439421": {
    nombre: "Luz Andrea",
    comandos: {
      "#ENCENDER": "https://maker.ifttt.com/trigger/luz_andreaON/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc",
      "#APAGADO": "https://maker.ifttt.com/trigger/luz_andreaOFF/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc"
    }
  }

};

/* ======================================================
   📩 FUNCIÓN PARA ENVIAR MENSAJES POR WHATSAPP
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
   📥 RECEPCIÓN DE MENSAJES DE WHATSAPP
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

      // 🔎 buscar cliente por número
      const cliente = CLIENTES[numero];

      if (!cliente) {
        console.log("⛔ Número no registrado:", numero);
        return res.sendStatus(200);
      }

      const hora = new Date().toLocaleString("es-CO", {
        timeZone: "America/Bogota"
      });

      // 🔍 Buscar si el comando existe para ese cliente
      const url = cliente.comandos[textoNormalizado];

      if (!url) {
        console.log("⛔ Comando no permitido para este cliente");
        return res.sendStatus(200);
      }

      console.log(`⚡ Ejecutando ${textoNormalizado} para ${cliente.nombre}`);

      // 🚀 Ejecutar acción en IFTTT / dispositivo
      await axios.get(url);

      /* ===============================
         🧠 MENSAJE SEGÚN COMANDO
      =============================== */

      let titulo = "";

      switch (textoNormalizado) {
        case "#EMERGENCIA":
          titulo = "🚨 ALERTA DE EMERGENCIA";
          break;
        case "#APAGAR":
          titulo = "🛑 SIRENA APAGADA";
          break;
        case "#ENCENDER":
          titulo = "💡 LUZ ENCENDIDA";
          break;
        case "#APAGADO":
          titulo = "💡 LUZ APAGADA";
          break;
        default:
          titulo = "🔔 EVENTO EJECUTADO";
      }

      const mensajeFinal =
        `${titulo}\n\n` +
        `Cliente: ${cliente.nombre}\n` +
        `Número: ${numero}\n` +
        `Fecha y Hora: ${hora}\n\n` +
        `Sistema KAS SECURITY`;

      // 📲 Enviar alerta a todos los administradores
      for (const admin of ADMIN_NUMEROS) {
        await enviarMensaje(admin, mensajeFinal);
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
