/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";

function Return() {
    const navigate = useNavigate();
    const location = useLocation();
    const [estado, setEstado] = useState("cargando"); // "cargando", "exito", "rechazo"
    const [detalle, setDetalle] = useState(null);
    // Obtén el token_ws de la URL
    const params = new URLSearchParams(location.search);
    const token_ws = params.get("token_ws");

    useEffect(() => {
        async function confirmarPago() {
            if (!token_ws) {
                setEstado("rechazo");
                return;
            }
            try {
                const res = await axios.post("http://localhost:5000/webpay/commit", { token_ws });
                // Puedes validar res.data.status === 'AUTHORIZED' o similar
                if (res.data.status === "AUTHORIZED") {
                    setEstado("exito");
                    // Recupera el carrito de localStorage para mostrar el voucher
                    const carrito = JSON.parse(localStorage.getItem("carrito_backup")) || [];
                    setDetalle({
                        ...res.data,
                        carrito
                    });
                    // Limpia el carrito real
                    localStorage.setItem("carrito", JSON.stringify([]));
                } else {
                    setEstado("rechazo");
                }
            } catch (error) {
                setEstado("rechazo");
            }
        }
        // Guarda el carrito antes de pagar (haz esto en tu función pagar del carrito)
        localStorage.setItem("carrito_backup", localStorage.getItem("carrito"));
        confirmarPago();
    }, [token_ws]);

    // Función para descargar el voucher en PDF
// ...existing code...
const descargarPDF = () => {
    if (!detalle) return;
    const doc = new jsPDF();

    // Fondo de color (rectángulo)
    doc.setFillColor(67, 233, 123); // verde claro
    doc.rect(0, 0, 210, 297, "F"); // fondo para A4

    // Logo (opcional, si tienes base64 o URL pública)
    // doc.addImage('data:image/png;base64,...', 'PNG', 150, 10, 40, 20);

    // Título
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Voucher de Compra", 20, 25);

    // Caja blanca para los datos
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(10, 35, 190, 220, 8, 8, "F");

    // Datos principales
    doc.setFontSize(14);
    doc.setTextColor(67, 233, 123);
    doc.text(`Orden: ${detalle.buy_order || detalle.buyOrder}`, 20, 50);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 60);

    // Tabla de productos
    let y = 75;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text("Producto", 20, y);
    doc.text("Cant.", 90, y);
    doc.text("Precio", 120, y);
    doc.text("Subtotal", 160, y);
    y += 7;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 7;

    detalle.carrito.forEach(item => {
        doc.text(item.nombre, 20, y);
        doc.text(String(item.cantidad), 95, y, { align: "right" });
        doc.text(`$${item.precio}`, 120, y);
        doc.text(`$${item.precio * item.cantidad}`, 160, y);
        y += 8;
    });

    // Total destacado
    y += 10;
    doc.setFontSize(16);
    doc.setTextColor(67, 233, 123);
    doc.text(`Total: $${detalle.carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}`, 20, y);

    // Mensaje final
    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("¡Gracias por tu compra!", 20, y);

    doc.save("voucher.pdf");
};

    // Diseño atractivo para el voucher
    const voucherStyle = {
        background: "linear-gradient(120deg, #f8fff8 0%, #e0f7fa 100%)",
        borderRadius: 16,
        boxShadow: "0 4px 24px #43e97b33",
        padding: 32,
        maxWidth: 500,
        margin: "40px auto",
        fontFamily: "Segoe UI, sans-serif",
        color: "#222"
    };

    if (estado === "cargando") {
        return <div style={{ padding: 40, textAlign: "center" }}>Procesando pago...</div>;
    }

    if (estado === "rechazo") {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "#ff5e57" }}>
                <h2>¡Pago Rechazado!</h2>
                <p>La compra no se realizó. Puede que no tengas fondos suficientes o el pago fue cancelado.</p>
                <button onClick={() => navigate("/carrito")}>Volver al carrito</button>
            </div>
        );
    }

    // Éxito
    return (
        <div style={voucherStyle}>
            <h2 style={{ color: "#43e97b" }}>¡Pago Exitoso!</h2>
            <p>Tu compra fue procesada correctamente.</p>
            <h3 style={{ marginTop: 24 }}>Voucher de Compra</h3>
            <div style={{ margin: "24px 0" }}>
                <b>Orden:</b> {detalle.buy_order || detalle.buyOrder}<br />
                <b>Fecha:</b> {new Date().toLocaleString()}
            </div>
            <table style={{ width: "100%", marginBottom: 24, borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#e0f7fa" }}>
                        <th style={{ padding: 8, borderRadius: 4 }}>Producto</th>
                        <th style={{ padding: 8, borderRadius: 4 }}>Cantidad</th>
                        <th style={{ padding: 8, borderRadius: 4 }}>Precio</th>
                        <th style={{ padding: 8, borderRadius: 4 }}>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {detalle.carrito.map(item => (
                        <tr key={item.codigo_producto}>
                            <td style={{ padding: 8 }}>{item.nombre}</td>
                            <td style={{ padding: 8, textAlign: "center" }}>{item.cantidad}</td>
                            <td style={{ padding: 8 }}>${item.precio}</td>
                            <td style={{ padding: 8 }}>${item.precio * item.cantidad}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#43e97b", marginBottom: 24 }}>
                Total: ${detalle.carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}
            </div>
            <button
                onClick={descargarPDF}
                style={{
                    background: "linear-gradient(90deg,#43e97b 0%,#38f9d7 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 32px",
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginRight: 16
                }}
            >
                Descargar Voucher PDF
            </button>
            <button
                onClick={() => navigate("/")}
                style={{
                    background: "#e67e22",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 32px",
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: "pointer"
                }}
            >
                Volver al inicio
            </button>
        </div>
    );
}

export default Return;