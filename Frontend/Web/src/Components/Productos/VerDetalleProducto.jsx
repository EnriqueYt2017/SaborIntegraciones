/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Imagelogo from "../../assets/icono-logo.png";
import { FaShoppingCart, FaHome, FaStar, FaUserCircle, FaReply, FaTrash, FaHeart, FaShare } from "react-icons/fa";
import axios from "axios";

const MAX_RELACIONADOS = 4;
const COMENTARIOS_POR_PAGINA = 5;

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
    const [respondiendo, setRespondiendo] = useState(null);
    const [textoRespuesta, setTextoRespuesta] = useState("");
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:5000/api/productos`)
            .then(res => res.json())
            .then(data => {
                const prod = data.find(p => String(p.codigo_producto) === String(id));
                setProducto(prod);
                const otros = data.filter(p => String(p.codigo_producto) !== String(id) && p.stock > 0);
                const mezclados = otros.sort(() => 0.5 - Math.random()).slice(0, MAX_RELACIONADOS);
                setRelacionados(mezclados);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (id) {
            cargarComentarios();
        }
    }, [id]);

    const cargarComentarios = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/comentarios/${id}`);
            setComentarios(res.data);
        } catch (error) {
            console.error("Error cargando comentarios:", error);
            console.error("Error response:", error.response?.data);
            setComentarios([]);
        }
        setPaginaComentarios(1);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            }}>
                <div style={{
                    background: "#fff",
                    padding: "3rem 4rem",
                    borderRadius: 20,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    fontSize: 24,
                    color: "#333",
                    textAlign: "center"
                }}>
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <div>Cargando producto...</div>
                </div>
            </div>
        );
    }

    if (!producto) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            }}>
                <div style={{
                    background: "#fff",
                    padding: "3rem 4rem",
                    borderRadius: 20,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    fontSize: 24,
                    color: "#e74c3c",
                    textAlign: "center"
                }}>
                    Producto no encontrado
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
        if (!nuevoComentario.trim()) {
            alert("Por favor escribe un comentario.");
            return;
        }
        
        try {
            await axios.post('http://localhost:5000/api/comentarios', {
                codigo_producto: producto.codigo_producto,
                valoracion,
                texto: nuevoComentario
            });
            setNuevoComentario("");
            setValoracion(5);
            setComentarioEnviado(true);
            await cargarComentarios();
            setTimeout(() => setComentarioEnviado(false), 3000);
        } catch (err) {
            console.error("Error enviando comentario:", err);
            console.error("Error response:", err.response?.data);
            alert("No se pudo enviar el comentario. Revisa la consola para más detalles.");
        }
    };

    const enviarRespuesta = async (comentarioPadre) => {
        if (!textoRespuesta.trim()) return;
        try {
            await axios.post('http://localhost:5000/api/comentarios', {
                codigo_producto: producto.codigo_producto,
                valoracion: 5,
                texto: textoRespuesta,
                rut: user?.rut,
                comentario_padre: comentarioPadre
            });
            setTextoRespuesta("");
            setRespondiendo(null);
            await cargarComentarios();
        } catch (err) {
            alert("No se pudo enviar la respuesta.");
        }
    };

    const eliminarComentario = async (idComentario) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/comentarios/${idComentario}`, {
                data: { rut: user?.rut }
            });
            await cargarComentarios();
        } catch (err) {
            alert("No se pudo eliminar el comentario.");
        }
    };

    const renderStars = (count, size = 22) => (
        <span>
            {[1, 2, 3, 4, 5].map(i =>
                <span key={i} style={{ color: i <= count ? "#ffc107" : "#e0e0e0", fontSize: size, marginRight: 2 }}>★</span>
            )}
        </span>
    );

    const ComentarioCard = ({ comentario, esRespuesta = false }) => (
        <div style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            padding: "1.5rem 2rem",
            marginBottom: 20,
            border: "1px solid #f1f3f4",
            position: "relative"
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 15 }}>
                <div style={{ flexShrink: 0 }}>
                    <FaUserCircle size={45} color="#667eea" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontWeight: 700, color: "#333", fontSize: 16 }}>
                                {comentario.nombre_usuario}
                            </span>
                            {renderStars(comentario.valoracion, 18)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#888", fontSize: 12 }}>
                                {new Date(comentario.fecha_comentario).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div style={{
                        color: "#444",
                        fontSize: 15,
                        lineHeight: 1.6,
                        marginBottom: 10
                    }}>
                        {comentario.texto}
                    </div>
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

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            {/* Navbar mejorada */}
            <div className="containers">
                <nav id="navbar-e" className="navbar bg-body-tertiary px-3" style={{
                    background: "rgba(255,255,255,0.95) !important",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                }}>
                    <a href="#" className="navbar-brand">
                        <img src={Imagelogo} alt="Logo" className="estilo-logo" />
                    </a>
                    <ul className="nav nav-pills">
                        {user ? (
                            <li className="nav-item dropdown">
                                <button
                                    className="nav-link btn dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    style={{ color: "#667eea", fontWeight: 600 }}
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
                                        style={{ color: "#667eea", fontWeight: 600 }}
                                        onClick={() => navigate("/login")}
                                    >
                                        Iniciar sesión
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className="nav-link btn"
                                        style={{ color: "#667eea", fontWeight: 600 }}
                                        onClick={() => navigate("/register")}
                                    >
                                        Registrarse
                                    </button>
                                </li>
                            </>
                        )}
                        <li className="nav-item">
                            <a href="/carrito" className="nav-link" style={{ color: "#667eea" }}>
                                <FaShoppingCart size={18} />
                            </a>
                        </li>
                        <li className="nav-item"><a href="/#" className="nav-link" style={{ color: "#667eea" }}>Inicio</a></li>
                        <li className="nav-item"><a href="/productos" className="nav-link" style={{ color: "#667eea" }}>Productos</a></li>
                        <li className="nav-item"><a href="/servicios" className="nav-link" style={{ color: "#667eea" }}>Servicios</a></li>
                        <li className="nav-item"><a href="/reserva" className="nav-link" style={{ color: "#667eea" }}>Reservas</a></li>
                        <li className="nav-item"><a href="/contactenos" className="nav-link" style={{ color: "#667eea" }}>Contáctenos</a></li>
                    </ul>
                </nav>
            </div>

            {/* Contenido principal */}
            <div style={{
                maxWidth: 1200,
                margin: "2rem auto",
                background: "rgba(255,255,255,0.98)",
                borderRadius: 24,
                boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
                overflow: "hidden"
            }}>
                {/* Hero section del producto */}
                <div style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff",
                    padding: "3rem 4rem",
                    display: "flex",
                    gap: "3rem",
                    alignItems: "center"
                }}>
                    <div style={{ flex: "0 0 400px" }}>
                        <img
                            src={producto.imagen || "https://img.icons8.com/fluency/96/fast-moving-consumer-goods.png"}
                            alt={producto.nombre}
                            style={{
                                width: "100%",
                                height: 400,
                                objectFit: "cover",
                                borderRadius: 20,
                                boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{
                            fontSize: "3rem",
                            fontWeight: 800,
                            marginBottom: "1rem",
                            lineHeight: 1.2
                        }}>
                            {producto.nombre}
                        </h1>
                        <p style={{
                            fontSize: "1.2rem",
                            marginBottom: "2rem",
                            opacity: 0.9,
                            lineHeight: 1.6
                        }}>
                            {producto.descripcion}
                        </p>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "2rem",
                            marginBottom: "2rem"
                        }}>
                            <span style={{
                                fontSize: "2.5rem",
                                fontWeight: 800,
                                background: "rgba(255,255,255,0.2)",
                                padding: "0.5rem 1.5rem",
                                borderRadius: 12,
                                backdropFilter: "blur(10px)"
                            }}>
                                ${producto.precio}
                            </span>
                            <span style={{
                                fontSize: "1.2rem",
                                background: producto.stock > 0 ? "rgba(46, 204, 113, 0.2)" : "rgba(231, 76, 60, 0.2)",
                                color: producto.stock > 0 ? "#2ecc71" : "#e74c3c",
                                padding: "0.5rem 1rem",
                                borderRadius: 8,
                                fontWeight: 600
                            }}>
                                {producto.stock > 0 ? `Stock: ${producto.stock}` : "Sin stock"}
                            </span>
                        </div>
                        
                        {/* Botones de acción */}
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            <button
                                onClick={handleAgregarCarrito}
                                disabled={producto.stock <= 0}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: producto.stock > 0 ? "#fff" : "rgba(255,255,255,0.3)",
                                    color: producto.stock > 0 ? "#667eea" : "rgba(255,255,255,0.6)",
                                    border: "none",
                                    borderRadius: 12,
                                    padding: "1rem 2rem",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                    cursor: producto.stock > 0 ? "pointer" : "not-allowed",
                                    transition: "all 0.3s ease",
                                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                                }}
                            >
                                <FaShoppingCart />
                                Agregar al carrito
                            </button>
                            <button
                                onClick={handleReservar}
                                disabled={producto.stock <= 0}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: "rgba(255,255,255,0.2)",
                                    color: "#fff",
                                    border: "2px solid rgba(255,255,255,0.3)",
                                    borderRadius: 12,
                                    padding: "1rem 2rem",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                    cursor: producto.stock > 0 ? "pointer" : "not-allowed",
                                    transition: "all 0.3s ease",
                                    opacity: producto.stock > 0 ? 1 : 0.5
                                }}
                            >
                                <FaHeart />
                                Reservar
                            </button>
                            <button
                                onClick={() => navigate("/productos")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: "rgba(255,255,255,0.2)",
                                    color: "#fff",
                                    border: "2px solid rgba(255,255,255,0.3)",
                                    borderRadius: 12,
                                    padding: "1rem 2rem",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                <FaHome />
                                Volver
                            </button>
                        </div>
                    </div>
                </div>

                {/* Productos relacionados */}
                <div style={{ padding: "2rem 4rem" }}>
                    <h3 style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#333",
                        marginBottom: "1.5rem",
                        textAlign: "center"
                    }}>
                        Productos Relacionados
                    </h3>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "1rem",
                        maxWidth: "800px",
                        margin: "0 auto"
                    }}>
                        {relacionados.map(rel => (
                            <div
                                key={rel.codigo_producto}
                                onClick={() => navigate(`/productos/${rel.codigo_producto}`)}
                                style={{
                                    background: "#fff",
                                    borderRadius: 12,
                                    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                                    padding: "1rem",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    border: "1px solid #f1f3f4"
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = "translateY(-3px)";
                                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = "none";
                                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.06)";
                                }}
                            >
                                <img
                                    src={rel.imagen || "https://img.icons8.com/fluency/96/fast-moving-consumer-goods.png"}
                                    alt={rel.nombre}
                                    style={{
                                        width: "100%",
                                        height: 120,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                        marginBottom: "0.75rem"
                                    }}
                                />
                                <h4 style={{
                                    fontWeight: 600,
                                    color: "#333",
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                    lineHeight: "1.3",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap"
                                }}>
                                    {rel.nombre}
                                </h4>
                                <p style={{ 
                                    color: "#667eea", 
                                    fontWeight: 700, 
                                    fontSize: "1rem",
                                    margin: 0
                                }}>
                                    ${rel.precio}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sección de comentarios */}
                <div style={{
                    background: "#f8f9fa",
                    padding: "3rem 4rem"
                }}>
                    <h3 style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: "#333",
                        marginBottom: "2rem",
                        textAlign: "center"
                    }}>
                        Opiniones de Clientes ({comentarios.length})
                    </h3>

                    {/* Formulario para nuevo comentario - Disponible para todos */}
                    <div style={{
                        background: "#fff",
                        borderRadius: 16,
                        padding: "2rem",
                        marginBottom: "2rem",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
                    }}>
                        <h4 style={{ marginBottom: "1rem", color: "#333" }}>Escribe tu opinión</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                            <span style={{ fontWeight: 600 }}>Calificación:</span>
                            {[1, 2, 3, 4, 5].map(i => (
                                <span
                                    key={i}
                                    style={{
                                        color: i <= valoracion ? "#ffc107" : "#e0e0e0",
                                        fontSize: 30,
                                        cursor: "pointer",
                                        transition: "color 0.2s"
                                    }}
                                    onClick={() => setValoracion(i)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <textarea
                            value={nuevoComentario}
                            onChange={e => setNuevoComentario(e.target.value)}
                            placeholder="Comparte tu experiencia con este producto..."
                            style={{
                                width: "100%",
                                minHeight: 100,
                                border: "2px solid #e9ecef",
                                borderRadius: 12,
                                padding: "1rem",
                                fontSize: "1rem",
                                resize: "vertical",
                                marginBottom: "1rem"
                            }}
                        />
                        <button
                            onClick={enviarComentario}
                            style={{
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "0.75rem 2rem",
                                fontWeight: 600,
                                fontSize: "1rem",
                                cursor: "pointer",
                                transition: "transform 0.2s"
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseOut={e => e.currentTarget.style.transform = "none"}
                        >
                            Publicar Comentario
                        </button>
                        {comentarioEnviado && (
                            <div style={{
                                color: "#28a745",
                                marginTop: "1rem",
                                fontWeight: 600,
                                background: "#d4edda",
                                padding: "0.5rem 1rem",
                                borderRadius: 6,
                                border: "1px solid #c3e6cb"
                            }}>
                                ¡Gracias por tu comentario! 🎉
                            </div>
                        )}
                    </div>

                    {/* Lista de comentarios */}
                    <div>
                        {comentarios.length === 0 ? (
                            <div style={{
                                textAlign: "center",
                                color: "#888",
                                fontSize: "1.2rem",
                                padding: "3rem",
                                background: "#fff",
                                borderRadius: 16,
                                boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
                            }}>
                                Sé el primero en comentar sobre este producto 💬
                            </div>
                        ) : (
                            <>
                                {comentariosPagina.map(comentario => (
                                    <ComentarioCard key={comentario.id_comentario} comentario={comentario} />
                                ))}
                                
                                {/* Paginación */}
                                {totalPaginas > 1 && (
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "1rem",
                                        marginTop: "2rem"
                                    }}>
                                        <button
                                            onClick={() => setPaginaComentarios(prev => Math.max(1, prev - 1))}
                                            disabled={paginaComentarios === 1}
                                            style={{
                                                background: "#667eea",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 8,
                                                padding: "0.5rem 1rem",
                                                cursor: paginaComentarios === 1 ? "not-allowed" : "pointer",
                                                opacity: paginaComentarios === 1 ? 0.5 : 1
                                            }}
                                        >
                                            Anterior
                                        </button>
                                        <span style={{ fontWeight: 600, color: "#667eea" }}>
                                            {paginaComentarios} de {totalPaginas}
                                        </span>
                                        <button
                                            onClick={() => setPaginaComentarios(prev => Math.min(totalPaginas, prev + 1))}
                                            disabled={paginaComentarios === totalPaginas}
                                            style={{
                                                background: "#667eea",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 8,
                                                padding: "0.5rem 1rem",
                                                cursor: paginaComentarios === totalPaginas ? "not-allowed" : "pointer",
                                                opacity: paginaComentarios === totalPaginas ? 0.5 : 1
                                            }}
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer style={{
                background: "#212529",
                color: "#fff",
                textAlign: "center",
                padding: "2rem",
                marginTop: "2rem"
            }}>
                <p style={{ margin: 0, fontSize: "1.1rem" }}>
                    © {new Date().getFullYear()} Sabor Integraciones. Todos los derechos reservados.
                </p>
            </footer>
        </div>
    );
};

export default VerDetalleProducto;