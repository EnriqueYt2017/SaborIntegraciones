/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Imagelogo from '../../assets/icono-logo.png';
function Productos() {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [precioMin, setPrecioMin] = useState("");
    const [precioMax, setPrecioMax] = useState("");
    const [categoria, setCategoria] = useState("");
    const [categorias, setCategorias] = useState([]);
    const [pagina, setPagina] = useState(1);

    const productosPorPagina = 9;

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && Object.keys(parsedUser).length > 0) {
                    setUser(parsedUser);
                    setPrimerNombre(parsedUser.primer_nombre || "");
                    setSegundoNombre(parsedUser.segundo_nombre || "");
                    setPrimerApellido(parsedUser.primer_apellido || "");
                    setSegundoApellido(parsedUser.segundo_apellido || "");
                    setDireccion(parsedUser.direccion || "");
                    setCorreo(parsedUser.correo || "");
                }
            } catch (error) {
                console.error("Error al parsear usuario:", error);
            }
        }
        axios.get("http://localhost:5000/productos")
            .then(response => {
                setProductos(response.data);
                const cats = Array.from(new Set(response.data.map(p => p.categoria).filter(Boolean)));
                setCategorias(cats);
            })
            .catch(error => console.error("Error al obtener productos:", error));
    }, []);
    // Funcion para cerrar sesión
    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    // Filtrado por nombre, descripción, precio y categoría
    const productosFiltrados = productos.filter((p) => {
        const coincideBusqueda =
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.descripcion.toLowerCase().includes(busqueda.toLowerCase());
        const coincidePrecioMin = precioMin === "" || p.precio >= Number(precioMin);
        const coincidePrecioMax = precioMax === "" || p.precio <= Number(precioMax);
        const coincideCategoria = categoria === "" || p.categoria === categoria;
        return coincideBusqueda && coincidePrecioMin && coincidePrecioMax && coincideCategoria;
    });

    // Paginación
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    const indiceInicio = (pagina - 1) * productosPorPagina;
    const productosPagina = productosFiltrados.slice(indiceInicio, indiceInicio + productosPorPagina);

    // Función para agregar al carrito
    const agregarAlCarrito = (producto) => {
        // Obtiene el carrito actual o uno vacío
        const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        // Busca si el producto ya está en el carrito
        const index = carrito.findIndex(item => item.codigo_producto === producto.codigo_producto);
        if (index >= 0) {
            // Si ya está, suma la cantidad
            carrito[index].cantidad += 1;
        } else {
            // Si no está, lo agrega con cantidad 1
            carrito.push({ ...producto, cantidad: 1 });
        }
        localStorage.setItem("carrito", JSON.stringify(carrito));
        alert("Producto agregado al carrito");
    };

    // Funcion para agregar a la reserva
    const agregarAReserva = (producto) => {
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

    // Cambiar de página y resetear a la 1 si cambian los filtros
    useEffect(() => {
        setPagina(1);
    }, [busqueda, precioMin, precioMax, categoria]);

    // --- NUEVO: estilos mejorados ---
    const mainContainerStyle = {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "linear-gradient(120deg, #f8fff8 0%, #e0f7fa 100%)",
        minHeight: "100vh",
        padding: "40px 0"
    };

    const filtroStyle = {
        width: 300,
        background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        padding: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#fff",
        boxShadow: "2px 0 16px #38f9d720",
        height: "fit-content",
        margin: "0 32px 0 0",
        borderRadius: 18,
        position: "sticky",
        top: 40
    };

    const gridContainerStyle = {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 24px"
    };

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 32,
        width: "100%",
        maxWidth: 1100,
        marginBottom: 40
    };

    const cardStyle = {
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 24px #43e97b25",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 28,
        minHeight: 300,
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        border: "1px solid #e0f2f1"
    };

    const cardHoverStyle = {
        transform: "translateY(-6px) scale(1.03)",
        boxShadow: "0 8px 32px #43e97b40"
    };
    // Agrega este bloque antes del return
    const responsiveStyles = `
@media (max-width: 1200px) {
    .productos-grid-container {
        max-width: 900px !important;
    }
}
@media (max-width: 900px) {
    .productos-main-container {
        flex-direction: column !important;
        align-items: stretch !important;
        padding: 24px 0 !important;
    }
    .productos-filtro {
        margin: 0 0 24px 0 !important;
        width: 100% !important;
        position: static !important;
        top: unset !important;
    }
    .productos-grid-container {
        padding: 0 8px !important;
        max-width: 100% !important;
    }
    .productos-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
        gap: 20px !important;
    }
}
@media (max-width: 600px) {
    .productos-filtro {
        padding: 16px !important;
    }
    .productos-grid {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
    }
    .productos-grid-container h2 {
        font-size: 22px !important;
    }
}
`;


    // Estado para hover en tarjetas
    const [hoveredCard, setHoveredCard] = useState(null);

    return (
        <div>
            <style>{responsiveStyles}</style>
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
            {/* --- NUEVO: Contenedor principal con filtro y grilla --- */}
            <div className="productos-main-container" style={mainContainerStyle}>
                {/* Filtro a la izquierda */}
                <div className="productos-filtro" style={filtroStyle}>
                    <h2 style={{ marginBottom: 24, fontWeight: 800, letterSpacing: 1 }}>Filtrar Productos</h2>
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 8,
                            border: "none",
                            fontSize: 16,
                            marginBottom: 12,
                            outline: "none",
                            boxShadow: "0 2px 8px #38f9d720"
                        }}
                    />
                    <input
                        type="number"
                        placeholder="Precio mínimo"
                        value={precioMin}
                        onChange={e => setPrecioMin(e.target.value)}
                        style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 8,
                            border: "none",
                            fontSize: 16,
                            marginBottom: 12,
                            outline: "none",
                            boxShadow: "0 2px 8px #38f9d720"
                        }}
                        min={0}
                    />
                    <input
                        type="number"
                        placeholder="Precio máximo"
                        value={precioMax}
                        onChange={e => setPrecioMax(e.target.value)}
                        style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 8,
                            border: "none",
                            fontSize: 16,
                            marginBottom: 12,
                            outline: "none",
                            boxShadow: "0 2px 8px #38f9d720"
                        }}
                        min={0}
                    />
                    <select
                        value={categoria}
                        onChange={e => setCategoria(e.target.value)}
                        style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 8,
                            border: "none",
                            fontSize: 16,
                            marginBottom: 12,
                            outline: "none",
                            boxShadow: "0 2px 8px #38f9d720"
                        }}
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Grilla de productos */}
                <div className="productos-grid-container" style={gridContainerStyle}>
                    <h2 style={{
                        fontWeight: 800,
                        fontSize: 32,
                        marginBottom: 32,
                        color: "#222"
                    }}>
                        Nuestros Productos
                    </h2>
                    <div className="productos-grid" style={gridStyle}>
                        {productosPagina.length > 0 ? productosPagina.map(producto => (
                            <div
                                key={producto.codigo_producto}
                                style={{
                                    ...cardStyle,
                                    ...(hoveredCard === producto.codigo_producto ? cardHoverStyle : {})
                                }}
                                onMouseEnter={() => setHoveredCard(producto.codigo_producto)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                {/* Icono de producto */}
                                <div style={{
                                    fontSize: 56,
                                    marginBottom: 18,
                                    filter: "drop-shadow(0 2px 8px #43e97b30)"
                                }}>
                                    <span role="img" aria-label="producto" style={{ fontSize: 56 }}>🛍️</span>
                                </div>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: 20,
                                    marginBottom: 8,
                                    textAlign: "center",
                                    color: "#222"
                                }}>
                                    {producto.nombre}
                                </div>
                                <div style={{
                                    color: "#43e97b",
                                    fontWeight: 700,
                                    fontSize: 18,
                                    marginBottom: 20
                                }}>
                                    ${producto.precio}
                                </div>
                                <div style={{
                                    color: "#888",
                                    fontSize: 15,
                                    marginBottom: 10,
                                    textAlign: "center"
                                }}>
                                    {producto.categoria}
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                                    <button style={{
                                        background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "10px 24px",
                                        fontWeight: 700,
                                        fontSize: 16,
                                        cursor: "pointer",
                                        boxShadow: "0 2px 8px #43e97b30",
                                        transition: "background 0.2s"
                                    }}>
                                        Ver información
                                    </button>
                                    <button className="carrito" style={{
                                        background: "#fff",
                                        border: "2px solid #43e97b",
                                        borderRadius: 8,
                                        padding: "10px 16px",
                                        color: "#43e97b",
                                        fontWeight: 700,
                                        fontSize: 18,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        boxShadow: "0 2px 8px #43e97b10",
                                        transition: "border 0.2s"
                                    }}
                                        onClick={() => agregarAlCarrito(producto)}
                                    >
                                        <span role="img" aria-label="carrito" style={{ fontSize: 22 }}>🛒</span>
                                    </button>
                                    <button className="reserva" style={{
                                        background: "#fff",
                                        border: "2px solid #e67e22",
                                        borderRadius: 8,
                                        padding: "10px 16px",
                                        color: "#e67e22",
                                        fontWeight: 700,
                                        fontSize: 18,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        boxShadow: "0 2px 8px #e67e2210",
                                        transition: "border 0.2s"
                                    }}
                                        onClick={() => agregarAReserva(producto)}
                                    >
                                        <span role="img" aria-label="reserva" style={{ fontSize: 22 }}>📦</span>
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#aaa", fontSize: 20 }}>
                                No se encontraron productos.
                            </div>
                        )}
                    </div>
                    {/* Paginador */}
                    {totalPaginas > 1 && (
                        <div style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            marginBottom: 24
                        }}>
                            <button
                                onClick={() => setPagina(p => Math.max(1, p - 1))}
                                disabled={pagina === 1}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: pagina === 1 ? "#eee" : "#43e97b",
                                    color: pagina === 1 ? "#aaa" : "#fff",
                                    fontWeight: 700,
                                    cursor: pagina === 1 ? "not-allowed" : "pointer",
                                    transition: "background 0.2s"
                                }}
                            >
                                {"<"}
                            </button>
                            {[...Array(totalPaginas)].map((_, idx) => (
                                <button
                                    key={idx + 1}
                                    onClick={() => setPagina(idx + 1)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: 6,
                                        border: "none",
                                        background: pagina === idx + 1 ? "#38f9d7" : "#fff",
                                        color: pagina === idx + 1 ? "#fff" : "#43e97b",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        boxShadow: pagina === idx + 1 ? "0 2px 8px #38f9d730" : "none",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                                disabled={pagina === totalPaginas}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: pagina === totalPaginas ? "#eee" : "#43e97b",
                                    color: pagina === totalPaginas ? "#aaa" : "#fff",
                                    fontWeight: 700,
                                    cursor: pagina === totalPaginas ? "not-allowed" : "pointer",
                                    transition: "background 0.2s"
                                }}
                            >
                                {">"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Productos;
