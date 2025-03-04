function comprarEntrada(evento, precio, boton) {
    if (!boton) {
        console.error("Error: el botón no está definido.");
        return;
    }

    // Cambiar color del botón para indicar que está en proceso
    boton.style.backgroundColor = "green";
    boton.innerText = "Procesando...";

    const comprador = prompt("Ingresa tu nombre para la compra:");

    if (!comprador) {
        alert("Debes ingresar tu nombre para continuar.");
        boton.style.backgroundColor = "blue";
        boton.innerText = "Comprar";
        return;
    }

    fetch("http://localhost:5000/comprar-entrada", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ comprador, evento, precio })
    })
    .then(response => response.json())
    .then(data => {
        alert("Compra realizada con éxito. QR generado en el servidor.");
        boton.style.backgroundColor = "gray"; 
        boton.innerText = "Comprado"; 
        
        // Abrir nueva ventana con la información del evento
        window.open(`detalle.html?evento=${encodeURIComponent(evento)}&precio=${precio}&comprador=${encodeURIComponent(comprador)}`, "_blank");
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Hubo un problema con la compra.");
        boton.style.backgroundColor = "red";
        boton.innerText = "Error";
    });
}
