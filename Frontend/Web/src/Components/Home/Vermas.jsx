import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Imagelogo from '../../assets/icono-logo.png';

const ITEMS_PER_PAGE = 5; // Aumentado de 2 a 5 items por página

// Formatters
const formatDate = (dateString) => {
    if (!dateString) return "No disponible";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(amount);
};

// Estados de pedido con sus colores
const ESTADO_PEDIDO = {
    'PENDIENTE': { color: '#FFA500', bg: '#FFF3E0' },
    'EN PROCESO': { color: '#2196F3', bg: '#E3F2FD' },
    'COMPLETADO': { color: '#4CAF50', bg: '#E8F5E9' },
    'CANCELADO': { color: '#F44336', bg: '#FFEBEE' }
};

function LoadingSpinner() {
    return (
        <div className="d-flex justify-content-center align-items-center p-4">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
            </div>
        </div>
    );
}

function EmptyState({ message, icon }) {
    return (
        <div className="text-center p-4 text-muted">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{icon}</div>
            <p>{message}</p>
        </div>
    );
}

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

    if (loading) return (
        <div className="vermas-vertical-container">
            <LoadingSpinner />
        </div>
    );

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
                <h2 className="vermas-title">Más opciones</h2>
                <div className="vermas-section">
                    <SectionCard title="Historial de Compras" icon="🛒">
                        {historialFiltrado.length === 0 ? (
                            <EmptyState 
                                icon="🛍️" 
                                message="Aún no tienes compras registradas" 
                            />
                        ) : (
                            <>
                                <ul className="vermas-list">
                                    {paginar(historialFiltrado, historialPage).map((item, index) => (
                                        <li key={index} className="vermas-list-item">
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Fecha:</span>
                                                <span>{formatDate(item.fecha_transaccion)}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Método:</span>
                                                <span className="badge bg-info text-dark">{item.metodo_de_pago}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Monto:</span>
                                                <span className="text-success fw-bold">{formatCurrency(item.monto)}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Descripción:</span>
                                                <span className="text-wrap">{item.descripcion_transaccion}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">N° Orden:</span>
                                                <span className="badge bg-secondary">{item.n_orden}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <Paginador
                                    total={historialFiltrado.length}
                                    page={historialPage}
                                    setPage={setHistorialPage}
                                />
                            </>
                        )}
                    </SectionCard>

                    <SectionCard title="Suscripciones" icon="📦">
                        {suscripcionesFiltradas.length === 0 ? (
                            <EmptyState 
                                icon="📅" 
                                message="No tienes suscripciones activas" 
                            />
                        ) : (
                            <>
                                <ul className="vermas-list">
                                    {paginar(suscripcionesFiltradas, suscripcionesPage).map((suscripcion, index) => (
                                        <li key={index} className="vermas-list-item">
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Plan:</span>
                                                <span className="badge bg-primary">#{suscripcion.ID_PLAN || suscripcion.id_plan}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Nombre:</span>
                                                <span className="fw-bold">{suscripcion.NOMBRE || suscripcion.nombre}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Vigencia:</span>
                                                <div className="d-flex flex-column align-items-end">
                                                    <small className="text-muted">Desde: {formatDate(suscripcion.FECHAINICIO || suscripcion.fechainicio)}</small>
                                                    <small className="text-muted">Hasta: {formatDate(suscripcion.FECHAFIN || suscripcion.fechafin)}</small>
                                                </div>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Tipo:</span>
                                                <span className="badge bg-info">{suscripcion.TIPO_PLAN || suscripcion.tipo_plan}</span>
                                            </div>
                                            {(suscripcion.DESCRIPCION || suscripcion.descripcion) && (
                                                <div className="vermas-item-row mt-2">
                                                    <small className="text-muted fst-italic w-100 text-wrap">
                                                        {suscripcion.DESCRIPCION || suscripcion.descripcion}
                                                    </small>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                <Paginador
                                    total={suscripcionesFiltradas.length}
                                    page={suscripcionesPage}
                                    setPage={setSuscripcionesPage}
                                />
                            </>
                        )}
                    </SectionCard>

                    <SectionCard title="Seguimiento de Pedidos" icon="🚚">
                        {user && (user.id_rol === 5 || user.id_rol === 6) && (
                            <button
                                className="btn btn-primary mb-3"
                                onClick={() => navigate("/seguimiento")}
                                style={{ width: "100%" }}
                            >
                                Buscar pedido
                            </button>
                        )}
                        {seguimientoFiltrado.length === 0 ? (
                            <EmptyState 
                                icon="📦" 
                                message="No hay pedidos para mostrar" 
                            />
                        ) : (
                            <>
                                <ul className="vermas-list">
                                    {paginar(seguimientoFiltrado, seguimientoPage).map((pedido, index) => (
                                        <li key={index} className="vermas-list-item">
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">N° Orden:</span>
                                                <span className="badge bg-secondary">#{pedido.NUMERO_ORDEN}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Estado:</span>
                                                <span className="badge" style={{
                                                    backgroundColor: ESTADO_PEDIDO[pedido.ESTADO]?.bg || '#f0f0f0',
                                                    color: ESTADO_PEDIDO[pedido.ESTADO]?.color || '#666'
                                                }}>
                                                    {pedido.ESTADO}
                                                </span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Total:</span>
                                                <span className="text-success fw-bold">{formatCurrency(pedido.TOTAL)}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Fecha:</span>
                                                <span>{formatDate(pedido.FECHA_PEDIDO)}</span>
                                            </div>
                                            <div className="vermas-item-row">
                                                <span className="vermas-item-label">Dirección:</span>
                                                <span className="text-wrap">{pedido.DIRECCION || 'No disponible'}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <Paginador
                                    total={seguimientoFiltrado.length}
                                    page={seguimientoPage}
                                    setPage={setSeguimientoPage}
                                />
                            </>
                        )}
                    </SectionCard>
                </div>
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .vermas-vertical-container {
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 24px;
                        background: #fff;
                        border-radius: 16px;
                        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                        animation: fadeIn 0.5s ease-out;
                    }

                    .vermas-title {
                        text-align: center;
                        font-weight: 700;
                        margin-bottom: 32px;
                        color: #2d3748;
                        font-size: 2rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    .vermas-section {
                        display: flex;
                        flex-direction: column;
                        gap: 32px;
                    }

                    .vermas-card {
                        background: #f7fafc;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        margin-bottom: 0;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }

                    .vermas-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    }

                    .vermas-card-title {
                        font-size: 1.4rem;
                        font-weight: 600;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        color: #3182ce;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 12px;
                    }

                    .vermas-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .vermas-list-item {
                        background: #fff;
                        border-radius: 10px;
                        margin-bottom: 16px;
                        padding: 20px;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.03);
                        transition: all 0.2s;
                        animation: fadeIn 0.5s ease-out;
                        border: 1px solid #e2e8f0;
                    }

                    .vermas-list-item:last-child {
                        margin-bottom: 0;
                    }

                    .vermas-list-item:hover {
                        box-shadow: 0 4px 12px rgba(49,130,206,0.08);
                        border-color: #3182ce;
                    }

                    .vermas-item-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                        font-size: 0.97rem;
                    }

                    .vermas-item-row:last-child {
                        margin-bottom: 0;
                    }

                    .vermas-item-label {
                        font-weight: 500;
                        color: #4a5568;
                        min-width: 100px;
                    }

                    .pagination {
                        margin-top: 20px;
                    }

                    .page-link {
                        color: #3182ce;
                        border-color: #e2e8f0;
                        transition: all 0.2s;
                    }

                    .page-link:hover {
                        background-color: #ebf8ff;
                        border-color: #3182ce;
                        color: #2c5282;
                    }

                    .page-item.active .page-link {
                        background-color: #3182ce;
                        border-color: #3182ce;
                    }

                    @media (max-width: 700px) {
                        .vermas-vertical-container {
                            margin: 20px 10px;
                            padding: 16px;
                        }

                        .vermas-card {
                            padding: 16px;
                        }

                        .vermas-item-row {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 4px;
                        }

                        .vermas-item-row > span:last-child {
                            width: 100%;
                        }

                        .vermas-title {
                            font-size: 1.5rem;
                        }

                        .vermas-card-title {
                            font-size: 1.2rem;
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