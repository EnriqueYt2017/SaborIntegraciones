import React, { useEffect, useState } from "react";
import axios from "axios";
import Imagelogo from '../../assets/icono-logo.png';
import { useNavigate } from "react-router-dom";

const CARD_WIDTH = 320;
const CARD_HEIGHT = 260;
const CARDS_PER_PAGE = 12;

const Nutricion = () => {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        NOMBRE: "",
        DESCRIPCION: "",
        FECHAINICIO: "",
        FECHAFIN: "",
        CALORIAS_DIARIAS: "",
        MACRONUTRIENTES: "",
        TIPODIETA: "",
        OBJETIVO: "",
        OBSERVACIONES: "",
        RUT: ""
    });
    const [adding, setAdding] = useState(false);
    const [filter, setFilter] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchPlanes();
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

    const fetchPlanes = () => {
        setLoading(true);
        axios
            .get("http://localhost:5000/api/planes-nutricion")
            .then((res) => {
                setPlanes(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAdd = (e) => {
        e.preventDefault();
        setAdding(true);

        // Obtener RUT del usuario logeado
        const user = JSON.parse(localStorage.getItem("user"));
        const rutUsuario = user?.rut || user?.RUT || "";

        // Usar el RUT del usuario logeado al crear el plan
        const formConRut = { ...form, RUT: rutUsuario };

        axios
            .post("http://localhost:5000/api/planes-nutricion", formConRut)
            .then(() => {
                setForm({
                    NOMBRE: "",
                    DESCRIPCION: "",
                    FECHAINICIO: "",
                    FECHAFIN: "",
                    CALORIAS_DIARIAS: "",
                    MACRONUTRIENTES: "",
                    TIPODIETA: "",
                    OBJETIVO: "",
                    OBSERVACIONES: "",
                    RUT: ""
                });
                fetchPlanes();
            })
            .finally(() => setAdding(false));
    };

    const handleSuscribirme = async (plan) => {
        const rutUsuario = user?.rut || user?.RUT || "";
        const suscripcion = {
            ID_PLAN: plan.ID_PLAN_NUTRICION,
            NOMBRE: plan.NOMBRE,
            DESCRIPCION: plan.DESCRIPCION,
            FECHAINICIO: plan.FECHAINICIO ? plan.FECHAINICIO.slice(0, 10) : "",
            FECHAFIN: plan.FECHAFIN ? plan.FECHAFIN.slice(0, 10) : "",
            OBJETIVO: plan.OBJETIVO,
            RUT: rutUsuario,
            TIPO_PLAN: "NUTRICION"
        };
        // ...existing code...
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

    // Filtrado
    const filteredPlanes = planes.filter(plan =>
        plan.NOMBRE.toLowerCase().includes(filter.toLowerCase())
    );

    // Paginación
    const totalPages = Math.ceil(filteredPlanes.length / CARDS_PER_PAGE);
    const paginatedPlanes = filteredPlanes.slice(
        (page - 1) * CARDS_PER_PAGE,
        page * CARDS_PER_PAGE
    );
    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null); // ✅ Limpia el estado
        navigate("/login"); // ✅ Redirige al login
    };

    // Responsive styles
    const styles = {
        container: {
            minHeight: "100vh",
            background: "linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%)",
            fontFamily: "Segoe UI, Arial, sans-serif",
            padding: 0,
            margin: 0
        },
        main: {
            maxWidth: 1200,
            margin: "0 auto",
            padding: "32px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 32
        },
        title: {
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 8,
            color: "#2d3748",
            textAlign: "center",
            letterSpacing: 1
        },
        formCard: {
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px #c7d2fe55",
            padding: "32px 24px",
            margin: "0 auto",
            maxWidth: 600,
            width: "100%",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16
        },
        formTitle: {
            fontSize: 22,
            fontWeight: 700,
            color: "#3730a3",
            marginBottom: 8,
            textAlign: "center"
        },
        form: {
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "space-between"
        },
        input: {
            flex: "1 1 220px",
            minWidth: 180,
            padding: "10px 14px",
            borderRadius: 7,
            border: "1px solid #cbd5e1",
            fontSize: 16,
            background: "#f1f5f9"
        },
        button: {
            padding: "12px 0",
            borderRadius: 7,
            border: "none",
            background: "linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 17,
            cursor: "pointer",
            marginTop: 8,
            width: "100%",
            transition: "background 0.2s"
        },
        filterBar: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            margin: "0 auto",
            maxWidth: 600,
            width: "100%"
        },
        filterInput: {
            padding: "10px 14px",
            borderRadius: 7,
            border: "1px solid #cbd5e1",
            fontSize: 16,
            background: "#f1f5f9",
            width: "100%"
        },
        cardsGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 32,
            width: "100%"
        },
        card: {
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 16px #c7d2fe55",
            padding: 24,
            minWidth: 0,
            minHeight: CARD_HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid #e0e7ff",
            transition: "box-shadow 0.2s, transform 0.2s",
            position: "relative"
        },
        cardTitle: {
            fontSize: 22,
            fontWeight: 700,
            color: "#3730a3",
            marginBottom: 8,
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap"
        },
        cardDesc: {
            fontSize: 16,
            color: "#4a5568",
            marginBottom: 10,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical"
        },
        cardInfo: {
            fontSize: 15,
            color: "#64748b",
            marginBottom: 3,
            wordBreak: "break-word"
        },
        cardFooter: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10
        },
        suscribeBtn: {
            background: "linear-gradient(90deg, #22d3ee 0%, #6366f1 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 18px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
            boxShadow: "0 2px 8px #bae6fd55",
            transition: "background 0.2s"
        },
        paginator: {
            display: "flex",
            gap: 8,
            marginTop: 32,
            alignItems: "center",
            justifyContent: "center"
        },
        pageBtn: isActive => ({
            padding: "7px 16px",
            borderRadius: 5,
            border: "1px solid #cbd5e1",
            background: isActive ? "linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)" : "#fff",
            color: isActive ? "#fff" : "#2d3748",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
            transition: "background 0.2s"
        }),
        loading: {
            fontSize: 20,
            color: "#4a5568",
            marginTop: 40,
            textAlign: "center"
        }
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
            <div style={styles.container}>
                <div style={styles.main}>
                    <div style={styles.title}>Planes de Nutrición</div>
                    {/* Agregar Plan */}
                        {user && (user.id_rol === 2 || user.id_rol === 6) && (
                    <div style={styles.formCard}>
                        <div style={styles.formTitle}>Agregar Plan</div>
                            <form onSubmit={handleAdd} style={styles.form}>
                                <input name="NOMBRE" placeholder="Nombre" value={form.NOMBRE} onChange={handleChange} required style={styles.input} />
                                <input name="DESCRIPCION" placeholder="Descripción" value={form.DESCRIPCION} onChange={handleChange} required style={styles.input} />
                                <input name="FECHAINICIO" type="date" value={form.FECHAINICIO} onChange={handleChange} required style={styles.input} />
                                <input name="FECHAFIN" type="date" value={form.FECHAFIN} onChange={handleChange} required style={styles.input} />
                                <input name="CALORIAS_DIARIAS" placeholder="Calorías Diarias" value={form.CALORIAS_DIARIAS} onChange={handleChange} required style={styles.input} />
                                <input name="MACRONUTRIENTES" placeholder="Macronutrientes" value={form.MACRONUTRIENTES} onChange={handleChange} required style={styles.input} />
                                <input name="TIPODIETA" placeholder="Tipo Dieta" value={form.TIPODIETA} onChange={handleChange} required style={styles.input} />
                                <input name="OBJETIVO" placeholder="Objetivo" value={form.OBJETIVO} onChange={handleChange} required style={styles.input} />
                                <input name="OBSERVACIONES" placeholder="Observaciones" value={form.OBSERVACIONES} onChange={handleChange} style={styles.input} />

                                <button type="submit" disabled={adding} style={styles.button}>
                                    {adding ? "Agregando..." : "Agregar Plan"}
                                </button>
                            </form>
                            </div>
                        )}
                    

                    {/* Filtro */}
                    <div style={styles.filterBar}>
                        <input
                            style={styles.filterInput}
                            type="text"
                            placeholder="Buscar plan por nombre..."
                            value={filter}
                            onChange={e => {
                                setFilter(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    {/* Listado */}
                    {loading ? (
                        <div style={styles.loading}>Cargando...</div>
                    ) : (
                        <>
                            <div style={styles.cardsGrid}>
                                {paginatedPlanes.length === 0 && (
                                    <div style={{ gridColumn: "1/-1" }}>
                                        <p style={{ color: "#64748b", fontSize: 18, textAlign: "center" }}>No se encontraron planes.</p>
                                    </div>
                                )}
                                {paginatedPlanes.map((plan) => (
                                    <div key={plan.ID_PLAN_NUTRICION} style={styles.card}>
                                        <div>
                                            <div style={styles.cardTitle}>{plan.NOMBRE}</div>
                                            <div style={styles.cardDesc}>{plan.DESCRIPCION}</div>
                                            <div style={styles.cardInfo}><b>Inicio:</b> {plan.FECHAINICIO?.slice(0, 10)}</div>
                                            <div style={styles.cardInfo}><b>Fin:</b> {plan.FECHAFIN?.slice(0, 10)}</div>
                                            <div style={styles.cardInfo}><b>Calorías:</b> {plan.CALORIAS_DIARIAS}</div>
                                            <div style={styles.cardInfo}><b>Macronutrientes:</b> {plan.MACRONUTRIENTES}</div>
                                            <div style={styles.cardInfo}><b>Tipo Dieta:</b> {plan.TIPODIETA}</div>
                                            <div style={styles.cardInfo}><b>Objetivo:</b> {plan.OBJETIVO}</div>
                                            <div style={styles.cardInfo}><b>Observaciones:</b> {plan.OBSERVACIONES}</div>
                                            <div style={styles.cardInfo}><b>RUT:</b> {plan.RUT}</div>
                                        </div>
                                        <div style={styles.cardFooter}>
                                            <span style={{ fontSize: 13, color: "#a0aec0" }}>
                                                #{plan.ID_PLAN_NUTRICION.toString().padStart(2, '0')}
                                            </span>
                                            <button
                                                style={styles.suscribeBtn}
                                                onClick={() => handleSuscribirme(plan)}
                                            >
                                                Suscribirme
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Paginador */}
                            {totalPages > 1 && (
                                <div style={styles.paginator}>
                                    <button
                                        style={styles.pageBtn(false)}
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        {"<"}
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            style={styles.pageBtn(page === i + 1)}
                                            onClick={() => setPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        style={styles.pageBtn(false)}
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        {">"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Nutricion;