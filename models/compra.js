const mongoose = require("mongoose");

const compraSchema = new mongoose.Schema({
    numeroOrden: { type: Number, required: true, unique: true }, // Número de orden
    comprador: { type: String, required: true },
    evento: { type: String, required: true },
    precio: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
    qrPath: { type: String, required: true } // Ruta del archivo QR
});

const Compra = mongoose.model("Compra", compraSchema);

module.exports = Compra;
