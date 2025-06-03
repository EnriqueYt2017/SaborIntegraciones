/* eslint-disable no-unused-vars */
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Imagelogo from '../../assets/icono-logo.png';

const ESTADOS = [
    "Sin enviar",
    "En preparación",
    "En camino",
    "Entregado",
    "Completado"
];

const badgeColors = {
    "Sin enviar": "#bdbdbd",
    "En preparación": "#ffb300",
    "En camino": "#42a5f5",
    "Entregado": "#43e97b",
    "Completado": "#388e3c"
};

const Seguimiento = () => {
    const [numeroOrden, setNumeroOrden] = useState("");
    const [pedido, setPedido] = useState(null);
    const [error, setError] = useState("");
    const [actualizando, setActualizando] = useState(false);
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

    const handleBuscar = async (e) => {
        e.preventDefault();
        setError("");
        setPedido(null);
        try {
            const res = await fetch(`http://localhost:5000/pedidos/${numeroOrden}`);
            if (!res.ok) throw new Error("Pedido no encontrado");
            const data = await res.json();

            // Solo mostrar si el RUT coincide con el usuario logeado
            const rutUsuario = user?.rut || user?.RUT || "";
            if (String(data.rut) !== String(rutUsuario)) {
                setError("No tienes permiso para ver este pedido.");
                setPedido(null);
                return;
            }

            setPedido(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleActualizarEstado = async () => {
        if (!pedido) return;
        setActualizando(true);
        const idx = ESTADOS.indexOf(pedido.estado);
        if (idx === -1 || idx === ESTADOS.length - 1) {
            setActualizando(false);
            return;
        }
        const nuevoEstado = ESTADOS[idx + 1];
        try {
            const res = await fetch(`http://localhost:5000/pedidos/${pedido.numero_orden}/estado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (!res.ok) throw new Error("No se pudo actualizar el estado");
            setPedido({ ...pedido, estado: nuevoEstado });
        } catch (err) {
            setError("Error al actualizar el estado");
        } finally {
            setActualizando(false);
        }
    };

    // Stepper visual
    const EstadoStepper = ({ estado }) => {
        const idx = ESTADOS.indexOf(estado);
        return (
            <div style={{ display: "flex", alignItems: "center", margin: "24px 0 18px 0", justifyContent: "center" }}>
                {ESTADOS.map((est, i) => (
                    <React.Fragment key={est}>
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: i <= idx ? badgeColors[est] : "#e0e0e0",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: 16,
                                boxShadow: i <= idx ? "0 2px 8px #43e97b44" : "none",
                                border: i === idx ? "2px solid #43e97b" : "2px solid #e0e0e0",
                                transition: "all .2s"
                            }}>
                                {i + 1}
                            </div>
                            <span style={{
                                marginTop: 6,
                                fontSize: 12,
                                color: i <= idx ? "#43e97b" : "#bdbdbd",
                                fontWeight: i === idx ? 700 : 500,
                                textAlign: "center",
                                width: 70
                            }}>{est}</span>
                        </div>
                        {i < ESTADOS.length - 1 && (
                            <div style={{
                                height: 4,
                                width: 32,
                                background: i < idx ? "#43e97b" : "#e0e0e0",
                                margin: "0 4px",
                                borderRadius: 2
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
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
                                        {user && user.id_rol !== 1 && (
                                        <button
                                            className="dropdown-item"
                                            onClick={() => navigate("/Dashboard/Inicio")}
                                        >
                                            Dashboard
                                        </button>
                                        )}
                                    </li>
                                    <li>
                                        <a href="/vermas" className="dropdown-item">Ver más</a>
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
                        <li className="nav-item"><a href="/home" className="nav-link">Inicio</a></li>
                        <li className="nav-item"><a href="/productos" className="nav-link">Productos</a></li>
                        <li className="nav-item"><a href="/servicios" className="nav-link">Servicios</a></li>
                        <li className="nav-item"><a href="/reserva" className="nav-link">Reservas</a></li>
                        <li className="nav-item"><a href="/contactenos" className="nav-link">Contáctenos</a></li>
                    </ul>
                </nav>
            </div>
            <div style={{
                maxWidth: 520,
                margin: "40px auto",
                padding: 0,
                background: "linear-gradient(135deg, #e0ffe7 0%, #f8fff8 100%)",
                borderRadius: 18,
                boxShadow: "0 4px 32px #43e97b22",
                border: "1px solid #e0f7e9"
            }}>
                <div style={{
                    background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                    borderRadius: "18px 18px 0 0",
                    padding: "32px 0 18px 0",
                    textAlign: "center"
                }}>
                    <h2 style={{
                        color: "#fff",
                        fontWeight: 800,
                        letterSpacing: 1,
                        fontSize: 28,
                        margin: 0
                    }}>Seguimiento de Pedido</h2>
                    <p style={{ color: "#e0ffe7", marginTop: 8, fontWeight: 500, fontSize: 15 }}>
                        Consulta y revisa el estado de tu pedido en tiempo real
                    </p>
                </div>
                <form onSubmit={handleBuscar} style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 12,
                    margin: "28px 0 18px 0"
                }}>
                    <input
                        type="text"
                        placeholder="Número de Orden"
                        value={numeroOrden}
                        onChange={e => setNumeroOrden(e.target.value)}
                        required
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            border: "1.5px solid #43e97b",
                            outline: "none",
                            width: 220,
                            fontSize: 16,
                            background: "#f8fff8",
                            transition: "border .2s"
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "12px 28px",
                            fontWeight: 700,
                            fontSize: 16,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px #43e97b33"
                        }}
                    >
                        Buscar
                    </button>
                </form>
                {error && <div style={{
                    color: "#e74c3c",
                    textAlign: "center",
                    marginBottom: 16,
                    fontWeight: 600,
                    fontSize: 15
                }}>{error}</div>}
                {pedido && (
                    <div style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: 28,
                        margin: "0 18px 24px 18px",
                        boxShadow: "0 2px 12px #43e97b22",
                        border: "1px solid #e0f7e9"
                    }}>
                        <h3 style={{
                            color: "#43e97b",
                            fontWeight: 700,
                            fontSize: 22,
                            marginBottom: 8
                        }}>Información del Pedido</h3>
                        <EstadoStepper estado={pedido.estado} />
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                            marginBottom: 10
                        }}>
                            <div><strong>Número de Orden:</strong> <span style={{ color: "#43e97b" }}>{pedido.numero_orden}</span></div>
                            <div><strong>RUT:</strong> {pedido.rut}</div>
                            <div><strong>Fecha del Pedido:</strong> {pedido.fecha_pedido}</div>
                            <div><strong>Estado:</strong>
                                <span style={{
                                    background: badgeColors[pedido.estado],
                                    color: "#fff",
                                    borderRadius: 6,
                                    padding: "2px 10px",
                                    marginLeft: 6,
                                    fontWeight: 700,
                                    fontSize: 14
                                }}>{pedido.estado}</span>
                            </div>
                            <div><strong>Total:</strong> <span style={{ color: "#43e97b" }}>${pedido.total}</span></div>
                            <div><strong>Dirección:</strong> {pedido.direccion}</div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <strong>Observaciones:</strong> {pedido.observaciones}
                        </div>
                        {pedido.tracking_blue && (
                            <div style={{
                                marginTop: 14,
                                marginBottom: 10,
                                background: "#e0ffe7",
                                borderRadius: 8,
                                padding: "10px 12px"
                            }}>
                                <strong>Tracking Blue Express:</strong> {pedido.tracking_blue}
                                <br />
                                <a
                                    href={`https://seguimiento.bluex.cl/?codigo=${pedido.tracking_blue}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: "#43e97b",
                                        fontWeight: 700,
                                        textDecoration: "underline",
                                        fontSize: 15
                                    }}
                                >
                                    Ver seguimiento en Blue Express
                                </a>
                            </div>
                        )}
                        {pedido.estado !== "Completado" && (
                            <button
                                onClick={handleActualizarEstado}
                                disabled={actualizando}
                                style={{
                                    marginTop: 18,
                                    background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "12px 28px",
                                    fontWeight: 700,
                                    fontSize: 16,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px #43e97b33",
                                    transition: "background .2s"
                                }}
                            >
                                {actualizando ? "Actualizando..." : "Actualizar Estado"}
                            </button>
                        )}
                        {pedido.estado === "Completado" && (
                            <div style={{
                                color: "#43e97b",
                                marginTop: 18,
                                fontWeight: 800,
                                fontSize: 18,
                                textAlign: "center"
                            }}>
                                ¡Pedido completado!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Seguimiento;