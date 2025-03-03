const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const QRCode = require("qrcode");
const path = require("path");

dotenv.config(); // Cargar variables de entorno

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Servir imágenes estáticas

// Conectar a MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

// Rutas básicas
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

app.get("/comprar", (req, res) => {
  res.send("Página de compras en construcción");
});

// Configuración de `multer` para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes JPG y PNG"));
  },
});

// Ruta para subir imágenes
app.post("/subir-imagen", (req, res, next) => {
  upload.single("imagen")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se ha subido ninguna imagen" });
    }
    res.json({ mensaje: "Imagen subida con éxito", archivo: `/uploads/${req.file.filename}` });
  });
});

// Ruta para generar códigos QR
app.post("/generar-qr", async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto) return res.status(400).json({ error: "Texto requerido" });

    const qrDataURL = await QRCode.toDataURL(texto);
    res.json({ qr: qrDataURL });
  } catch (error) {
    console.error("Error generando QR:", error);
    res.status(500).json({ error: "Error interno al generar el QR" });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
