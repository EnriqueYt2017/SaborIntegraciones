/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

import Imagelogo from '../../assets/icono-logo.png';
import './Home.css';
function Home() {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();
    const [productosDestacados, setProductosDestacados] = useState([]);
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [valoracion, setValoracion] = useState(5);
    const [comentarioEnviado, setComentarioEnviado] = useState(false);

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

    useEffect(() => {
        axios.get('http://localhost:5000/api/comentarios')
            .then(res => setComentarios(res.data))
            .catch(() => setComentarios([]));
    }, []);

    // Obtener productos y seleccionar 3 aleatorios
    useEffect(() => {
        axios.get('/api/productos') // Ajusta la ruta según tu backend
            .then(res => {
                const productos = res.data;
                // Seleccionar 3 productos aleatorios
                const seleccionados = productos
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);
                setProductosDestacados(seleccionados);
            })
            .catch(err => {
                setProductosDestacados([]);
            });
    },
        []);

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null); // ✅ Limpia el estado
        navigate("/login"); // ✅ Redirige al login
    };
    // Enviar comentario
    const enviarComentario = async () => {
        if (!nuevoComentario.trim()) return;
        try {
            await axios.post('http://localhost:5000/api/comentarios', {
                valoracion,
                texto: nuevoComentario
            });
            setNuevoComentario("");
            setValoracion(5);
            setComentarioEnviado(true);
            // Recargar comentarios
            const res = await axios.get('http://localhost:5000/api/comentarios');
            setComentarios(res.data);
            setTimeout(() => setComentarioEnviado(false), 2000);
        } catch (err) {
            alert("No se pudo enviar el comentario.");
        }
    };

    // Renderizar estrellas
    const renderStars = (count) => (
        <span>
            {[1, 2, 3, 4, 5].map(i =>
                <span key={i} style={{ color: i <= count ? "#ffc107" : "#e0e0e0", fontSize: 22 }}>★</span>
            )}
        </span>
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
                        <li className="nav-item"><a href="/#" className="nav-link">Inicio</a></li>
                        <li className="nav-item"><a href="/productos" className="nav-link">Productos</a></li>
                        <li className="nav-item"><a href="/servicios" className="nav-link">Servicios</a></li>
                        <li className="nav-item"><a href="/reserva" className="nav-link">Reservas</a></li>
                        <li className="nav-item"><a href="/contactenos" className="nav-link">Contáctenos</a></li>
                    </ul>
                </nav>
            </div>
            {/* Banner Principal */}
            <div
                style={{
                    width: "100%",
                    minHeight: "320px",
                    backgroundImage: "url('https://static.vecteezy.com/system/resources/previews/001/939/675/large_2x/young-people-doing-physical-activity-outdoors-at-the-park-healthy-lifestyle-and-fitness-free-vector.jpg')",
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
                    overflow: "hidden"
                }}
            >
                {/* Overlay para oscurecer la imagen y mejorar la legibilidad del texto */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0,0,0,0.45)",
                        zIndex: 1,
                    }}
                />
                <div style={{ maxWidth: 800, textAlign: "center", position: "relative", zIndex: 2 }}>
                    <h1 style={{ fontWeight: 800, fontSize: "2.5rem", marginBottom: "1rem", letterSpacing: 1 }}>
                        Bienvenido a Sabor Integraciones
                    </h1>
                    <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
                        Tu tienda de productos deportivos y vida sana. Descubre variedad, calidad y atención personalizada.
                    </p>
                    <button
                        style={{
                            backgroundColor: "#fff",
                            color: "#007bff",
                            border: "none",
                            padding: "0.75rem 2.5rem",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px #0002",
                            transition: "background 0.2s, color 0.2s"
                        }}
                        onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
                    >
                        Conoce más
                    </button>
                </div>
            </div>

            {/* Sobre Nosotros */}

            {/* Sobre Nosotros */}
            <div className="containerss" style={{ margin: "2.5rem 0 1.5rem 0", textAlign: "center" }}>
                <h2 style={{ fontWeight: 700, color: "#212529", letterSpacing: 1 }}>Sobre Nosotros</h2>
            </div>
            <div className="container" style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: "2.5rem",
                flexWrap: "wrap",
                marginBottom: "2rem"
            }}>
                <div style={{
                    flex: 1,
                    padding: "1.5rem 2rem",
                    maxWidth: "600px",
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 2px 12px #e0e0e0"
                }}>
                    <h3 style={{ textAlign: "center", fontWeight: 600, color: "#007bff" }}>Bienvenido a Sabor Integraciones</h3>
                    <p style={{ fontSize: "1.1rem", color: "#444" }}>
                        Somos SportFit, una empresa dedicada a la venta de productos deportivos, ofrecimos una amplia gama de artículos para diversas disciplinas y actividades físicas. Nos destacamos por nuestra atención personalizada y la calidad de sus productos. Nuestros clientes pueden realizar compras en la tienda física o a través de nuestra página web, con opciones como entrega a domicilio y reserva de productos para recoger en tienda.
                    </p>
                    <p style={{ color: "#444" }}>
                        <b>Misión:</b> Ser líderes en productos para la vida sana, promoviendo bienestar y salud con calidad, excelencia e innovación.
                    </p>
                    <p style={{ color: "#444" }}>
                        <b>Visión:</b> Todos nuestros muebles de palets son 100% Ecofriendly, permitiendo a nuestra empresa sea una empresa con huella verde.
                    </p>
                </div>
                <div style={{
                    width: "320px",
                    minWidth: "220px",
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 12px #e0e0e0"
                }}>
                    <h4 style={{ textAlign: "center", fontWeight: 600, color: "#28a745" }}>Productos Destacados</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "1.05rem", color: "#444" }}>
                        {productosDestacados.length === 0 && (
                            <li style={{ margin: "0.5rem 0", padding: "0.5rem" }}>Cargando...</li>
                        )}
                        {productosDestacados.map(producto => (
                            <li key={producto.codigo_producto || producto.id} style={{ display: "flex", alignItems: "center", margin: "0.5rem 0", padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                                <img
                                    src={producto.imagen || "https://img.icons8.com/fluency/48/fast-moving-consumer-goods.png"}
                                    alt={producto.nombre}
                                    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, marginRight: 12, background: "#f0f0f0" }}
                                />
                                <span>{producto.nombre}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {/* Servicios */}
            <div className="containerss" style={{ marginTop: "2rem", textAlign: "center" }}>
                <h2 style={{ fontWeight: 700, color: "#212529", letterSpacing: 1 }}>Servicios</h2>
            </div>
            <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "2.5rem",
                margin: "2rem 0",
                flexWrap: "wrap"
            }}>

                {/* Planes Entrenamiento */}
                <div style={{
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 2px 12px #e0e0e0",
                    width: "320px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "2rem 1.5rem"
                }}>
                    <h3 style={{ marginBottom: "0.5rem", color: "#007bff", fontWeight: 600 }}>Planes</h3>
                    <h4 style={{ marginBottom: "1rem", color: "#343a40" }}>Entrenamiento</h4>
                    <div style={{
                        width: "100%",
                        height: "160px",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        background: "linear-gradient(135deg, #0f2027 0%, #2c5364 100%)"
                    }}>
                        {/* Fondo épico animado */}
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: 1,
                            background: "radial-gradient(circle at 70% 30%, #00c6ff88 0%, #0072ff44 60%, transparent 100%)"
                        }} />
                        <div style={{
                            position: "absolute",
                            bottom: "-30px",
                            right: "-30px",
                            width: "100px",
                            height: "100px",
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "50%",
                            filter: "blur(8px)",
                            zIndex: 1
                        }} />
                        <img src="https://img.icons8.com/color/96/000000/dumbbell.png" alt="Entrenamiento" style={{ width: 80, opacity: 0.92, zIndex: 2, filter: "drop-shadow(0 4px 24px #00c6ff88)" }} />
                    </div>
                    <button
                        style={{
                            backgroundColor: "#007bff",
                            color: "#fff",
                            border: "none",
                            padding: "0.5rem 1.5rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: 500,
                            boxShadow: "0 2px 8px #007bff22"
                        }}
                        onClick={() => navigate("/planes/entrenamiento")}
                    >
                        Ver Planes
                    </button>
                </div>
                {/* Planes Nutricion */}
                <div style={{
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 2px 12px #e0e0e0",
                    width: "320px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "2rem 1.5rem"
                }}>
                    <h3 style={{ marginBottom: "0.5rem", color: "#28a745", fontWeight: 600 }}>Planes</h3>
                    <h4 style={{ marginBottom: "1rem", color: "#343a40" }}>Nutrición</h4>
                    <div style={{
                        width: "100%",
                        height: "160px",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                    }}>
                        {/* Fondo épico animado */}
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: 1,
                            background: "radial-gradient(circle at 30% 70%, #fffde488 0%, #f9d42344 60%, transparent 100%)"
                        }} />
                        <div style={{
                            position: "absolute",
                            top: "-30px",
                            left: "-30px",
                            width: "100px",
                            height: "100px",
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "50%",
                            filter: "blur(8px)",
                            zIndex: 1
                        }} />
                        <img src="https://img.icons8.com/color/96/000000/avocado.png" alt="Nutrición" style={{ width: 80, opacity: 0.92, zIndex: 2, filter: "drop-shadow(0 4px 24px #38ef7d88)" }} />
                    </div>
                    <button
                        style={{
                            backgroundColor: "#28a745",
                            color: "#fff",
                            border: "none",
                            padding: "0.5rem 1.5rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: 500,
                            boxShadow: "0 2px 8px #28a74522"
                        }}
                        onClick={() => navigate("/planes/nutricion")}
                    >
                        Ver Planes
                    </button>
                </div>
            </div>
            {/* Beneficios */}
            <div style={{ textAlign: "center", margin: "2rem 0 1.5rem 0" }}>
                <h2 className='Beneficio-section' style={{ margin: 0, fontWeight: 700, color: "#212529" }}>Beneficios</h2>
            </div>
            <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "3rem",
                flexWrap: "wrap",
                marginBottom: "2rem"
            }}>
                {/* Variedad de Productos */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 180,
                    background: "#fff",
                    borderRadius: "10px",
                    padding: "1.2rem 1rem",
                    boxShadow: "0 2px 8px #e0e0e0"
                }}>
                    <img src="https://img.icons8.com/color/96/000000/shopping-basket-2.png" alt="Variedad de Productos" style={{ width: 72, height: 72, marginBottom: 12 }} />
                    <span style={{ fontWeight: 500, textAlign: "center", color: "#007bff" }}>Variedad de Productos</span>
                </div>
                {/* Entrega a Domicilio */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 180,
                    background: "#fff",
                    borderRadius: "10px",
                    padding: "1.2rem 1rem",
                    boxShadow: "0 2px 8px #e0e0e0"
                }}>
                    <img src="https://img.icons8.com/color/96/000000/delivery.png" alt="Entrega a Domicilio" style={{ width: 72, height: 72, marginBottom: 12 }} />
                    <span style={{ fontWeight: 500, textAlign: "center", color: "#28a745" }}>Entrega a Domicilio</span>
                </div>
                {/* Descuentos */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 180,
                    background: "#fff",
                    borderRadius: "10px",
                    padding: "1.2rem 1rem",
                    boxShadow: "0 2px 8px #e0e0e0"
                }}>
                    <img src="https://img.icons8.com/color/96/000000/discount--v1.png" alt="Descuentos" style={{ width: 72, height: 72, marginBottom: 12 }} />
                    <span style={{ fontWeight: 500, textAlign: "center", color: "#ffc107" }}>Descuentos</span>
                </div>
                {/* Calidad Garantizada */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 180,
                    background: "#fff",
                    borderRadius: "10px",
                    padding: "1.2rem 1rem",
                    boxShadow: "0 2px 8px #e0e0e0"
                }}>
                    <img src="https://img.icons8.com/color/96/000000/approval--v1.png" alt="Calidad Garantizada" style={{ width: 72, height: 72, marginBottom: 12 }} />
                    <span style={{ fontWeight: 500, textAlign: "center", color: "#17a2b8" }}>Calidad Garantizada</span>
                </div>
                {/* Reserva en tienda */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 180,
                    background: "#fff",
                    borderRadius: "10px",
                    padding: "1.2rem 1rem",
                    boxShadow: "0 2px 8px #e0e0e0"
                }}>
                    <img src="https://img.icons8.com/color/96/000000/shop.png" alt="Reserva en tienda" style={{ width: 72, height: 72, marginBottom: 12 }} />
                    <span style={{ fontWeight: 500, textAlign: "center", color: "#6f42c1" }}>Reserva en tienda</span>
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
}

export default Home;
