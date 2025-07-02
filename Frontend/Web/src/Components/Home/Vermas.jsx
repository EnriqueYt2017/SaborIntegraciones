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
    const [showVoucher, setShowVoucher] = useState(false);
    const [voucherData, setVoucherData] = useState(null);

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

    const verVoucher = (item, tipo) => {
        setVoucherData({ ...item, tipo });
        setShowVoucher(true);
    };

    const handleCloseModal = () => {
        setShowVoucher(false);
        setVoucherData(null);
    };

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
                                    <div className="vermas-item-header">
                                        <div className="vermas-item-title">Compra #{item.n_orden}</div>
                                        <button 
                                            className="btn-ver-voucher" 
                                            onClick={() => verVoucher(item, 'compra')}
                                            title="Ver voucher"
                                        >
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </div>
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
                                    <div className="vermas-item-header">
                                        <div className="vermas-item-title">Suscripción #{suscripcion.ID_PLAN || suscripcion.id_plan}</div>
                                        <button 
                                            className="btn-ver-voucher" 
                                            onClick={() => verVoucher(suscripcion, 'suscripcion')}
                                            title="Ver voucher"
                                        >
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </div>
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
                        {user && (user.id_rol === 5 || user.id_rol === 6) && (
                        <button
                            className="btn btn-primary mb-3"
                            onClick={() => navigate("/seguimiento")}
                            style={{ width: "100%" }}
                        >
                            Buscar pedido
                        </button>
                        )}
                        <ul className="vermas-list">
                            {paginar(seguimientoFiltrado, seguimientoPage).map((pedido, index) => (
                                <li key={index} className="vermas-list-item">
                                    <div className="vermas-item-header">
                                        <div className="vermas-item-title">Pedido #{pedido.NUMERO_ORDEN}</div>
                                        <button 
                                            className="btn-ver-voucher" 
                                            onClick={() => verVoucher(pedido, 'pedido')}
                                            title="Ver voucher"
                                        >
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </div>
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
                .vermas-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .vermas-item-title {
                    font-weight: 600;
                    color: #2d3748;
                }
                .btn-ver-voucher {
                    background: none;
                    border: none;
                    color: #4299e1;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .btn-ver-voucher:hover {
                    background: #ebf8ff;
                    color: #2b6cb0;
                }
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1050;
                    backdrop-filter: blur(5px);
                }

                .voucher-modal {
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 450px;
                    position: relative;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                    margin: 20px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .voucher-header {
                    background: linear-gradient(135deg, #3182ce, #2c5282);
                    color: white;
                    padding: 1.5rem;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #2d3748;
                }

                .voucher-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url(${Imagelogo}) no-repeat center;
                    background-size: 150px;
                    opacity: 0.1;
                    pointer-events: none;
                }

                .voucher-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    font-family: 'Montserrat', sans-serif;
                }

                .close-button {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .close-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }

                .voucher-content {
                    padding: 1.5rem;
                    position: relative;
                }

                .voucher-logo {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    position: relative;
                }

                .voucher-logo img {
                    width: 100px;
                    height: auto;
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
                }

                .voucher-info {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1.25rem;
                    position: relative;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    font-size: 0.95rem;
                }

                .voucher-info::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url(${Imagelogo}) no-repeat center;
                    background-size: 180px;
                    opacity: 0.02;
                    pointer-events: none;
                }

                .voucher-info p {
                    margin-bottom: 1rem;
                    padding: 0.75rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px dashed #e2e8f0;
                    font-size: 1.1rem;
                }

                .voucher-info p:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }

                .voucher-info strong {
                    color: #2d3748;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: 'Montserrat', sans-serif;
                }

                .voucher-info strong i {
                    color: #4299e1;
                    font-size: 1.1rem;
                }

                .voucher-footer {
                    margin-top: 2rem;
                    text-align: center;
                    color: #718096;
                    font-size: 0.9rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e2e8f0;
                }

                .voucher-qr {
                    position: absolute;
                    bottom: 2rem;
                    right: 2rem;
                    width: 80px;
                    height: 80px;
                    background: #f7fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .voucher-qr img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                @media (max-width: 600px) {
                    .vermas-vertical-container {
                        padding: 10px;
                    }
                    .vermas-card {
                        padding: 12px 8px;
                    }

                    .voucher-modal {
                        width: 95%;
                        margin: 10px;
                    }
                    
                    .voucher-info p {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }

                    .voucher-qr {
                        display: none;
                    }

                    .voucher-timestamp {
                        position: static;
                        text-align: center;
                        margin-top: 1rem;
                    }
                }
            `}</style>
            </div>
            
            {/* Modal del Voucher */}
            {showVoucher && voucherData && (
                <div className="modal-backdrop" onClick={handleCloseModal}>
                    <div className="voucher-modal" onClick={e => e.stopPropagation()}>
                        <div className="voucher-header">
                            <h3>
                                <i className="bi bi-receipt"></i>
                                {' '}Comprobante de {voucherData.tipo}
                            </h3>
                            <button className="close-button" onClick={handleCloseModal}>
                                <i className="bi bi-x"></i>
                            </button>
                        </div>
                        <div className="voucher-content">
                            <div className="voucher-logo">
                                <img src={Imagelogo} alt="Logo" />
                            </div>
                            <div className="voucher-info">
                                <p>
                                    <strong><i className="bi bi-person-vcard"></i> RUT:</strong>
                                    <span>{voucherData.rut || voucherData.RUT}</span>
                                </p>

                                {voucherData.tipo === 'compra' && (
                                    <>
                                        <p>
                                            <strong><i className="bi bi-hash"></i> N° Orden:</strong>
                                            <span>{voucherData.n_orden}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-calendar-event"></i> Fecha:</strong>
                                            <span>{voucherData.fecha_transaccion}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-credit-card"></i> Método:</strong>
                                            <span>{voucherData.metodo_de_pago}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-cash"></i> Monto:</strong>
                                            <span>${voucherData.monto?.toLocaleString('es-CL')}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-card-text"></i> Descripción:</strong>
                                            <span>{voucherData.descripcion_transaccion}</span>
                                        </p>
                                    </>
                                )}

                                {voucherData.tipo === 'suscripcion' && (
                                    <>
                                        <p>
                                            <strong><i className="bi bi-star"></i> Plan ID:</strong>
                                            <span>{voucherData.ID_PLAN || voucherData.id_plan}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-card-heading"></i> Nombre:</strong>
                                            <span>{voucherData.NOMBRE || voucherData.nombre}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-calendar-check"></i> Inicio:</strong>
                                            <span>{(voucherData.FECHAINICIO || voucherData.fechainicio || "").substring(0, 10)}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-calendar-x"></i> Fin:</strong>
                                            <span>{(voucherData.FECHAFIN || voucherData.fechafin || "").substring(0, 10)}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-tag"></i> Tipo:</strong>
                                            <span>{voucherData.TIPO_PLAN || voucherData.tipo_plan}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-card-text"></i> Descripción:</strong>
                                            <span>{voucherData.DESCRIPCION || voucherData.descripcion}</span>
                                        </p>
                                    </>
                                )}

                                {voucherData.tipo === 'pedido' && (
                                    <>
                                        <p>
                                            <strong><i className="bi bi-hash"></i> N° Orden:</strong>
                                            <span>{voucherData.NUMERO_ORDEN}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-box"></i> Estado:</strong>
                                            <span>{voucherData.ESTADO}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-cash"></i> Total:</strong>
                                            <span>${voucherData.TOTAL?.toLocaleString('es-CL')}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-calendar-event"></i> Fecha:</strong>
                                            <span>{voucherData.FECHA_PEDIDO}</span>
                                        </p>
                                        <p>
                                            <strong><i className="bi bi-geo-alt"></i> Dirección:</strong>
                                            <span>{voucherData.DIRECCION}</span>
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="voucher-footer">
                                <p>
                                    <strong><i className="bi bi-building"></i> Sabor Integración</strong><br />
                                    <i className="bi bi-geo-alt"></i> Av. Principal 123, Santiago<br />
                                    <i className="bi bi-telephone"></i> +56 9 1234 5678<br />
                                    <i className="bi bi-globe"></i> www.saborintegracion.cl
                                </p>
                            </div>
                            <div className="voucher-qr">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SaborIntegracion-${voucherData.tipo}-${voucherData.n_orden || voucherData.ID_PLAN || voucherData.NUMERO_ORDEN}`} alt="QR Code" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
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