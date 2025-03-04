const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const Compra = require("./models/compra"); // Importar el modelo Compra

dotenv.config(); // Cargar variables de entorno

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 📌 Asegurar que las carpetas necesarias existen
const uploadsPath = path.join(__dirname, "uploads");
const qrsPath = path.join(__dirname, "qrs");

if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);
if (!fs.existsSync(qrsPath)) fs.mkdirSync(qrsPath);

// 📌 Servir archivos estáticos
app.use("/uploads", express.static(uploadsPath)); // Servir imágenes subidas
app.use("/qrs", express.static(qrsPath));

// 📌 Conectar a MongoDB
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Conectado a MongoDB Atlas"))
.catch(err => console.error("❌ Error al conectar a MongoDB:", err));

// 📌 Rutas básicas
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

// 📌 Ruta para comprar entrada y generar QR en el backend
app.post("/comprar-entrada", async (req, res) => {
  try {
    const { comprador, evento, precio, cantidad } = req.body;

    if (!comprador || !evento || !precio || !cantidad || cantidad <= 0) {
      return res.status(400).json({ error: "Todos los datos son requeridos y la cantidad debe ser mayor a 0" });
    }

    // 📌 Obtener la fecha actual en formato YYYY-MM-DD
    const fechaActual = new Date();
    const fechaCarpeta = fechaActual.toISOString().split("T")[0]; // Formato: 2024-03-03

    // 📌 Crear la carpeta del día si no existe
    const fechaPath = path.join(qrsPath, fechaCarpeta);
    if (!fs.existsSync(fechaPath)) fs.mkdirSync(fechaPath);

    // 📌 Obtener el número de orden
    const totalCompras = await Compra.countDocuments();
    const numeroOrden = totalCompras + 1;

    // 📌 Generar datos para el QR
    const qrData = `Orden: ${numeroOrden} | Comprador: ${comprador} | Evento: ${evento} | Precio: $${precio} | Cantidad: ${cantidad}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // 📌 Guardar QR en la carpeta del día
    const qrFilename = `Orden${numeroOrden}_${comprador.replace(/ /g, "_")}.png`;
    const qrPath = path.join(fechaPath, qrFilename);
    const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");

    fs.writeFileSync(qrPath, base64Data, "base64");

    // 📌 Guardar la compra en MongoDB
    const nuevaCompra = new Compra({
      numeroOrden,
      comprador,
      evento,
      precio,
      cantidad,
      qrPath: `/qrs/${fechaCarpeta}/${qrFilename}` // Ruta accesible
    });

    await nuevaCompra.save();

    console.log(`✅ Compra guardada: ${qrPath}`);

    res.json({ 
      mensaje: "Compra registrada con éxito", 
      numeroOrden,
      qr: `/qrs/${fechaCarpeta}/${qrFilename}`
    });
  } catch (error) {
    console.error("❌ Error en compra:", error);
    res.status(500).json({ error: "Error al procesar la compra" });
  }
});

// 📌 Ruta protegida para ver el historial de compras (solo el proveedor)
app.get("/historial", async (req, res) => {
  const claveSecreta = req.query.clave; // Obtener clave de la URL

  if (!claveSecreta || claveSecreta !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Acceso denegado" });
  }

  try {
      const compras = await Compra.find().sort({ numeroOrden: -1 }); // Orden descendente
      res.json(compras);
  } catch (error) {
      console.error("❌ Error al obtener historial:", error);
      res.status(500).json({ error: "Error al obtener historial de compras" });
  }
});

// 📌 Ruta para cancelar una compra
app.delete("/cancelar-compra/:numeroOrden", async (req, res) => {
  try {
      const { numeroOrden } = req.params;
      const compra = await Compra.findOneAndDelete({ numeroOrden });

      if (!compra) {
          return res.status(404).json({ error: "Compra no encontrada" });
      }

      // 📌 Eliminar el archivo QR asociado
      const qrFilePath = path.join(__dirname, compra.qrPath);
      if (fs.existsSync(qrFilePath)) {
          fs.unlinkSync(qrFilePath);
      }

      console.log(`❌ Compra cancelada: ${numeroOrden}`);
      res.json({ mensaje: "Compra cancelada con éxito" });
  } catch (error) {
      console.error("❌ Error al cancelar compra:", error);
      res.status(500).json({ error: "Error al cancelar la compra" });
  }
});

// 📌 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
