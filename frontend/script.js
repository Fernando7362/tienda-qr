function comprarEntrada(evento, precio, boton) {
    if (!boton) {
        console.error("Error: el botón no está definido.");
        return;
    }

    // Cambiar color del botón para indicar que está en proceso
    boton.style.backgroundColor = "green";
    boton.innerText = "Procesando...";

    const comprador = prompt("Ingresa tu nombre para la compra:");
    const cantidad = document.getElementById("cantidad") ? document.getElementById("cantidad").value : 1;

    if (!comprador || cantidad <= 0) {
        alert("Debes ingresar tu nombre y una cantidad válida.");
        boton.style.backgroundColor = "blue";
        boton.innerText = "Comprar";
        return;
    }

    fetch("http://localhost:5000/comprar-entrada", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ comprador, evento, precio, cantidad })
    })
    .then(response => response.json())
    .then(data => {
        if (data.mensaje) {
            alert(`✅ Compra realizada con éxito.\nNúmero de orden: ${data.numeroOrden}`);
            boton.style.backgroundColor = "gray"; 
            boton.innerText = "Comprado"; 
            
            // ❌ Eliminar la redirección automática al historial si no quieres mostrarlo al comprador
            // window.location.href = "historial.html";  
        } else {
            alert("❌ Hubo un problema con la compra.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("❌ Hubo un problema con la compra.");
        boton.style.backgroundColor = "red";
        boton.innerText = "Error";
    });
}
