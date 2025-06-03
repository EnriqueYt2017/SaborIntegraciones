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
    const [esCliente, setEsCliente] = useState(false);
    const [totalSinDescuento, setTotalSinDescuento] = useState(0);

    const params = new URLSearchParams(location.search);
    const token_ws = params.get("token_ws");

    // Calcula el total con descuento igual que en el carrito
    const totalConDescuento = esCliente
        ? parseFloat((totalSinDescuento * 0.8).toFixed(2))
        : totalSinDescuento;

    // ...existing code...
    useEffect(() => {
        async function confirmarPago() {
            if (!token_ws) {
                setEstado("rechazo");
                return;
            }
            try {
                // Recupera datos del usuario para guardar el pedido
                const userData = localStorage.getItem("user");
                let usuarioData = null;
                if (userData) {
                    usuarioData = JSON.parse(userData);
                    setUsuario(usuarioData);
                }

                // Recupera dirección y observaciones si las tienes en localStorage o ajusta según tu flujo
                const direccion = usuarioData?.direccion || "";
                const observaciones = ""; // Puedes obtenerlo de otro lado si lo tienes

                // --- ARREGLO: recalcula total si es 0 ---
                let totalSinDesc = Number(localStorage.getItem("totalSinDescuento") || 0);
                let carrito = JSON.parse(localStorage.getItem("carrito_backup")) || [];
                if (!totalSinDesc && carrito.length > 0) {
                    totalSinDesc = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
                    setTotalSinDescuento(totalSinDesc);
                }

                const esClienteFlag = localStorage.getItem("esCliente") === "true";
                const totalConDesc = esClienteFlag
                    ? parseFloat((totalSinDesc * 0.8).toFixed(2))
                    : totalSinDesc;

                // Llama al backend para confirmar el pago y guardar el pedido
                const res = await axios.post("http://localhost:5000/webpay/commit", {
                    token_ws,
                    rut: usuarioData?.rut,
                    direccion: usuarioData?.direccion,
                    observaciones: "",
                    total: totalConDesc,
                    carrito
                });

                if (res.data.status === "AUTHORIZED") {
                    setEstado("exito");
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
        setEsCliente(localStorage.getItem("esCliente") === "true");
        setTotalSinDescuento(Number(localStorage.getItem("totalSinDescuento") || 0));
        localStorage.setItem("carrito_backup", localStorage.getItem("carrito"));
        confirmarPago();
    }, [token_ws]);
    // ...existing code...

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
        const doc = new jsPDF("p", "mm", "a4");

        // Paleta de colores
        const primary = [67, 233, 123];
        const accent = [56, 249, 215];
        const gray = [100, 100, 100];
        const lightGray = [230, 247, 250];

        // Fondo degradado superior
        doc.setFillColor(...primary);
        doc.rect(0, 0, 210, 40, "F");

        // Logo centrado
        doc.addImage(logo, "PNG", 85, 10, 40, 20);

        // Título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text("Voucher de Compra", 105, 35, { align: "center" });

        // Caja principal
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, 45, 180, 220, 8, 8, "F");

        let y = 55;

        // Datos principales
        doc.setFontSize(12);
        doc.setTextColor(...primary);
        doc.text(`Orden:`, 25, y);
        doc.setTextColor(0, 0, 0);
        doc.text(`${detalle.buy_order || detalle.buyOrder}`, 50, y);
        doc.setTextColor(...primary);
        doc.text(`Fecha:`, 120, y);
        doc.setTextColor(0, 0, 0);
        doc.text(`${new Date().toLocaleString()}`, 140, y);
        y += 8;

        // Línea divisoria
        doc.setDrawColor(...primary);
        doc.setLineWidth(0.5);
        doc.line(25, y, 185, y);
        y += 6;

        // Datos usuario
        if (usuario) {
            doc.setFontSize(11);
            doc.setTextColor(...gray);
            doc.text(`Cliente:`, 25, y);
            doc.setTextColor(0, 0, 0);
            doc.text(`${usuario.primer_nombre} ${usuario.primer_apellido}`, 50, y);
            y += 6;
            doc.setTextColor(...gray);
            doc.text(`RUT:`, 25, y);
            doc.setTextColor(0, 0, 0);
            doc.text(`${usuario.rut}-${usuario.dvrut}`, 50, y);
            y += 6;
            doc.setTextColor(...gray);
            doc.text(`Email:`, 25, y);
            doc.setTextColor(0, 0, 0);
            doc.text(`${usuario.correo}`, 50, y);
            y += 6;
            doc.setTextColor(...gray);
            doc.text(`Dirección:`, 25, y);
            doc.setTextColor(0, 0, 0);
            doc.text(`${usuario.direccion}`, 50, y);
            y += 8;
        }

        // Línea divisoria
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.2);
        doc.line(25, y, 185, y);
        y += 7;

        // Detalles extra
        doc.setFontSize(10);
        extraDetails.forEach((d, i) => {
            doc.setTextColor(...gray);
            doc.text(`${d.label}:`, 25, y);
            doc.setTextColor(0, 0, 0);
            doc.text(String(d.value), 60, y);
            y += 6;
        });

        y += 2;

        // Tabla productos
        doc.setFillColor(...lightGray);
        doc.roundedRect(25, y, 160, 8, 2, 2, "F");
        doc.setFontSize(11);
        doc.setTextColor(...primary);
        doc.text("Producto", 28, y + 6);
        doc.text("Cant.", 98, y + 6, { align: "right" });
        doc.text("Precio", 128, y + 6, { align: "right" });
        doc.text("Subtotal", 182, y + 6, { align: "right" });
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        detalle.carrito.forEach(item => {
            doc.text(item.nombre, 28, y);
            doc.text(String(item.cantidad), 98, y, { align: "right" });
            doc.text(`$${item.precio}`, 128, y, { align: "right" });
            doc.text(`$${item.precio * item.cantidad}`, 182, y, { align: "right" });
            y += 6;
        });

        // Línea divisoria
        y += 2;
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.2);
        doc.line(25, y, 185, y);
        y += 7;

        // Descuento y totales
        doc.setFontSize(11);
        // Descuento y totales
        y += 10;
        if (esCliente) {
            doc.setFontSize(12);
            doc.setTextColor(67, 233, 123);
            doc.text("¡Cliente registrado! 20% de descuento aplicado.", 20, y);
            y += 7;
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Monto sin descuento: $${totalSinDescuento}`, 20, y);
            y += 6;
            doc.text(`Monto con descuento: $${totalConDescuento}`, 20, y);
            y += 8;
            doc.setFontSize(15);
            doc.setTextColor(67, 233, 123);
            doc.text(`Total a pagar: $${totalConDescuento}`, 20, y);
            y += 10;
        } else {
            doc.setFontSize(12);
            doc.setTextColor(231, 76, 60);
            doc.text("No aplica descuento", 20, y);
            y += 10;
        }

        // Código de autorización
        doc.setFontSize(10);
        doc.setTextColor(...gray);
        doc.text("Código de autorización:", 25, y);
        doc.setTextColor(0, 0, 0);
        doc.text(`${detalle.authorization_code || detalle.authorizationCode || "No disponible"}`, 70, y);
        y += 8;

        // Mensaje final
        doc.setFontSize(11);
        doc.setTextColor(...primary);
        doc.text("¡Gracias por tu compra en SportFit!", 25, y);

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("SportFit - www.SportFit.cl", 25, 270);

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
                {/* Bloque de descuento y totales */}
                <div style={{ marginBottom: 12 }}>
                    {esCliente ? (
                        <>
                            <div style={{ color: "#43e97b", fontSize: 14, marginBottom: 4 }}>
                                ¡Cliente registrado! 20% de descuento aplicado.
                            </div>
                            <div style={{ fontSize: 13, color: "#888" }}>
                                Monto sin descuento: <b>${totalSinDescuento}</b>
                            </div>
                            <div style={{ fontSize: 13, color: "#888" }}>
                                Monto con descuento: <b>${totalConDescuento}</b>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 18, color: "#43e97b", marginTop: 6 }}>
                                Total a pagar: ${totalConDescuento}
                            </div>
                        </>
                    ) : (
                        <div style={{ color: "#e74c3c", fontSize: 13 }}>
                            No aplica descuento
                        </div>
                    )}
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