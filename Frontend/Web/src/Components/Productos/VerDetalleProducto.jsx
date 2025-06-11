/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Imagelogo from "../../assets/icono-logo.png";
import { FaShoppingCart, FaHome, FaStar, FaUserCircle } from "react-icons/fa";
import axios from "axios";

const MAX_RELACIONADOS = 3;
const COMENTARIOS_POR_PAGINA = 3;

const VerDetalleProducto = () => {
    const { id } = useParams();
    const [producto, setProducto] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [valoracion, setValoracion] = useState(5);
    const [comentarioEnviado, setComentarioEnviado] = useState(false);
    const [relacionados, setRelacionados] = useState([]);
    const [paginaComentarios, setPaginaComentarios] = useState(1);
    const [user, setUser] = useState(null);
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

    useEffect(() => {
        fetch(`http://localhost:5000/api/productos`)
            .then(res => res.json())
            .then(data => {
                const prod = data.find(p => String(p.codigo_producto) === String(id));
                setProducto(prod);
                const otros = data.filter(p => String(p.codigo_producto) !== String(id) && p.stock > 0);
                const mezclados = otros.sort(() => 0.5 - Math.random()).slice(0, MAX_RELACIONADOS);
                setRelacionados(mezclados);
            });
    }, [id]);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/comentarios/${id}`)
            .then(res => setComentarios(res.data))
            .catch(() => setComentarios([]));
        setPaginaComentarios(1); // Reset page when product changes
    }, [id]);

    if (!producto) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            }}>
                <div style={{
                    background: "#fff",
                    padding: 40,
                    borderRadius: 20,
                    boxShadow: "0 8px 32px #0002",
                    fontSize: 22,
                    color: "#222"
                }}>
                    Cargando producto...
                </div>
            </div>
        );
    }

    const handleAgregarCarrito = () => {
        if (!producto.stock || producto.stock <= 0) {
            alert("No hay stock disponible para este producto.");
            return;
        }
        const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        const index = carrito.findIndex(item => item.codigo_producto === producto.codigo_producto);
        if (index >= 0) {
            if (carrito[index].cantidad >= producto.stock) {
                alert("No hay más stock disponible para este producto.");
                return;
            }
            carrito[index].cantidad += 1;
        } else {
            carrito.push({ ...producto, cantidad: 1 });
        }
        localStorage.setItem("carrito", JSON.stringify(carrito));
        alert("Producto agregado al carrito");
    };

    const handleReservar = () => {
        if (!producto.stock || producto.stock <= 0) {
            alert("No hay stock disponible para este producto. No se puede reservar.");
            return;
        }
        const reserva = JSON.parse(localStorage.getItem("carrito_reserva")) || [];
        const index = reserva.findIndex(item => item.codigo_producto === producto.codigo_producto);
        if (index >= 0) {
            reserva[index].cantidad += 1;
        } else {
            reserva.push({ ...producto, cantidad: 1 });
        }
        localStorage.setItem("carrito_reserva", JSON.stringify(reserva));
        alert("Producto agregado a la reserva");
    };

    const enviarComentario = async () => {
        if (!nuevoComentario.trim()) return;
        try {
            await axios.post('http://localhost:5000/api/comentarios', {
                codigo_producto: producto.codigo_producto,
                valoracion,
                texto: nuevoComentario
            });
            setNuevoComentario("");
            setValoracion(5);
            setComentarioEnviado(true);
            const res = await axios.get(`http://localhost:5000/api/comentarios/${producto.codigo_producto}`);
            setComentarios(res.data);
            setPaginaComentarios(1); // Volver a la primera página tras comentar
            setTimeout(() => setComentarioEnviado(false), 2000);
        } catch (err) {
            alert("No se pudo enviar el comentario.");
        }
    };

    const renderStars = (count, size = 22) => (
        <span>
            {[1, 2, 3, 4, 5].map(i =>
                <span key={i} style={{ color: i <= count ? "#ffc107" : "#e0e0e0", fontSize: size, marginRight: 2 }}>★</span>
            )}
        </span>
    );

    // Nuevo diseño de comentarios
    const ComentarioCard = ({ comentario }) => (
        <div style={{
            background: "#f8fafc",
            borderRadius: 16,
            boxShadow: "0 2px 12px #e0e0e0",
            padding: "1.5rem 2rem",
            marginBottom: 24,
            display: "flex",
            alignItems: "flex-start",
            gap: 18,
            position: "relative",
            borderLeft: "6px solid #43e97b"
        }}>
            <div style={{ flexShrink: 0 }}>
                <FaUserCircle size={44} color="#43e97b" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {renderStars(comentario.valoracion, 20)}
                    <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>Anónimo</span>
                </div>
                <div style={{
                    fontStyle: "italic",
                    color: "#222",
                    fontSize: "1.13rem",
                    lineHeight: 1.6,
                    marginBottom: 2
                }}>
                    "{comentario.texto}"
                </div>
            </div>
        </div>
    );

    // Paginación de comentarios
    const totalPaginas = Math.ceil(comentarios.length / COMENTARIOS_POR_PAGINA);
    const comentariosPagina = comentarios.slice(
        (paginaComentarios - 1) * COMENTARIOS_POR_PAGINA,
        paginaComentarios * COMENTARIOS_POR_PAGINA
    );

    const handlePaginaAnterior = () => {
        setPaginaComentarios(prev => Math.max(1, prev - 1));
    };

    const handlePaginaSiguiente = () => {
        setPaginaComentarios(prev => Math.min(totalPaginas, prev + 1));
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            fontFamily: "Segoe UI, sans-serif"
        }}>
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
                            <a href="/carrito" className="nav-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cart" viewBox="0 0 16 16">
                                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                                </svg>
                            </a>
                        </li>
                        <li className="nav-item"><a href="/#" className="nav-link">Inicio</a></li>
                        <li className="nav-item"><a href="/productos" className="nav-link">Productos</a></li>
                        <li className="nav-item"><a href="/servicios" className="nav-link">Servicios</a></li>
                        <li className="nav-item"><a href="/reserva" className="nav-link">Reservas</a></li>
                        <li className="nav-item"><a href="/contactenos" className="nav-link">Contáctenos</a></li>
                    </ul>
                </nav>
            </div>
            <div style={{
                maxWidth: 1100,
                margin: "48px auto",
                background: "rgba(255,255,255,0.98)",
                borderRadius: 32,
                boxShadow: "0 8px 32px #0002",
                padding: 48,
                display: "flex",
                gap: 48,
                alignItems: "flex-start"
            }}>
                {/* Columna izquierda: Imagen y relacionados */}
                <div style={{
                    flex: "0 0 350px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                }}>
                    <img
                        src={producto.imagen || "https://img.icons8.com/fluency/96/fast-moving-consumer-goods.png"}
                        alt={producto.nombre}
                        style={{
                            width: 320,
                            height: 320,
                            objectFit: "cover",
                            borderRadius: 24,
                            background: "#f5f5f5",
                            boxShadow: "0 4px 24px #43e97b33"
                        }}
                    />
                    {/* Productos relacionados */}
                    <div style={{
                        marginTop: 36,
                        width: "100%",
                        background: "#fffbe7",
                        borderRadius: 16,
                        boxShadow: "0 2px 8px #facc1511",
                        padding: 20
                    }}>
                        <h3 style={{
                            color: "#facc15",
                            fontWeight: 700,
                            fontSize: 20,
                            marginBottom: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}>
                            <FaStar style={{ color: "#facc15" }} /> Productos Relacionados
                        </h3>
                        <div style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 12,
                            justifyContent: "center",
                            alignItems: "flex-start",
                            overflowX: "auto"
                        }}>
                            {relacionados.length === 0 ? (
                                <div style={{ color: "#aaa", fontSize: 15 }}>No hay productos relacionados.</div>
                            ) : (
                                relacionados.map(dest => (
                                    <div
                                        key={dest.codigo_producto}
                                        style={{
                                            background: "#fff",
                                            borderRadius: 10,
                                            boxShadow: "0 2px 8px #facc1511",
                                            padding: 8,
                                            minWidth: 90,
                                            maxWidth: 110,
                                            cursor: "pointer",
                                            textAlign: "center",
                                            border: "2px solid #facc15",
                                            transition: "box-shadow 0.2s"
                                        }}
                                        onClick={() => navigate(`/productos/${dest.codigo_producto}`)}
                                    >
                                        <img
                                            src={dest.imagen || "https://img.icons8.com/fluency/96/fast-moving-consumer-goods.png"}
                                            alt={dest.nombre}
                                            style={{
                                                width: 55,
                                                height: 55,
                                                objectFit: "cover",
                                                borderRadius: 7,
                                                marginBottom: 6
                                            }}
                                        />
                                        <div style={{ fontWeight: 700, color: "#facc15", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dest.nombre}</div>
                                        <div style={{ color: "#888", fontSize: 12 }}>${dest.precio}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                {/* Columna derecha: Detalle y comentarios */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <h2 style={{
                        fontWeight: 800,
                        fontSize: 40,
                        marginBottom: 14,
                        color: "#222"
                    }}>{producto.nombre}</h2>
                    <div style={{
                        color: "#666",
                        fontSize: 22,
                        marginBottom: 28,
                        lineHeight: 1.6
                    }}>{producto.descripcion}</div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 32,
                        marginBottom: 18
                    }}>
                        <span style={{
                            fontWeight: 700,
                            color: "#43e97b",
                            fontSize: 32,
                            background: "#eafff5",
                            padding: "10px 32px",
                            borderRadius: 14,
                            boxShadow: "0 2px 8px #43e97b11"
                        }}>
                            ${producto.precio}
                        </span>
                        <span style={{
                            color: producto.stock > 0 ? "#43e97b" : "#e74c3c",
                            fontWeight: 700,
                            fontSize: 22,
                            background: producto.stock > 0 ? "#eafff5" : "#ffeaea",
                            padding: "10px 24px",
                            borderRadius: 12,
                            boxShadow: "0 2px 8px #43e97b11"
                        }}>
                            Stock: {producto.stock > 0 ? producto.stock : "Sin stock"}
                        </span>
                    </div>
                    {/* Iconos de acción - Nuevo diseño */}
                    <div style={{
                        display: "flex",
                        gap: 24,
                        margin: "32px 0 36px 0",
                        justifyContent: "flex-start"
                    }}>
                        <button
                            onClick={handleAgregarCarrito}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: producto.stock > 0 ? "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)" : "#bdbdbd",
                                color: "#fff",
                                border: "none",
                                borderRadius: 14,
                                padding: "16px 32px",
                                fontWeight: 700,
                                fontSize: 20,
                                cursor: producto.stock > 0 ? "pointer" : "not-allowed",
                                boxShadow: "0 4px 16px #43e97b33",
                                opacity: producto.stock > 0 ? 1 : 0.6,
                                transition: "transform 0.15s, box-shadow 0.15s, background 0.2s",
                                position: "relative"
                            }}
                            title="Agregar al carrito"
                            disabled={producto.stock <= 0}
                            onMouseOver={e => {
                                if (producto.stock > 0) e.currentTarget.style.transform = "translateY(-3px) scale(1.04)";
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = "none";
                            }}
                        >
                            <FaShoppingCart size={24} />
                            <span>Agregar al carrito</span>
                        </button>
                        <button
                            onClick={handleReservar}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: producto.stock > 0 ? "linear-gradient(90deg, #38b6ff 0%, #43e97b 100%)" : "#bdbdbd",
                                color: "#fff",
                                border: "none",
                                borderRadius: 14,
                                padding: "16px 32px",
                                fontWeight: 700,
                                fontSize: 20,
                                cursor: producto.stock > 0 ? "pointer" : "not-allowed",
                                boxShadow: "0 4px 16px #38b6ff33",
                                opacity: producto.stock > 0 ? 1 : 0.6,
                                transition: "transform 0.15s, box-shadow 0.15s, background 0.2s",
                                position: "relative"
                            }}
                            title="Reservar producto"
                            disabled={producto.stock <= 0}
                            onMouseOver={e => {
                                if (producto.stock > 0) e.currentTarget.style.transform = "translateY(-3px) scale(1.04)";
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = "none";
                            }}
                        >
                            <FaHome size={24} />
                            <span>Reservar producto</span>
                        </button>
                        <button
                            onClick={() => navigate("/productos")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "linear-gradient(90deg, #facc15 0%, #fcd34d 100%)",
                                color: "#222",
                                border: "none",
                                borderRadius: 14,
                                padding: "16px 32px",
                                fontWeight: 700,
                                fontSize: 20,
                                cursor: "pointer",
                                boxShadow: "0 4px 16px #facc1533",
                                transition: "transform 0.15s, box-shadow 0.15s, background 0.2s",
                                position: "relative"
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = "translateY(-3px) scale(1.04)";
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = "none";
                            }}
                        >
                            <span style={{ fontSize: 22 }}>↩</span>
                            <span>Volver</span>
                        </button>
                    </div>
                    {/* Comentarios */}
                    <div style={{ textAlign: "center", marginBottom: 18 }}>
                        <h2 style={{ fontWeight: 700, color: "#212529", fontSize: 28, marginBottom: 0, letterSpacing: 1 }}>Opiniones de clientes</h2>
                        <div style={{ width: 60, height: 4, background: "#43e97b", borderRadius: 2, margin: "8px auto 0 auto" }} />
                    </div>
                    <div style={{
                        maxWidth: 650,
                        margin: "0 auto 2.5rem auto",
                        background: "rgba(255,255,255,0.95)",
                        borderRadius: "18px",
                        boxShadow: "0 2px 12px #e0e0e0",
                        padding: "2rem 2.5rem"
                    }}>
                        {comentarios.length === 0 ? (
                            <div style={{ textAlign: "center", color: "#888", fontSize: "1.1rem", fontStyle: "italic" }}>
                                No hay comentarios aún.
                            </div>
                        ) : (
                            <>
                                {comentariosPagina.map(comentario => (
                                    <ComentarioCard comentario={comentario} key={comentario.id_comentario} />
                                ))}
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 10 }}>
                                    <button
                                        onClick={handlePaginaAnterior}
                                        disabled={paginaComentarios === 1}
                                        style={{
                                            background: "#43e97b",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 8,
                                            padding: "6px 18px",
                                            fontWeight: 600,
                                            fontSize: "1rem",
                                            cursor: paginaComentarios === 1 ? "not-allowed" : "pointer",
                                            opacity: paginaComentarios === 1 ? 0.5 : 1
                                        }}
                                    >
                                        Anterior
                                    </button>
                                    <span style={{ fontWeight: 600, color: "#43e97b" }}>
                                        Página {paginaComentarios} de {totalPaginas}
                                    </span>
                                    <button
                                        onClick={handlePaginaSiguiente}
                                        disabled={paginaComentarios === totalPaginas}
                                        style={{
                                            background: "#43e97b",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 8,
                                            padding: "6px 18px",
                                            fontWeight: 600,
                                            fontSize: "1rem",
                                            cursor: paginaComentarios === totalPaginas ? "not-allowed" : "pointer",
                                            opacity: paginaComentarios === totalPaginas ? 0.5 : 1
                                        }}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    {user && (
                        <div style={{
                            maxWidth: 650,
                            margin: "2rem auto 0 auto",
                            background: "#f8fafc",
                            borderRadius: 16,
                            boxShadow: "0 2px 12px #e0e0e0",
                            padding: "1.5rem 2rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem"
                        }}>
                            <div>
                                {[1, 2, 3, 4, 5].map(i =>
                                    <span
                                        key={i}
                                        style={{
                                            color: i <= valoracion ? "#ffc107" : "#e0e0e0",
                                            fontSize: 28,
                                            cursor: "pointer"
                                        }}
                                        onClick={() => setValoracion(i)}
                                    >★</span>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Añadir un comentario"
                                value={nuevoComentario}
                                onChange={e => setNuevoComentario(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem 1rem",
                                    borderRadius: "8px",
                                    border: "1px solid #ccc",
                                    fontSize: "1rem"
                                }}
                            />
                            <button
                                style={{
                                    backgroundColor: "#43e97b",
                                    color: "#fff",
                                    border: "none",
                                    padding: "0.75rem 1.5rem",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                    cursor: "pointer",
                                    transition: "background 0.2s"
                                }}
                                onClick={enviarComentario}
                            >
                                Enviar
                            </button>
                            {comentarioEnviado && (
                                <span style={{ color: "#43e97b", marginLeft: 8, fontWeight: 600 }}>¡Gracias por tu comentario!</span>
                            )}
                        </div>
                    )}
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

export default VerDetalleProducto;