import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

import Imagelogo from '../../assets/icono-logo.png';
const ITEMS_PER_PAGE = 2;

function Vermas() {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();
    const [historial, setHistorial] = useState([]);
    const [seguimientoPedidos, setSeguimientoPedidos] = useState([]);
    const [suscripciones, setSuscripciones] = useState([]);
    const [loading, setLoading] = useState(true);

    // Paginación
    const [historialPage, setHistorialPage] = useState(1);
    const [suscripcionesPage, setSuscripcionesPage] = useState(1);
    const [seguimientoPage, setSeguimientoPage] = useState(1);

    // Obtener RUT del usuario logeado
    const rutUsuario = user?.rut || user?.RUT || "";

    useEffect(() => {
        setLoading(true);
        axios.get("http://localhost:5000/api/historial")
            .then(res => setHistorial(res.data))
            .catch(err => console.error(err));
        axios.get("http://localhost:5000/pedidos")
            .then(res => setSeguimientoPedidos(res.data))
            .catch(err => console.error(err));
        axios.get("http://localhost:5000/api/suscripciones")
            .then(res => setSuscripciones(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
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

    // Filtrar por RUT
    const historialFiltrado = historial.filter(item => item.rut === rutUsuario || item.RUT === rutUsuario);
    const suscripcionesFiltradas = suscripciones.filter(item => item.rut === rutUsuario || item.RUT === rutUsuario);
    const seguimientoFiltrado = seguimientoPedidos.filter(item => item.rut === rutUsuario || item.RUT === rutUsuario);

    // Paginación
    const paginar = (data, page) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (loading) return <div>Cargando...</div>;

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
            <div className="vermas-vertical-container">
                <h2 className="vermas-title">Mas opciones</h2>
                <div className="vermas-section">
                    <SectionCard title="Historial de Compras" icon="🛒">
                        <ul className="vermas-list">
                            {paginar(historialFiltrado, historialPage).map((item, index) => (
                                <li key={index} className="vermas-list-item">
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Fecha:</span>
                                        <span>{item.fecha_transaccion}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Método:</span>
                                        <span>{item.metodo_de_pago}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Monto:</span>
                                        <span>${item.monto}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Descripción:</span>
                                        <span>{item.descripcion_transaccion}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">N° Orden:</span>
                                        <span>{item.n_orden}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Paginador
                            total={historialFiltrado.length}
                            page={historialPage}
                            setPage={setHistorialPage}
                        />
                    </SectionCard>
                    <SectionCard title="Suscripciones" icon="📦">
                        <ul className="vermas-list">
                            {paginar(suscripcionesFiltradas, suscripcionesPage).map((suscripcion, index) => (
                                <li key={index} className="vermas-list-item">
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Plan:</span>
                                        <span>{suscripcion.ID_PLAN || suscripcion.id_plan}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Nombre:</span>
                                        <span>{suscripcion.NOMBRE || suscripcion.nombre}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Inicio:</span>
                                        <span>{(suscripcion.FECHAINICIO || suscripcion.fechainicio || "").substring(0, 10)}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Fin:</span>
                                        <span>{(suscripcion.FECHAFIN || suscripcion.fechafin || "").substring(0, 10)}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Descripción:</span>
                                        <span>{suscripcion.DESCRIPCION || suscripcion.descripcion}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Tipo:</span>
                                        <span>{suscripcion.TIPO_PLAN || suscripcion.tipo_plan}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Paginador
                            total={suscripcionesFiltradas.length}
                            page={suscripcionesPage}
                            setPage={setSuscripcionesPage}
                        />
                    </SectionCard>
                    <SectionCard title="Seguimiento de Pedidos" icon="🚚">
                        <button
                            className="btn btn-primary mb-3"
                            onClick={() => navigate("/seguimiento")}
                            style={{ width: "100%" }}
                        >
                            Buscar pedido
                        </button>
                        <ul className="vermas-list">
                            {paginar(seguimientoFiltrado, seguimientoPage).map((pedido, index) => (
                                <li key={index} className="vermas-list-item">
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">N° Orden:</span>
                                        <span>{pedido.NUMERO_ORDEN}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Estado:</span>
                                        <span>{pedido.ESTADO}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Total:</span>
                                        <span>${pedido.TOTAL}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Fecha:</span>
                                        <span>{pedido.FECHA_PEDIDO}</span>
                                    </div>
                                    <div className="vermas-item-row">
                                        <span className="vermas-item-label">Dirección:</span>
                                        <span>{pedido.DIRECCION}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Paginador
                            total={seguimientoFiltrado.length}
                            page={seguimientoPage}
                            setPage={setSeguimientoPage}
                        />
                    </SectionCard>
                </div>
                <style>{`
                .vermas-vertical-container {
                    max-width: 600px;
                    margin: 40px auto;
                    padding: 24px;
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                }
                .vermas-title {
                    text-align: center;
                    font-weight: 700;
                    margin-bottom: 32px;
                    color: #2d3748;
                }
                .vermas-section {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }
                .vermas-card {
                    background: #f7fafc;
                    border-radius: 12px;
                    padding: 20px 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    margin-bottom: 0;
                }
                .vermas-card-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #3182ce;
                }
                .vermas-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .vermas-list-item {
                    background: #fff;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    padding: 16px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.03);
                    transition: box-shadow 0.2s;
                }
                .vermas-list-item:last-child {
                    margin-bottom: 0;
                }
                .vermas-list-item:hover {
                    box-shadow: 0 4px 12px rgba(49,130,206,0.08);
                }
                .vermas-item-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                    font-size: 0.97rem;
                }
                .vermas-item-label {
                    font-weight: 500;
                    color: #4a5568;
                }
                @media (max-width: 700px) {
                    .vermas-vertical-container {
                        padding: 10px;
                    }
                    .vermas-card {
                        padding: 12px 8px;
                    }
                }
            `}</style>
            </div>
        </div>
    );
}

// Card section for vertical design
function SectionCard({ title, icon, children }) {
    return (
        <div className="vermas-card">
            <div className="vermas-card-title">{icon} {title}</div>
            {children}
        </div>
    );
}

// Componente paginador simple
function Paginador({ total, page, setPage }) {
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;
    return (
        <nav>
            <ul className="pagination justify-content-center mt-2">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)}>&laquo;</button>
                </li>
                {[...Array(totalPages)].map((_, idx) => (
                    <li key={idx} className={`page-item ${page === idx + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPage(idx + 1)}>{idx + 1}</button>
                    </li>
                ))}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page + 1)}>&raquo;</button>
                </li>
            </ul>
        </nav>
    );
}

export default Vermas;