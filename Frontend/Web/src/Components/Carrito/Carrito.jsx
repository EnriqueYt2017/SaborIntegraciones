/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Imagelogo from '../../assets/icono-logo.png';

const styles = {
    container: {
        maxWidth: 600,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px #0001",
        padding: 32,
        fontFamily: "Segoe UI, sans-serif",
    },
    title: {
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 24,
        color: "#222",
        textAlign: "center",
    },
    emptyContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        marginTop: 40,
        marginBottom: 40,
    },
    emptyIcon: {
        fontSize: 96,
        color: "#e0e0e0",
    },
    emptyText: {
        fontSize: 22,
        color: "#888",
        fontWeight: 500,
    },
    volverBtn: {
        marginTop: 24,
        background: "#43e97b",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "12px 32px",
        fontSize: 18,
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.2s",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: 24,
    },
    th: {
        background: "#f7f7f7",
        color: "#333",
        fontWeight: 700,
        padding: "12px 8px",
        borderBottom: "2px solid #e0e0e0",
        textAlign: "left",
    },
    td: {
        padding: "10px 8px",
        borderBottom: "1px solid #f0f0f0",
        verticalAlign: "middle",
        fontSize: 16,
    },
    productImg: {
        width: 48,
        height: 48,
        objectFit: "cover",
        borderRadius: 8,
        background: "#f5f5f5",
        display: "block",
    },
    eliminarBtn: {
        background: "#ff5e57",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "8px 16px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 15,
        transition: "background 0.2s",
    },
    limpiarBtn: {
        background: "#e67e22",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "10px 20px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 16,
        marginRight: 12,
        transition: "background 0.2s",
    },
    pagarBtn: {
        background: "linear-gradient(90deg,#43e97b 0%,#38f9d7 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "10px 24px",
        fontWeight: 700,
        cursor: "pointer",
        fontSize: 18,
        boxShadow: "0 2px 8px #43e97b33",
        transition: "background 0.2s",
    },
    total: {
        marginTop: 24,
        fontWeight: 700,
        fontSize: 20,
        color: "#43e97b",
        textAlign: "right",
    },
    actionsRow: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 8,
    },
};

