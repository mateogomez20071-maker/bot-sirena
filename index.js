const express = require("express");
const axios = require("axios");
const app = express();

//saber quien
let ultimaActivacion = null;

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
        
        ultimaActivacion = {
        numero: numero,
        fecha: new Date().toLocaleString()
      };

        await axios.get("https://maker.ifttt.com/trigger/emergencia2/with/key/ivVS-BxbsnXnCFQxRK-rYyVbBEPRxtazsVIaZFl1WCc");

      } 
        else if (textoNormalizado === "#EMERGENCIA" && !autorizado) {
        console.log("⛔ Intento NO autorizado desde:", numero);
      }

            if (textoNormalizado === "#QUIEN") {
      
        if (ultimaActivacion) {
          console.log("📋 Consulta de última activación");
      
          const respuesta = `📋 Última activación:\nNúmero: ${ultimaActivacion.numero}\nHora: ${ultimaActivacion.fecha}`;

          const PHONE_NUMBER_ID = "996743346852082";
          const TOKEN = "EAANHyn3VcmUBQZBryRJeSVgWpCGvMGYUR6tA5rqLGNRYfL6wJssdPTGLaAEBJSM9UkkbOcAZAwXlZCZBvWKKsWAKoS7f3jZCd9hAeIZB1xJUpsZBJksYZCzBXeUDBGGHcO1VWtqm1bhdsszM8phZBtWLIhPM750v0bN08S8i85V9o0DCG6x30c5r4BcBL6JsCTE8wIyLtZBvSJtI7rqv0ZC6I8iALLNvm834b0ZCJ3JhZAh1WoNjJHsWGydogpB1Cm9BsN6SZA93fQameiA2Y0iIdEOwv9";
      
          await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
              messaging_product: "whatsapp",
              to: numero,
              text: { body: respuesta }
            },
            {
              headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          );
      
        } else {
          const respuesta = "⚠️ Aún no se ha activado la sirena.";
      
          await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
              messaging_product: "whatsapp",
              to: numero,
              text: { body: respuesta }
            },
            {
              headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          );
        }
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





