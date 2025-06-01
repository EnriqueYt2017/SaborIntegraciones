// eslint-disable-next-line no-unused-vars
import axios from 'axios';
import bannerImg from '../../assets/banner.jpeg';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Imagelogo from '../../assets/icono-logo.png';
function Servicios() {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem("user");

        if (userData && userData !== "undefined" && userData !== "{}" && userData !== "null") {
            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && Object.keys(parsedUser).length > 0) {
                    setUser(parsedUser);
                } else {
                    navigate("/login"); // Redirige si el usuario es inválido
                }
            } catch (error) {
                console.error("Error al parsear usuario:", error);
                navigate("/login"); // Redirige si hay error de parseo
            }
        }
    }, [navigate]);
    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null); // ✅ Limpia el estado
        navigate("/login"); // ✅ Redirige al login
    };


    return (
        <div>
            {/*Navbar */}
            <div className="containers">
                <nav id="navbar-e" className="navbar bg-body-tertiary px-3">
                    <a href="#" className="navbar-brand">
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
                            <a href="carrito" className="nav-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cart" viewBox="0 0 16 16">
                                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                                </svg>
                            </a>
                        </li>
                        <li className="nav-item"><a href="/Home" className="nav-link">Inicio</a></li>
                        <li className="nav-item"><a href="/productos" className="nav-link">Productos</a></li>
                        <li className="nav-item"><a href="#" className="nav-link">Servicios</a></li>
                        <li className="nav-item"><a href="/reserva" className="nav-link">Reservas</a></li>
                        <li className="nav-item"><a href="/contactenos" className="nav-link">Contáctenos</a></li>
                    </ul>
                </nav>
            </div>
            <div
                style={{
                    maxWidth: 1100,
                    margin: '0 auto',
                    padding: 32,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
                    borderRadius: 24,
                    boxShadow: '0 8px 32px rgba(60, 60, 120, 0.12)',
                }}
            >
                {/* Banner con título */}
                <div
                    style={{
                        width: "100%",
                        minHeight: "320px",
                        backgroundImage: `url(${bannerImg})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        padding: "3rem 1rem",
                        marginBottom: "2rem",
                        boxShadow: "0 4px 24px #007bff22",
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 18,
                    }}
                >
                    <h2
                        style={{
                            textAlign: 'center',
                            fontWeight: 900,
                            fontSize: 38,
                            letterSpacing: 1,
                            color: '#fff',
                            textShadow: '0 2px 8px #263159cc, 0 4px 24px #26315999',
                            margin: 0,
                            background: 'rgba(38,49,89,0.35)',
                            borderRadius: 12,
                            padding: '1rem 2rem',
                        }}
                    >
                        Nuestros Servicios Personalizados
                    </h2>
                </div>

                {/* Planes */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: 18,
                        padding: 32,
                        marginBottom: 48,
                        boxShadow: '0 4px 24px rgba(33, 150, 243, 0.08)',
                        gap: 40,
                    }}
                >

                    {/* Planes */}
                    <div style={{ display: 'flex', flex: 1, gap: 40 }}>
                        {/* Plan Nutrición */}
                        <div
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                background: 'linear-gradient(120deg, #e8f5e9 60%, #c8e6c9 100%)',
                                borderRadius: 14,
                                padding: 28,
                                boxShadow: '0 2px 12px #a5d6a7aa',
                                transition: 'transform 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 22,
                                    marginBottom: 12,
                                    color: '#388e3c',
                                    letterSpacing: 0.5,
                                }}
                            >
                                Planes de Nutrición
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=100&q=80"
                                alt="Plan de Nutrición"
                                style={{
                                    width: 110,
                                    height: 110,
                                    objectFit: 'cover',
                                    marginBottom: 18,
                                    borderRadius: 10,
                                    border: '3px solid #fff',
                                    boxShadow: '0 2px 8px #66bb6a55',
                                }}
                            />
                            <p style={{ color: '#388e3c', fontSize: 15, marginBottom: 18 }}>
                                Asesoría profesional y planes personalizados para tu bienestar.
                            </p>
                            <button
                                style={{
                                    padding: '12px 28px',
                                    background: 'linear-gradient(90deg, #43ea7f 0%, #4caf50 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    boxShadow: '0 2px 8px #43ea7f33',
                                    transition: 'background 0.2s',
                                }}
                            >
                                Contactar Nutricionista
                            </button>
                        </div>

                        {/* Plan Entrenamiento */}
                        <div
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                background: 'linear-gradient(120deg, #e3f2fd 60%, #bbdefb 100%)',
                                borderRadius: 14,
                                padding: 28,
                                boxShadow: '0 2px 12px #90caf9aa',
                                transition: 'transform 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 22,
                                    marginBottom: 12,
                                    color: '#1976d2',
                                    letterSpacing: 0.5,
                                }}
                            >
                                Planes de Entrenamiento
                            </div>
                            <img
                                src="https://cdn.sportadictos.com/files/2019/02/Creando-plan-de-entrenamiento.jpg"
                                alt="Plan de Entrenamiento"
                                style={{
                                    width: 110,
                                    height: 110,
                                    objectFit: 'cover',
                                    marginBottom: 18,
                                    borderRadius: 10,
                                    border: '3px solid #fff',
                                    boxShadow: '0 2px 8px #1976d255',
                                }}
                            />
                            <p style={{ color: '#1976d2', fontSize: 15, marginBottom: 18 }}>
                                Rutinas adaptadas a tus metas y seguimiento profesional.
                            </p>
                            <button
                                style={{
                                    padding: '12px 28px',
                                    background: 'linear-gradient(90deg, #42a5f5 0%, #1976d2 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    boxShadow: '0 2px 8px #42a5f533',
                                    transition: 'background 0.2s',
                                }}
                            >
                                Solicitar Información
                            </button>
                        </div>
                    </div>
                </div>

                {/* Valor Añadido */}
                <h3
                    style={{
                        marginBottom: 18,
                        color: '#263159',
                        fontWeight: 800,
                        fontSize: 26,
                        textAlign: 'center',
                        letterSpacing: 0.5,
                    }}
                >
                    Valor Añadido
                </h3>
                <div
                    style={{
                        background: 'linear-gradient(90deg, #fffde7 0%, #fff9c4 100%)',
                        borderRadius: 12,
                        padding: 24,
                        maxWidth: 600,
                        margin: '0 auto',
                        textAlign: 'center',
                        fontSize: 18,
                        color: '#795548',
                        fontWeight: 600,
                        boxShadow: '0 2px 12px #ffe08255',
                    }}
                >
                    Atención personalizada, motivación constante y acompañamiento profesional para lograr tus objetivos. ¡Transforma tu vida con nosotros!
                </div>
            </div>
            {/* Footer */}
            <footer style={{
                background: "#212529",
                color: "#fff",
                textAlign: "center",
                padding: "1.2rem 0",
                marginTop: "2rem",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                fontSize: "1rem"
            }}>
                © {new Date().getFullYear()} Sabor Integraciones. Todos los derechos reservados.
            </footer>
        </div>
    );
};

export default Servicios;