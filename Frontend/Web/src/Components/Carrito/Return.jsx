/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import logo from "../../assets/icono-logo.png";

function Return() {
    const navigate = useNavigate();
    const location = useLocation();
    const [estado, setEstado] = useState("cargando");
    const [detalle, setDetalle] = useState(null);
    const [usuario, setUsuario] = useState(null);

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
                if (res.data.status === "AUTHORIZED") {
                    setEstado("exito");
                    const carrito = JSON.parse(localStorage.getItem("carrito_backup")) || [];
                    setDetalle({
                        ...res.data,
                        carrito
                    });
                    localStorage.setItem("carrito", JSON.stringify([]));
                } else {
                    setEstado("rechazo");
                }
            } catch (error) {
                setEstado("rechazo");
            }
        }
        const userData = localStorage.getItem("user");
        if (userData) {
            setUsuario(JSON.parse(userData));
        }
        localStorage.setItem("carrito_backup", localStorage.getItem("carrito"));
        confirmarPago();
    }, [token_ws]);

    // Detalles extra para mostrar en voucher
const extraDetails = detalle
    ? [
        { label: "Usuario", value: usuario?.primer_nombre || "No disponible" },
        { label: "Email", value: usuario?.correo || "No disponible" },
        { label: "Método de Pago", value: detalle.paymentType || "Webpay" },
        { label: "Autorización", value: detalle.authorization_code || detalle.authorizationCode || "No disponible" },
        { label: "Tarjeta", value: detalle.card_detail?.card_number || detalle.cardNumber || "**** **** ****" },
        { label: "Comercio", value: detalle.commerce_code || detalle.commerceCode || "SportFit" }
    ]
    : [];

    // Función para descargar el voucher en PDF
    const descargarPDF = () => {
        if (!detalle) return;
        const doc = new jsPDF();

        // Fondo
        doc.setFillColor(67, 233, 123);
        doc.rect(0, 0, 210, 297, "F");

        // Logo
        doc.addImage(logo, 'PNG', 10, 10, 40, 20);

        // Título
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("Voucher de Compra", 60, 25);

        // Caja blanca
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(10, 35, 190, 230, 8, 8, "F");

        // Datos principales
        doc.setFontSize(14);
        doc.setTextColor(67, 233, 123);
        doc.text(`Orden: ${detalle.buy_order || detalle.buyOrder}`, 20, 50);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 60);

        // Detalles extra
        let y = 70;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        extraDetails.forEach((d, i) => {
            doc.text(`${d.label}:`, 20, y + i * 7);
            doc.text(String(d.value), 60, y + i * 7);
        });
        y += extraDetails.length * 7 + 5;

        // Tabla de productos
        doc.setFontSize(13);
        doc.setTextColor(67, 233, 123);
        doc.text("Producto", 20, y);
        doc.text("Cant.", 90, y);
        doc.text("Precio", 120, y);
        doc.text("Subtotal", 160, y);
        y += 7;
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        y += 7;

        doc.setTextColor(0, 0, 0);
        detalle.carrito.forEach(item => {
            doc.text(item.nombre, 20, y);
            doc.text(String(item.cantidad), 95, y, { align: "right" });
            doc.text(`$${item.precio}`, 120, y);
            doc.text(`$${item.precio * item.cantidad}`, 160, y);
            y += 8;
        });

        // Total
        y += 10;
        doc.setFontSize(16);
        doc.setTextColor(67, 233, 123);
        doc.text(`Total: $${detalle.carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}`, 20, y);

        // Mensaje final
        y += 15;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("¡Gracias por tu compra!", 20, y);

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("SportFit - www.SportFit.cl", 20, 285);

        doc.save(`${detalle.buy_order || detalle.buyOrder}.pdf`);
    };

    // Diseño atractivo para el voucher
    const voucherStyle = {
        background: "linear-gradient(120deg, #f8fff8 0%, #e0f7fa 100%)",
        borderRadius: 16,
        boxShadow: "0 4px 24px #43e97b33",
        padding: 32,
        maxWidth: 540,
        margin: "40px auto",
        fontFamily: "Segoe UI, sans-serif",
        color: "#222"
    };

    const detailBox = {
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px #43e97b22",
        padding: 20,
        marginBottom: 24
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
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <img src={logo} alt="Logo" style={{ width: 60, marginRight: 16 }} />
                <div>
                    <h2 style={{ color: "#43e97b", margin: 0 }}>¡Pago Exitoso!</h2>
                    <span style={{ color: "#888" }}>Tu compra fue procesada correctamente.</span>
                </div>
            </div>
            <div style={detailBox}>
                <h3 style={{ marginTop: 0, color: "#43e97b" }}>Voucher de Compra</h3>
                <div style={{ margin: "12px 0 18px 0" }}>
                    <b>Orden:</b> {detalle.buy_order || detalle.buyOrder}<br />
                    <b>Fecha:</b> {new Date().toLocaleString()}
                </div>
                {/* Datos del usuario */}
                {usuario && (
                    <div style={{ marginBottom: 18 }}>
                        <div><b>Cliente:</b> {usuario.primer_nombre} {usuario.primer_apellido}</div>
                        <div><b>RUT:</b> {usuario.rut}-{usuario.dvrut}</div>
                        <div><b>Email:</b> {usuario.correo}</div>
                        <div><b>Dirección:</b> {usuario.direccion}</div>
                    </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 18 }}>
                    {extraDetails.map(d => (
                        <div key={d.label} style={{ minWidth: 180 }}>
                            <span style={{ color: "#888" }}>{d.label}:</span><br />
                            <b>{d.value}</b>
                        </div>
                    ))}
                </div>
                <table style={{ width: "100%", marginBottom: 18, borderCollapse: "collapse", fontSize: 15 }}>
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
                <div style={{ fontWeight: 700, fontSize: 18, color: "#43e97b", marginBottom: 8 }}>
                    Total: ${detalle.carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}
                </div>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
                    Código de autorización: <b>{detalle.authorization_code || detalle.authorizationCode || "No disponible"}</b>
                </div>
                <div style={{ color: "#888", fontSize: 13 }}>
                    ¡Gracias por tu compra en <b>SportFit</b>!
                </div>
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