function Carrito() {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();
    const [carrito, setCarrito] = useState([]);
    const [esCliente, setEsCliente] = useState(false);

    useEffect(() => {
        const carritoGuardado = JSON.parse(localStorage.getItem("carrito")) || [];
        setCarrito(carritoGuardado);

        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && Object.keys(parsedUser).length > 0) {
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error("Error al parsear usuario:", error);
            }
        }

        // Validar cliente por rut y dvrut (robusto)
        if (userData) {
            const userData = localStorage.getItem("user");
            axios.get("http://localhost:5000/clientes")
                .then(res => {
                    const clientes = res.data;
                    const clean = val => String(val).replace(/^0+/, '').trim();
                    const userRut = clean(user.rut);
                    const userDv = clean(user.dvrut);

                    // 🔹 Busca coincidencia exacta con `numero_rut`
                    const match = clientes.some(c =>
                        (clean(c.numero_rut ?? c.rut) === userRut) &&
                        (clean(c.dv_rut ?? c.dvrut) === userDv)
                    );

                    setEsCliente(match);
                })
                .catch(error => {
                    console.error("Error al validar cliente:", error);
                    setEsCliente(false);
                });
        }

    }, []);

    // Calcula el total con descuento si corresponde
    const totalSinDescuento = carrito.reduce((acc, item) => acc + (item.precio * (item.cantidad || 1)), 0);
    const total = esCliente ? parseFloat((totalSinDescuento * 0.8).toFixed(2)) : totalSinDescuento;

    const limpiarCarrito = () => {
        setCarrito([]);
        localStorage.setItem("carrito", JSON.stringify([]));
    };

    const eliminarProducto = (codigo_producto) => {
        const nuevoCarrito = carrito.filter(item => item.codigo_producto !== codigo_producto);
        setCarrito(nuevoCarrito);
        localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));
    };

    const pagar = async () => {
    const montoPagar = total;
    if (total <= 0) {
        alert("El carrito está vacío.");
        return;
    }
    const numeroOrden = "order-" + Date.now();
    localStorage.setItem("numero_orden", numeroOrden); // Guarda el número de orden
    localStorage.setItem("carrito_backup", localStorage.getItem("carrito"));
    try {
        const result = await axios.post("http://localhost:5000/webpay/create", {
            amount: montoPagar,
            sessionId: "sess-" + Date.now(),
            buyOrder: numeroOrden,
            returnUrl: "http://localhost:5173/return"
        });
        window.location.href = result.data.url + "?token_ws=" + result.data.token;
    } catch (error) {
        alert("Error al iniciar el pago: " + (error.response?.data?.error || error.message));
        console.error(error.response?.data || error);
    }
};

    const volverAProductos = () => {
        window.location.href = "/productos";
    };

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    return (
        <div>
            {/*Navbar */}
            <div className="containers">
                {/* ...NO TOCAR NAVBAR... */}
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
                            <a href="/carrito" className="nav-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cart" viewBox="0 0 16 16">
                                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                                </svg>
                            </a>
                        </li>
                        <li className="nav-item"><a href="/Home" className="nav-link">Inicio</a></li>
                        <li className="nav-item"><a href="#" className="nav-link">Productos</a></li>
                        <li className="nav-item"><a href="#" className="nav-link">Servicios</a></li>
                        <li className="nav-item"><a href="#" className="nav-link">Reservas</a></li>
                        <li className="nav-item"><a href="/contactenos" className="nav-link">Contáctenos</a></li>
                    </ul>
                </nav>
            </div>
            <div style={styles.container}>

                <h2 style={styles.title}>Listado de Productos</h2>

                {carrito.length === 0 ? (
                    <div style={styles.emptyContainer}>
                        <span style={styles.emptyIcon} role="img" aria-label="carrito">
                            🛒
                        </span>
                        <div style={styles.emptyText}>No hay productos</div>
                        <button style={styles.volverBtn} onClick={volverAProductos}>
                            Volver
                        </button>
                    </div>
                ) : (
                    <>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}></th>
                                    <th style={styles.th}>Producto</th>
                                    <th style={styles.th}>Precio</th>
                                    <th style={styles.th}>Cantidad</th>
                                    <th style={styles.th}>Subtotal</th>
                                    <th style={styles.th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.map(item => (
                                    <tr key={item.codigo_producto}>
                                        <td style={styles.td}>
                                            {item.imagen ? (
                                                <img src={item.imagen} alt={item.nombre} style={styles.productImg} />
                                            ) : (
                                                <span role="img" aria-label="producto" style={{ fontSize: 56 }}>🛍️</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>{item.nombre}</td>
                                        <td style={styles.td}>${item.precio}</td>
                                        <td style={styles.td}>{item.cantidad}</td>
                                        <td style={styles.td}>${item.precio * item.cantidad}</td>
                                        <td style={styles.td}>
                                            <button
                                                style={styles.eliminarBtn}
                                                onClick={() => eliminarProducto(item.codigo_producto)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={styles.actionsRow}>
                            <button style={styles.limpiarBtn} onClick={limpiarCarrito}>
                                Limpiar Carrito
                            </button>
                            <button style={styles.pagarBtn} onClick={pagar}>
                                <span role="img" aria-label="pagar">💳</span> Pagar
                            </button>
                        </div>
                        <div style={styles.total}>
                            {/* Línea de descuento */}
                            <div style={{ color: esCliente ? "#43e97b" : "#e67e22", fontWeight: 600, marginBottom: 8 }}>
                                {esCliente
                                    ? "¡Cliente registrado! 20% de descuento aplicado."
                                    : "No tiene descuento"}
                            </div>
                            {/* Montos */}
                            <div>
                                <span style={{ fontWeight: 500 }}>Monto sin descuento: </span>${totalSinDescuento}
                            </div>
                            <div>
                                <span style={{ fontWeight: 500 }}>Monto con descuento: </span>
                                {esCliente ? `$${total}` : "No aplica"}
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <span style={{ fontWeight: 700 }}>Total a pagar: </span>${total}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Carrito;