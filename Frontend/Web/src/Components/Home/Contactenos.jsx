/* eslint-disable no-unused-vars */
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Imagelogo from '../../assets/icono-logo.png';
const backgroundStyle = {

    minHeight: "100vh",
    background: "linear-gradient(120deg,rgb(101, 246, 145) 0%,rgb(133, 243, 253) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Montserrat', sans-serif",
};

const cardStyle = {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "24px",
    boxShadow: "0 8px 32px rgba(30, 77, 55, 0.25)",
    padding: "48px 36px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
};

const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    margin: "12px 0",
    borderRadius: "8px",
    border: "1px solidrgb(159, 252, 182)",
    fontSize: "1rem",
    outline: "none",
    transition: "border 0.2s",
};

const buttonStyle = {
    background: "linear-gradient(120deg,rgb(101, 246, 145) 0%,rgb(133, 243, 253) 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "14px 0",
    width: "100%",
    fontWeight: "bold",
    fontSize: "1.1rem",
    cursor: "pointer",
    marginTop: "18px",
    boxShadow: "0 4px 16px rgba(252,182,159,0.15)",
    transition: "background 0.2s",
};

function Contactenos() {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [enviado, setEnviado] = useState(false);
    const [numeroSolicitud, setNumeroSolicitud] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData && userData !== "undefined" && userData !== "{}" && userData !== "null") {
            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && Object.keys(parsedUser).length > 0) {
                    setUser(parsedUser);
                } else {
                    navigate("/login");
                }
            } catch (error) {
                console.error("Error al parsear usuario:", error);
                navigate("/login");
            }
        }
    }, [navigate]);

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/contactenos", {
                nombre,
                correo,
                mensaje
            });
            setNumeroSolicitud(res.data.numeroSolicitud);
            setEnviado(true);
            setNombre("");
            setCorreo("");
            setMensaje("");
        } catch (err) {
            alert("No se pudo enviar el mensaje. Intenta nuevamente.");
        }
    };
    return (
        <div>
            {/*Navbar */}
            <div className="containers">
                <nav id="navbar-e" className="navbar bg-body-tertiary px-3">
                    <a href="/carrito" className="navbar-brand">
                        <img src={Imagelogo} alt="Logo" className="estilo-logo" />
                    </a>
                    <ul className="nav nav-pills">
                        {user ? (
                            <li className="nav-item dropdown">
                                <button
                                    className="nav-link btn dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    style={{ color: "#fff" }}
                                    onClick={() => setMenuVisible(!menuVisible)}
                                >
                                    {(user.primer_nombre || "Usuario").toUpperCase()}
                                </button>
                                <ul className={`dropdown-menu${menuVisible ? " show" : ""}`}>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => navigate("/Perfil")}
                                        >
                                            Ver perfil
                                        </button>
                                    </li>
                                    <li>
                                        <a href="#" className="dropdown-item">Ver más</a>
                                    </li>
                                    <li>
                                        <button onClick={cerrarSesion} className="dropdown-item">Cerrar sesión</button>
                                    </li>
                                </ul>
                            </li>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <button
                                        className="nav-link btn"
                                        style={{ color: "#fff" }}
                                        onClick={() => navigate("/login")}
                                    >
                                        Iniciar sesión
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className="nav-link btn"
                                        style={{ color: "#fff" }}
                                        onClick={() => navigate("/register")}
                                    >
                                        Registrarse
                                    </button>
                                </li>
                            </>
                        )}
                        <li className="nav-item">
                            <a href="/carrito" className="nav-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cart" viewBox="0 0 16 16">
                                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                                </svg>
                            </a>
                        </li>
                        <li className="nav-item"><a href="/Home" className="nav-link">Inicio</a></li>
                        <li className="nav-item"><a href="/productos" className="nav-link">Productos</a></li>
                        <li className="nav-item"><a href="/servicios" className="nav-link">Servicios</a></li>
                        <li className="nav-item"><a href="/reserva" className="nav-link">Reservas</a></li>
                        <li className="nav-item"><a href="/contactenos" className="nav-link">Contáctenos</a></li>
                    </ul>
                </nav>
            </div>
            {/* Contenido  */}
            <div style={{ ...backgroundStyle, justifyContent: "center" }}>
                <div style={{
                    display: "flex",
                    gap: "40px",
                    width: "100%",
                    maxWidth: "1100px",
                    justifyContent: "center",
                    alignItems: "stretch"
                }}>
                    {/* Formulario */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                        <div style={cardStyle}>
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
                                alt="Contáctenos"
                                style={{ width: 80, marginBottom: 16 }}
                            />
                            <h2 style={{ color: "#fcb69f", marginBottom: 8 }}>¡Contáctanos!</h2>
                            <p style={{ color: "#7a5c4f", marginBottom: 24 }}>
                                ¿Tienes alguna pregunta, sugerencia o quieres colaborar con nosotros? <br />
                                ¡Déjanos tu mensaje y te responderemos pronto!
                            </p>
                            <form onSubmit={handleSubmit}>
                                <input
                                    style={inputStyle}
                                    type="text"
                                    placeholder="Nombre"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    required
                                />
                                <input
                                    style={inputStyle}
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={correo}
                                    onChange={e => setCorreo(e.target.value)}
                                    required
                                />
                                <textarea
                                    style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                                    placeholder="Tu mensaje"
                                    value={mensaje}
                                    onChange={e => setMensaje(e.target.value)}
                                    required
                                />
                                <button type="submit" style={buttonStyle}>
                                    Enviar mensaje
                                </button>
                            </form>
                            {enviado && (
                                <div style={{ color: "#43e97b", marginTop: 16 }}>
                                    ¡Mensaje enviado! Tu número de solicitud es <b>{numeroSolicitud}</b>. Revisa tu correo.
                                </div>
                            )}
                        </div>
                    </div>
                    { /* Mapa */}
                    <div style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <div style={{
                            background: "rgba(255,255,255,0.95)",
                            borderRadius: "24px",
                            boxShadow: "0 8px 32px rgba(30, 77, 55, 0.25)",
                            padding: "24px",
                            width: "100%",
                            maxWidth: "420px",
                            minHeight: "400px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}>
                            <h3 style={{ color: "#65f691", marginBottom: 16 }}>Nuestra ubicación</h3>
                            {/* Mapa con marcador */}
                            <div style={{ width: "100%", height: 320, borderRadius: "16px", overflow: "hidden", marginBottom: 8 }}>
                                <iframe
                                    title="Mapa DuocUC Puente Alto"
                                    width="100%"
                                    height="320"
                                    style={{ border: 0, borderRadius: "16px" }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src="https://www.google.com/maps?q=Avenida+Concha+Y+Toro,+Av.+San+Carlos+1340,+Puente+Alto,+Regi%C3%B3n+Metropolitana,+Chile&z=17&output=embed"
                                ></iframe>
                            </div>
                            <div style={{ marginTop: 12, color: "#7a5c4f", fontSize: "0.95rem" }}>
                                Avenida Concha Y Toro, Av. San Carlos 1340, Puente Alto, Región Metropolitana, Chile
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <footer style={{
                background: "#212529",
                color: "#fff",
                textAlign: "center",
                padding: "1.2rem 0",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                fontSize: "1rem"
            }}>
                © {new Date().getFullYear()} Sabor Integraciones. Todos los derechos reservados.
            </footer>
        </div>
    );
};

export default Contactenos;