/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { FaUserCircle, FaPaperPlane } from "react-icons/fa";

const API_URL = "http://localhost:5000/api/foro-entrenamiento"; // Debes crear este endpoint en tu backend

const rolesPermitidos = [1, 2, 6]; // Cliente, Preparador Físico, Admin

const ForoEntrenamiento = () => {
    const [user, setUser] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [alerta, setAlerta] = useState({ tipo: "", mensaje: "" });
    const [loading, setLoading] = useState(true);
    const chatRef = useRef(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchMensajes();
        // Opcional: auto-refresh cada 20s
        const interval = setInterval(fetchMensajes, 20000);
        return () => clearInterval(interval);
    }, []);

    const fetchMensajes = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            setMensajes(data);
        } catch (err) {
            setAlerta({ tipo: "error", mensaje: "No se pudieron cargar los mensajes." });
        } finally {
            setLoading(false);
            setTimeout(() => setAlerta({ tipo: "", mensaje: "" }), 3000);
        }
    };

    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) {
            setAlerta({ tipo: "error", mensaje: "El mensaje no puede estar vacío." });
            setTimeout(() => setAlerta({ tipo: "", mensaje: "" }), 2500);
            return;
        }
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rut: user?.rut || user?.RUT,
                    nombre: user?.primer_nombre || "Usuario",
                    rol: user?.id_rol,
                    mensaje: nuevoMensaje
                })
            });
            if (!res.ok) throw new Error("Error al enviar mensaje");
            setNuevoMensaje("");
            setAlerta({ tipo: "success", mensaje: "Mensaje enviado" });
            fetchMensajes();
        } catch {
            setAlerta({ tipo: "error", mensaje: "No se pudo enviar el mensaje." });
        } finally {
            setTimeout(() => setAlerta({ tipo: "", mensaje: "" }), 2500);
        }
    };

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [mensajes]);

    const puedeEscribir = user && rolesPermitidos.includes(user.id_rol);

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
            fontFamily: "Inter, sans-serif",
            padding: 0,
            margin: 0
        }}>
            <div style={{
                maxWidth: 700,
                margin: "40px auto",
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 2px 16px #43e97b22",
                border: "1px solid #e0f7e9",
                overflow: "hidden"
            }}>
                <div style={{
                    background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                    padding: "32px 0 18px 0",
                    textAlign: "center"
                }}>
                    <h2 style={{
                        color: "#fff",
                        fontWeight: 800,
                        letterSpacing: 1,
                        fontSize: 28,
                        margin: 0
                    }}>Foro de Entrenamiento</h2>
                    <p style={{ color: "#e0ffe7", marginTop: 8, fontWeight: 500, fontSize: 15 }}>
                        Comunícate con tu preparador físico o clientes. ¡Comparte dudas, avances y motivación!
                    </p>
                </div>
                {alerta.mensaje && (
                    <div style={{
                        background: alerta.tipo === "success" ? "#e0ffe7" : "#ffe0e0",
                        color: alerta.tipo === "success" ? "#22c55e" : "#e53935",
                        padding: "12px 18px",
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: 15
                    }}>
                        {alerta.mensaje}
                    </div>
                )}
                <div ref={chatRef} style={{
                    maxHeight: 420,
                    overflowY: "auto",
                    padding: "24px 18px 12px 18px",
                    background: "#f8fff8"
                }}>
                    {loading ? (
                        <div style={{ color: "#888", textAlign: "center", margin: 30 }}>Cargando mensajes...</div>
                    ) : mensajes.length === 0 ? (
                        <div style={{ color: "#888", textAlign: "center", margin: 30 }}>No hay mensajes aún.</div>
                    ) : (
                        mensajes.map(msg => (
                            <div key={msg.id_foro || msg.fecha_publicacion}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    marginBottom: 18,
                                    background: "#fff",
                                    borderRadius: 10,
                                    boxShadow: "0 2px 8px #43e97b11",
                                    padding: "10px 14px"
                                }}>
                                <FaUserCircle size={34} color={msg.rol === 2 ? "#38b6ff" : "#43e97b"} style={{ marginRight: 12 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: "#43e97b", fontSize: 15 }}>
                                        {msg.nombre} <span style={{
                                            fontWeight: 500,
                                            color: "#888",
                                            fontSize: 13,
                                            marginLeft: 6
                                        }}>
                                            {msg.rol === 2 ? "Preparador Físico" : msg.rol === 1 ? "Cliente" : "Admin"}
                                        </span>
                                    </div>
                                    <div style={{ color: "#444", fontSize: 15, margin: "2px 0 0 0" }}>{msg.mensaje}</div>
                                    <div style={{ color: "#bbb", fontSize: 12, marginTop: 2 }}>
                                        {new Date(msg.fecha_publicacion).toLocaleString("es-CL")}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {puedeEscribir ? (
                    <form onSubmit={handleEnviar} style={{
                        display: "flex",
                        borderTop: "1px solid #e0f7e9",
                        background: "#f8fff8",
                        padding: "18px 18px"
                    }}>
                        <input
                            type="text"
                            placeholder="Escribe tu mensaje..."
                            value={nuevoMensaje}
                            onChange={e => setNuevoMensaje(e.target.value)}
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                border: "1.5px solid #43e97b",
                                borderRadius: 8,
                                fontSize: 16,
                                outline: "none",
                                marginRight: 12,
                                background: "#fff"
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "0 22px",
                                fontWeight: 700,
                                fontSize: 18,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <FaPaperPlane style={{ marginRight: 6 }} /> Enviar
                        </button>
                    </form>
                ) : (
                    <div style={{
                        background: "#fffbe0",
                        color: "#bfa100",
                        textAlign: "center",
                        padding: "14px 0",
                        fontWeight: 600,
                        fontSize: 15,
                        borderTop: "1px solid #e0f7e9"
                    }}>
                        Solo clientes y preparadores físicos pueden escribir en este foro.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForoEntrenamiento;