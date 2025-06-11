/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import Imagelogo from '../../assets/icono-logo.png';
import { useNavigate } from "react-router-dom";
import { FaPen, FaTrashAlt, FaComments } from "react-icons/fa";
const PLANES_POR_PAGINA = 6;

const Entrenamiento = () => {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nuevoPlan, setNuevoPlan] = useState({
        NOMBRE: '',
        DESCRIPCION: '',
        FECHAINICIO: '',
        FECHAFIN: '',
        FRECUENCIA: '',
        DURACION: '',
        NIVEL: '',
        TIPO: '',
        OBJETIVO: '',
        PRECIO: '',
        RUT: ''
    });
    const [filtroNombre, setFiltroNombre] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const [suscripciones, setSuscripciones] = useState([]);
    const [editando, setEditando] = useState(false);
    const [planEditandoId, setPlanEditandoId] = useState(null);


    useEffect(() => {
        fetch("http://localhost:5000/api/planes-entrenamiento")
            .then(res => res.json())
            .then(data => {
                setPlanes(data);
                setLoading(false);
            });
        const userData = localStorage.getItem("user");
        if (userData && userData !== "undefined" && userData !== "{}" && userData !== "null") {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser); // <-- AGREGA ESTA LÍNEA
                fetch(`http://localhost:5000/api/suscripciones/${parsedUser.rut || parsedUser.RUT}`)
                    .then(res => res.json())
                    .then(data => setSuscripciones(data || []));
            } catch (error) {
                console.error("Error al parsear usuario:", error);
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, []);


    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    const handleChange = e => {
        setNuevoPlan({ ...nuevoPlan, [e.target.name]: e.target.value });
    };

    // Permisos
    const puedeEditar = user && (user.id_rol === 2 || user.id_rol === 6);

    // Editar plan
    const handleEditar = (plan) => {
        setNuevoPlan({
            NOMBRE: plan.NOMBRE,
            DESCRIPCION: plan.DESCRIPCION,
            FECHAINICIO: plan.FECHAINICIO ? plan.FECHAINICIO.substring(0, 10) : '',
            FECHAFIN: plan.FECHAFIN ? plan.FECHAFIN.substring(0, 10) : '',
            FRECUENCIA: plan.FRECUENCIA,
            DURACION: plan.DURACION,
            NIVEL: plan.NIVEL,
            TIPO: plan.TIPO,
            OBJETIVO: plan.OBJETIVO,
            PRECIO: plan.PRECIO || '',
            RUT: plan.RUT
        });
        setEditando(true);
        setPlanEditandoId(plan.ID_PLAN_ENTRENAMIENTO);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Cancelar edición
    const handleCancelarEdicion = () => {
        setNuevoPlan({
            NOMBRE: '',
            DESCRIPCION: '',
            FECHAINICIO: '',
            FECHAFIN: '',
            FRECUENCIA: '',
            DURACION: '',
            NIVEL: '',
            TIPO: '',
            OBJETIVO: '',
            PRECIO: '',
            RUT: ''
        });
        setEditando(false);
        setPlanEditandoId(null);
    };


    const agregarPlanAlCarrito = async (plan) => {
        // El carrito puede tener productos y planes, diferenciados por tipo
        const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        // Evita duplicados de planes
        if (carrito.some(item => item.tipo === "plan_entrenamiento" && item.ID_PLAN_ENTRENAMIENTO === plan.ID_PLAN_ENTRENAMIENTO)) {
            alert("Este plan ya está en el carrito.");
            return;
        }

        carrito.push({
            tipo: "plan_entrenamiento",
            ID_PLAN_ENTRENAMIENTO: plan.ID_PLAN_ENTRENAMIENTO,
            nombre: plan.NOMBRE,
            descripcion: plan.DESCRIPCION,
            precio: Number(plan.PRECIO),
            cantidad: 1, // Siempre 1 para planes
            planData: plan // Guarda todo el plan por si lo necesitas luego
        });

        localStorage.setItem("carrito", JSON.stringify(carrito));
        alert("Plan agregado al carrito. Ve al carrito para pagar tu suscripción.");

        // Guardar suscripción en la base de datos (solo si quieres hacerlo al agregar al carrito, normalmente es después del pago)
        /*         await fetch("http://localhost:5000/api/suscripciones", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ID_PLAN: plan.ID_PLAN_ENTRENAMIENTO,
                        NOMBRE: plan.NOMBRE,
                        DESCRIPCION: plan.DESCRIPCION,
                        FECHAINICIO: plan.FECHAINICIO,
                        FECHAFIN: plan.FECHAFIN,
                        OBJETIVO: plan.OBJETIVO,
                        RUT: user.rut || user.RUT,
                        TIPO_PLAN: "ENTRENAMIENTO"
                    })
                }); */
    };


    // Eliminar plan
    const handleEliminar = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este plan?")) return;
        await fetch(`http://localhost:5000/api/planes-entrenamiento/${id}`, { method: "DELETE" });
        setPlanes(planes.filter(p => p.ID_PLAN_ENTRENAMIENTO !== id));
        // Si estabas editando este plan, cancela edición
        if (editando && planEditandoId === id) handleCancelarEdicion();
    };

    // Crear plan
    const handleSubmit = async e => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem("user"));
        const rutUsuario = user?.rut || user?.RUT || "";
        const nuevoPlanConRut = { ...nuevoPlan, RUT: rutUsuario };

        if (editando && planEditandoId) {
            // Actualizar plan existente
            const res = await fetch(`http://localhost:5000/api/planes-entrenamiento/${planEditandoId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nuevoPlanConRut)
            });
            if (res.ok) {
                // Actualiza el plan en el estado
                setPlanes(planes.map(p =>
                    p.ID_PLAN_ENTRENAMIENTO === planEditandoId
                        ? { ...p, ...nuevoPlanConRut, ID_PLAN_ENTRENAMIENTO: planEditandoId }
                        : p
                ));
                handleCancelarEdicion();
            } else {
                alert("Error al actualizar el plan");
            }
        } else {
            // Crear nuevo plan
            const res = await fetch("http://localhost:5000/api/planes-entrenamiento", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nuevoPlanConRut)
            });
            if (res.ok) {
                const planAgregado = await res.json();
                setPlanes([...planes, planAgregado]);
                setNuevoPlan({
                    NOMBRE: '',
                    DESCRIPCION: '',
                    FECHAINICIO: '',
                    FECHAFIN: '',
                    FRECUENCIA: '',
                    DURACION: '',
                    NIVEL: '',
                    TIPO: '',
                    OBJETIVO: '',
                    PRECIO: '',
                    RUT: ''
                });
            } else {
                alert("Error al agregar el plan");
            }
        }
    };

    // Foro
    const irAlForo = () => {
        navigate("/planes/foros");
    };

    // Mensaje del preparador físico al cliente (puedes expandir esto a chat real)
    const handleMensajeCliente = (plan) => {
        alert(`Enviar mensaje al cliente del plan: ${plan.NOMBRE} (RUT: ${plan.RUT})`);
    };

    const filteredPlanes = planes.filter(plan =>
        plan.NOMBRE.toLowerCase().includes(filtroNombre.toLowerCase())
    );

    // Paginación
    const totalPaginas = Math.ceil(filteredPlanes.length / PLANES_POR_PAGINA);
    const startIdx = (paginaActual - 1) * PLANES_POR_PAGINA;
    const planesPagina = filteredPlanes.slice(startIdx, startIdx + PLANES_POR_PAGINA);

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina);
        }
    };

    if (loading) return <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#555', padding: 40 }}>Cargando planes de entrenamiento...</div>;

    const badgeStyle = {
        background: "#f0fdf4",
        color: "#22c55e",
        borderRadius: 6,
        padding: "4px 10px",
        fontWeight: 600,
        fontSize: 13,
        border: "1px solid #bbf7d0"
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
                            <a href="/carrito" className="nav-link">
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
                        <li className="nav-item">
                            <button
                                onClick={irAlForo}
                                style={{
                                    marginLeft: 16,
                                    background: "#43e97b",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "8px 18px",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer"
                                }}>
                                Foro de Clientes
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
            <div style={{
                fontFamily: 'Inter, sans-serif',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
                padding: 0,
                margin: 0
            }}>
                <header style={{
                    background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                    color: '#fff',
                    padding: '2rem 0 1.5rem 2rem',
                    marginBottom: 32,
                    boxShadow: '0 2px 8px rgba(67,233,123,0.08)'
                }}>
                    <h1 style={{ margin: 0, fontWeight: 700, fontSize: 36, letterSpacing: 1 }}>Planes de Entrenamiento</h1>
                </header>
                <div style={{
                    display: 'flex',
                    maxWidth: 1300,
                    margin: '0 auto',
                    gap: 32,
                    alignItems: 'flex-start'
                }}>
                    {/* Sidebar de filtrado */}
                    <aside style={{
                        minWidth: 260,
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                        padding: 24,
                        marginTop: 0
                    }}>
                        <h2 style={{ fontSize: 20, marginBottom: 18, color: '#43e97b', fontWeight: 600 }}>Filtrar</h2>
                        <label style={{ fontWeight: 500, color: '#444', fontSize: 15 }}>Nombre del plan</label>
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={filtroNombre}
                            onChange={e => {
                                setFiltroNombre(e.target.value);
                                setPaginaActual(1);
                            }}
                            style={{
                                width: '100%',
                                marginTop: 8,
                                marginBottom: 12,
                                padding: '10px 12px',
                                border: '1px solid #d1e3ea',
                                borderRadius: 6,
                                fontSize: 15,
                                outline: 'none',
                                transition: 'border 0.2s'
                            }}
                        />
                    </aside>

                    {/* Contenido principal */}

                    <main style={{ flex: 1 }}>
                        {/* Formulario para agregar/editar plan */}
                        {puedeEditar && (
                            <form onSubmit={handleSubmit} style={{
                                marginBottom: 40,
                                background: '#fff',
                                border: '1px solid #e6eaf0',
                                boxShadow: '0 2px 8px rgba(67,233,123,0.06)',
                                padding: 24,
                                borderRadius: 12,
                                maxWidth: 700
                            }}>
                                <h2 style={{ color: '#43e97b', fontWeight: 600, fontSize: 22, marginBottom: 18 }}>
                                    {editando ? "Editar plan" : "Agregar nuevo plan"}
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <input name="NOMBRE" placeholder="Nombre" value={nuevoPlan.NOMBRE} onChange={handleChange} required style={inputStyle} />
                                    <input name="DESCRIPCION" placeholder="Descripción" value={nuevoPlan.DESCRIPCION} onChange={handleChange} required style={inputStyle} />
                                    <input name="FECHAINICIO" type="date" placeholder="Fecha inicio" value={nuevoPlan.FECHAINICIO} onChange={handleChange} required style={inputStyle} />
                                    <input name="FECHAFIN" type="date" placeholder="Fecha fin" value={nuevoPlan.FECHAFIN} onChange={handleChange} required style={inputStyle} />
                                    <input name="FRECUENCIA" placeholder="Frecuencia" value={nuevoPlan.FRECUENCIA} onChange={handleChange} required style={inputStyle} />
                                    <input name="DURACION" type="number" placeholder="Duración (min)" value={nuevoPlan.DURACION} onChange={handleChange} required style={inputStyle} />
                                    <input name="NIVEL" placeholder="Nivel" value={nuevoPlan.NIVEL} onChange={handleChange} required style={inputStyle} />
                                    <input name="TIPO" placeholder="Tipo" value={nuevoPlan.TIPO} onChange={handleChange} required style={inputStyle} />
                                    <input name="OBJETIVO" placeholder="Objetivo" value={nuevoPlan.OBJETIVO} onChange={handleChange} required style={inputStyle} />
                                    <input name="PRECIO" type="number" placeholder="Precio" value={nuevoPlan.PRECIO} onChange={handleChange} required style={inputStyle} />
                                </div>
                                <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                                    <button type="submit" style={{
                                        background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                                        color: "#fff",
                                        border: "none",
                                        padding: "12px 32px",
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        fontSize: 16,
                                        cursor: "pointer",
                                        boxShadow: '0 2px 8px rgba(67,233,123,0.10)'
                                    }}>
                                        {editando ? "Guardar cambios" : "Agregar Plan"}
                                    </button>
                                    {editando && (
                                        <button
                                            type="button"
                                            onClick={handleCancelarEdicion}
                                            style={{
                                                background: "#e5e7eb",
                                                color: "#222",
                                                padding: "12px 32px",
                                                borderRadius: 6,
                                                border: "none",
                                                fontWeight: 600,
                                                fontSize: 16,
                                                cursor: "pointer",
                                                marginLeft: 8,
                                                boxShadow: "0 1px 4px #43e97b10"
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}

                        {/* Grid de cards para los planes */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: 28,
                            marginBottom: 32
                        }}>
                            {planesPagina.map(plan => {
                                const yaSuscrito = suscripciones.some(
                                    s => s.ID_PLAN === plan.ID_PLAN_ENTRENAMIENTO && String(s.RUT) === String(user.rut || user.RUT)
                                );
                                return (

                                    <div key={plan.ID_PLAN_ENTRENAMIENTO} style={{
                                        background: "#fff",
                                        borderRadius: 14,
                                        boxShadow: "0 2px 12px rgba(67,233,123,0.09)",
                                        padding: 28,
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative",
                                        border: "1px solid #e6eaf0"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                            <h3 style={{ color: "#43e97b", fontWeight: 700, fontSize: 22, margin: 0, flex: 1 }}>{plan.NOMBRE}</h3>
                                            {puedeEditar && (
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button
                                                        title="Editar"
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#43e97b",
                                                            cursor: "pointer",
                                                            fontSize: 18,
                                                            padding: 4
                                                        }}
                                                        onClick={() => handleEditar(plan)}
                                                    >
                                                        <FaPen />
                                                    </button>
                                                    <button
                                                        title="Eliminar"
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#ef4444",
                                                            cursor: "pointer",
                                                            fontSize: 18,
                                                            padding: 4
                                                        }}
                                                        onClick={() => handleEliminar(plan.ID_PLAN_ENTRENAMIENTO)}
                                                    >
                                                        <FaTrashAlt />
                                                    </button>
                                                    <button
                                                        title="Mensaje al cliente"
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#38b6ff",
                                                            cursor: "pointer",
                                                            fontSize: 18,
                                                            padding: 4
                                                        }}
                                                        onClick={() => handleMensajeCliente(plan)}
                                                    >
                                                        <FaComments />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ color: "#444", fontSize: 15, marginBottom: 10 }}>{plan.DESCRIPCION}</div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                                            <span style={badgeStyle}>Inicio: {plan.FECHAINICIO ? plan.FECHAINICIO.substring(0, 10) : ''}</span>
                                            <span style={badgeStyle}>Fin: {plan.FECHAFIN ? plan.FECHAFIN.substring(0, 10) : ''}</span>
                                            <span style={badgeStyle}>Frecuencia: {plan.FRECUENCIA}</span>
                                            <span style={badgeStyle}>Duración: {plan.DURACION} min</span>
                                            <span style={badgeStyle}>Nivel: {plan.NIVEL}</span>
                                            <span style={badgeStyle}>Tipo: {plan.TIPO}</span>
                                            <span style={badgeStyle}>Objetivo: {plan.OBJETIVO}</span>
                                        </div>
                                        <div style={{ fontWeight: 700, color: "#43e97b", fontSize: 18, marginBottom: 18 }}>
                                            Precio: ${plan.PRECIO}
                                        </div>
                                        <button
                                            disabled={yaSuscrito}
                                            style={{
                                                background: yaSuscrito ? "#e0e0e0" : "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                                                color: yaSuscrito ? "#888" : "#fff",
                                                cursor: yaSuscrito ? "not-allowed" : "pointer"
                                            }}
                                            onClick={() => {
                                                if (!yaSuscrito) agregarPlanAlCarrito(plan);
                                            }}
                                        >
                                            {yaSuscrito ? "Ya está suscrito" : "Suscribirme"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Paginador */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 32,
                            gap: 12
                        }}>
                            <button
                                onClick={() => cambiarPagina(paginaActual - 1)}
                                disabled={paginaActual === 1}
                                style={paginadorBtnStyle}
                            >Anterior</button>
                            {Array.from({ length: totalPaginas }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => cambiarPagina(i + 1)}
                                    style={{
                                        ...paginadorBtnStyle,
                                        background: paginaActual === i + 1 ? 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)' : '#fff',
                                        color: paginaActual === i + 1 ? '#fff' : '#43e97b',
                                        fontWeight: paginaActual === i + 1 ? 700 : 500
                                    }}
                                >{i + 1}</button>
                            ))}
                            <button
                                onClick={() => cambiarPagina(paginaActual + 1)}
                                disabled={paginaActual === totalPaginas}
                                style={paginadorBtnStyle}
                            >Siguiente</button>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    marginBottom: 0,
    padding: '10px 12px',
    border: '1px solid #d1e3ea',
    borderRadius: 6,
    fontSize: 15,
    outline: 'none',
    marginTop: 0,
    transition: 'border 0.2s'
};

const paginadorBtnStyle = {
    border: '1px solid #43e97b',
    background: '#fff',
    color: '#43e97b',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 15,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background 0.2s, color 0.2s'
};

export default Entrenamiento;