import React, { useEffect, useState } from 'react';
import Imagelogo from '../../assets/icono-logo.png';
import { useNavigate } from "react-router-dom";
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
        RUT: ''
    });
    const [filtroNombre, setFiltroNombre] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);

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
    }, []);
    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null); // ✅ Limpia el estado
        navigate("/login"); // ✅ Redirige al login
    };

    const handleChange = e => {
        setNuevoPlan({ ...nuevoPlan, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();

        // Obtener RUT del usuario logeado
        const user = JSON.parse(localStorage.getItem("user"));
        const rutUsuario = user?.rut || user?.RUT || "";

        // Usar el RUT del usuario logeado al crear el plan
        const nuevoPlanConRut = { ...nuevoPlan, RUT: rutUsuario };

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
                RUT: ''
            });
        } else {
            alert("Error al agregar el plan");
        }
    };

    const handleSuscribirme = async (plan) => {
        const rutUsuario = user?.rut || user?.RUT || "";
        const suscripcion = {
            ID_PLAN: plan.ID_PLAN_ENTRENAMIENTO,
            NOMBRE: plan.NOMBRE,
            DESCRIPCION: plan.DESCRIPCION,
            FECHAINICIO: plan.FECHAINICIO ? plan.FECHAINICIO.substring(0, 10) : '',
            FECHAFIN: plan.FECHAFIN ? plan.FECHAFIN.substring(0, 10) : '',
            OBJETIVO: plan.OBJETIVO,
            RUT: rutUsuario,
            TIPO_PLAN: "ENTRENAMIENTO"
        };
        const res = await fetch("http://localhost:5000/api/suscripciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(suscripcion)
        });
        if (res.ok) {
            alert("¡Te has suscrito exitosamente!");
        } else {
            alert("Error al suscribirse");
        }
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
                                setPaginaActual(1); // Resetear a la primera página al filtrar
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
                        {/* Formulario para agregar plan */}
                        {user && (user.id_rol === 2 || user.id_rol === 6) && (
                        <form onSubmit={handleSubmit} style={{
                            marginBottom: 40,
                            background: '#fff',
                            border: '1px solid #e6eaf0',
                            boxShadow: '0 2px 8px rgba(67,233,123,0.06)',
                            padding: 24,
                            borderRadius: 12,
                            maxWidth: 700
                        }}>
                            <h2 style={{ color: '#43e97b', fontWeight: 600, fontSize: 22, marginBottom: 18 }}>Agregar nuevo plan</h2>
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
                            </div>
                            <button type="submit" style={{
                                marginTop: 20,
                                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                                color: "#fff",
                                border: "none",
                                padding: "12px 32px",
                                borderRadius: 6,
                                fontWeight: 600,
                                fontSize: 16,
                                cursor: "pointer",
                                boxShadow: '0 2px 8px rgba(67,233,123,0.10)'
                            }}>Agregar Plan</button>
                        </form>
                        )}
                        {filteredPlanes.length === 0 ? (
                            <p style={{ color: '#888', fontSize: 18, marginTop: 40 }}>No hay planes de entrenamiento disponibles.</p>
                        ) : (
                            <>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gridTemplateRows: 'repeat(3, auto)',
                                    gap: '2rem'
                                }}>
                                    {planesPagina.map(plan => (
                                        <div key={plan.ID_PLAN_ENTRENAMIENTO} style={{
                                            background: '#fff',
                                            border: '1px solid #e6eaf0',
                                            borderRadius: 12,
                                            boxShadow: '0 2px 8px rgba(67,233,123,0.06)',
                                            padding: 24,
                                            transition: 'box-shadow 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <h2 style={{ color: '#43e97b', fontWeight: 700, fontSize: 22, marginBottom: 10 }}>{plan.NOMBRE}</h2>
                                                <p style={descStyle}><b>Descripción:</b> {plan.DESCRIPCION}</p>
                                                <p style={descStyle}><b>Fecha inicio:</b> {plan.FECHAINICIO ? plan.FECHAINICIO.substring(0, 10) : ''}</p>
                                                <p style={descStyle}><b>Fecha fin:</b> {plan.FECHAFIN ? plan.FECHAFIN.substring(0, 10) : ''}</p>
                                                <p style={descStyle}><b>Frecuencia:</b> {plan.FRECUENCIA}</p>
                                                <p style={descStyle}><b>Duración por sesión:</b> {plan.DURACION} min</p>
                                                <p style={descStyle}><b>Nivel:</b> {plan.NIVEL}</p>
                                                <p style={descStyle}><b>Tipo:</b> {plan.TIPO}</p>
                                                <p style={descStyle}><b>Objetivo:</b> {plan.OBJETIVO}</p>
                                                <p style={descStyle}><b>Rut usuario:</b> {plan.RUT}</p>
                                            </div>
                                            <button onClick={() => handleSuscribirme(plan)} style={{
                                                marginTop: 18,
                                                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                                                color: "#fff",
                                                border: "none",
                                                padding: "10px 0",
                                                borderRadius: 6,
                                                fontWeight: 600,
                                                fontSize: 16,
                                                cursor: "pointer",
                                                boxShadow: '0 2px 8px rgba(67,233,123,0.10)'
                                            }}>
                                                Suscribirme
                                            </button>
                                        </div>
                                    ))}
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
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

// Estilos reutilizables
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

const descStyle = {
    color: '#444',
    fontSize: 15,
    margin: '4px 0'
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