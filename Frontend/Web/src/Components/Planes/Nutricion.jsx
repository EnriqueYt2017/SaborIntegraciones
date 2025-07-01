import React, { useEffect, useState } from "react";
import axios from "axios";
import Imagelogo from '../../assets/icono-logo.png';
import { useNavigate } from "react-router-dom";
import { FaPen, FaTrashAlt, FaCheckCircle } from "react-icons/fa";

// Puedes usar una imagen local o de internet para el feedback visual
const VIDA_SANA_IMG = "https://cdn-icons-png.flaticon.com/512/2917/2917995.png";

const CARD_HEIGHT = 320;
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
        PRECIO: "",
        RUT: ""
    });
    const [adding, setAdding] = useState(false);
    const [editando, setEditando] = useState(false);
    const [planEditandoId, setPlanEditandoId] = useState(null);
    const [filter, setFilter] = useState("");
    const [page, setPage] = useState(1);
    const [suscripciones, setSuscripciones] = useState([]);
    const [carrito, setCarrito] = useState([]);

    useEffect(() => {
        fetchPlanes();
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
        const carritoLS = JSON.parse(localStorage.getItem("carrito")) || [];
        setCarrito(carritoLS);
    }, [navigate]);

    useEffect(() => {
        const fetchSuscripciones = async () => {
            if (!user?.rut && !user?.RUT) return;
            const rutUsuario = user?.rut || user?.RUT;
            try {
                const res = await fetch(`http://localhost:5000/api/suscripciones/${rutUsuario}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuscripciones(data);
                }
            } catch {
                setSuscripciones([]);
            }
        };
        fetchSuscripciones();
    }, [user]);

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



    const agregarPlanAlCarrito = async (plan) => {
        // El carrito puede tener productos y planes, diferenciados por tipo
        const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        // Evita duplicados de planes
        if (carrito.some(item => item.tipo === "plan_nutricion" && item.ID_PLAN_NUTRICION === plan.ID_PLAN_NUTRICION)) {
            alert("Este plan ya está en el carrito.");
            return;
        }

        carrito.push({
            tipo: "plan_nutricion",
            ID_PLAN_NUTRICION: plan.ID_PLAN_NUTRICION,
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
                        ID_PLAN: plan.ID_PLAN_NUTRICION,
                        NOMBRE: plan.NOMBRE,
                        DESCRIPCION: plan.DESCRIPCION,
                        FECHAINICIO: plan.FECHAINICIO,
                        FECHAFIN: plan.FECHAFIN,
                        OBJETIVO: plan.OBJETIVO,
                        RUT: user.rut || user.RUT,
                        TIPO_PLAN: "NUTRICION"
                    })
                }); */
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ...existing code...
    const handleAddOrEdit = async (e) => {
        e.preventDefault();
        setAdding(true);
        const user = JSON.parse(localStorage.getItem("user"));
        const rutUsuario = user?.rut || user?.RUT || "";
        // Convierte PRECIO a número antes de enviar
        const formConRut = { ...form, RUT: rutUsuario, PRECIO: Number(form.PRECIO) };

        if (editando && planEditandoId) {
            try {
                await axios.put(`http://localhost:5000/api/planes-nutricion/${planEditandoId}`, formConRut);
                setPlanes(planes.map(p =>
                    p.ID_PLAN_NUTRICION === planEditandoId
                        ? { ...p, ...formConRut, ID_PLAN_NUTRICION: planEditandoId }
                        : p
                ));
                setEditando(false);
                setPlanEditandoId(null);
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
                    PRECIO: "",
                    RUT: ""
                });
                alert("Plan modificado correctamente");
            } catch {
                alert("Error al modificar el plan");
            } finally {
                setAdding(false);
            }
        } else {
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
                        PRECIO: "",
                        RUT: ""
                    });
                    fetchPlanes();
                    alert("Plan agregado correctamente");
                })
                .catch(() => alert("Error al agregar el plan"))
                .finally(() => setAdding(false));
        }
    };
    // ...existing code...

    const handleEditar = (plan) => {
        setForm({
            NOMBRE: plan.NOMBRE || "",
            DESCRIPCION: plan.DESCRIPCION || "",
            FECHAINICIO: plan.FECHAINICIO ? plan.FECHAINICIO.substring(0, 10) : "",
            FECHAFIN: plan.FECHAFIN ? plan.FECHAFIN.substring(0, 10) : "",
            CALORIAS_DIARIAS: plan.CALORIAS_DIARIAS || "",
            MACRONUTRIENTES: plan.MACRONUTRIENTES || "",
            TIPODIETA: plan.TIPODIETA || "",
            OBJETIVO: plan.OBJETIVO || "",
            OBSERVACIONES: plan.OBSERVACIONES || "",
            PRECIO: plan.PRECIO !== undefined && plan.PRECIO !== null ? String(plan.PRECIO) : "",
            RUT: plan.RUT || ""
        });
        setEditando(true);
        setPlanEditandoId(plan.ID_PLAN_NUTRICION);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este plan?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/planes-nutricion/${id}`);
            setPlanes(planes.filter(p => p.ID_PLAN_NUTRICION !== id));
            if (editando && planEditandoId === id) {
                setEditando(false);
                setPlanEditandoId(null);
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
                    PRECIO: "",
                    RUT: ""
                });
            }
            alert("Plan eliminado correctamente");
        } catch {
            alert("Error al eliminar el plan");
        }
    };

    const handleCancelarEdicion = () => {
        setEditando(false);
        setPlanEditandoId(null);
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
            PRECIO: "",
            RUT: ""
        });
    };

    const filteredPlanes = planes.filter(plan =>
        plan.NOMBRE.toLowerCase().includes(filter.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPlanes.length / CARDS_PER_PAGE);
    const paginatedPlanes = filteredPlanes.slice(
        (page - 1) * CARDS_PER_PAGE,
        page * CARDS_PER_PAGE
    );
    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

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
            fontSize: 38,
            fontWeight: 900,
            marginBottom: 8,
            color: "#1e293b",
            textAlign: "center",
            letterSpacing: 1.5,
            textShadow: "0 2px 8px #bae6fd55"
        },
        formCard: {
            background: "#f0fdf4",
            borderRadius: 18,
            boxShadow: "0 4px 24px #bbf7d055",
            padding: "32px 24px",
            margin: "0 auto",
            maxWidth: 650,
            width: "100%",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            border: "1.5px solid #86efac"
        },
        formTitle: {
            fontSize: 24,
            fontWeight: 800,
            color: "#059669",
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
            borderRadius: 8,
            border: "1.5px solid #bbf7d0",
            fontSize: 16,
            background: "#f1f5f9"
        },
        button: {
            padding: "12px 0",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(90deg, #059669 0%, #38bdf8 100%)",
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
            borderRadius: 8,
            border: "1.5px solid #bbf7d0",
            fontSize: 16,
            background: "#f1f5f9",
            width: "100%"
        },
        cardsGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 36,
            width: "100%"
        },
        card: {
            background: "linear-gradient(120deg, #f0fdf4 60%, #e0f2fe 100%)",
            borderRadius: 18,
            boxShadow: "0 2px 16px #bbf7d055",
            padding: 26,
            minWidth: 0,
            minHeight: CARD_HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1.5px solid #86efac",
            transition: "box-shadow 0.2s, transform 0.2s",
            position: "relative"
        },
        cardTitle: {
            fontSize: 23,
            fontWeight: 800,
            color: "#059669",
            marginBottom: 8,
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap"
        },
        cardDesc: {
            fontSize: 16,
            color: "#334155",
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
            marginTop: 10,
            gap: 8
        },
        suscribeBtn: {
            background: "linear-gradient(90deg, #22d3ee 0%, #059669 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            padding: "8px 18px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
            boxShadow: "0 2px 8px #bae6fd55",
            transition: "background 0.2s"
        },
        iconBtn: {
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#059669",
            fontSize: 19,
            marginLeft: 6,
            marginRight: 2
        },
        iconBtnDelete: {
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#ef4444",
            fontSize: 19,
            marginLeft: 2
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
            borderRadius: 6,
            border: "1.5px solid #bbf7d0",
            background: isActive ? "linear-gradient(90deg, #059669 0%, #38bdf8 100%)" : "#fff",
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
        },
        carritoImg: {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) scale(1.1)",
            zIndex: 9999,
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 8px 32px #05966944",
            padding: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "fadeInOut 1.8s"
        },
        carritoImgText: {
            color: "#059669",
            fontWeight: 700,
            fontSize: 18,
            marginTop: 12,
            textAlign: "center"
        }
    };

    return (
        <div>
            {/* Navbar (no modificar) */}
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
                    </ul>
                </nav>
            </div>
            <div style={styles.container}>
                <div style={styles.main}>
                    <div style={styles.title}>Planes de Nutrición</div>
                    {/* Agregar/Editar Plan */}
                    {user && (user.id_rol === 2 || user.id_rol === 6) && (
                        <div style={styles.formCard}>
                            <div style={styles.formTitle}>{editando ? "Editar Plan" : "Agregar Plan"}</div>
                            <form onSubmit={handleAddOrEdit} style={styles.form}>
                                <input name="NOMBRE" placeholder="Nombre" value={form.NOMBRE} onChange={handleChange} required style={styles.input} />
                                <input name="DESCRIPCION" placeholder="Descripción" value={form.DESCRIPCION} onChange={handleChange} required style={styles.input} />
                                <input name="FECHAINICIO" type="date" value={form.FECHAINICIO} onChange={handleChange} required style={styles.input} />
                                <input name="FECHAFIN" type="date" value={form.FECHAFIN} onChange={handleChange} required style={styles.input} />
                                <input name="CALORIAS_DIARIAS" placeholder="Calorías Diarias" value={form.CALORIAS_DIARIAS} onChange={handleChange} required style={styles.input} />
                                <input name="MACRONUTRIENTES" placeholder="Macronutrientes" value={form.MACRONUTRIENTES} onChange={handleChange} required style={styles.input} />
                                <input name="TIPODIETA" placeholder="Tipo Dieta" value={form.TIPODIETA} onChange={handleChange} required style={styles.input} />
                                <input name="OBJETIVO" placeholder="Objetivo" value={form.OBJETIVO} onChange={handleChange} required style={styles.input} />
                                <input name="OBSERVACIONES" placeholder="Observaciones" value={form.OBSERVACIONES} onChange={handleChange} style={styles.input} />
                                <input name="PRECIO" type="number" placeholder="Precio" value={form.PRECIO} onChange={handleChange} required style={styles.input} />
                                <button type="submit" disabled={adding} style={styles.button}>
                                    {adding ? (editando ? "Guardando..." : "Agregando...") : (editando ? "Guardar Cambios" : "Agregar Plan")}
                                </button>
                                {editando && (
                                    <button type="button" onClick={handleCancelarEdicion} style={{ ...styles.button, background: "#e5e7eb", color: "#222", marginTop: 0 }}>
                                        Cancelar
                                    </button>
                                )}
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
                                {paginatedPlanes.map((plan) => {
                                    const yaEnCarrito = carrito.some(
                                        item => item.tipo === "plan_nutricion" && item.ID_PLAN_NUTRICION === plan.ID_PLAN_NUTRICION
                                    );
                                    const yaSuscrito = suscripciones.some(
                                        s => s.ID_PLAN === plan.ID_PLAN_NUTRICION && String(s.RUT) === String(user?.rut || user?.RUT)
                                    );
                                    return (
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
                                                <div style={styles.cardInfo}>
                                                    <b>Precio:</b> <span style={{ color: "#059669", fontWeight: 700 }}>
                                                        ${plan.PRECIO !== undefined && plan.PRECIO !== null && plan.PRECIO !== "" ? plan.PRECIO : "0"}
                                                    </span>
                                                </div>
                                                <div style={styles.cardInfo}><b>RUT:</b> {plan.RUT}</div>
                                            </div>
                                            <div style={styles.cardFooter}>
                                                <span style={{ fontSize: 13, color: "#a0aec0" }}>
                                                    #{plan.ID_PLAN_NUTRICION.toString().padStart(2, '0')}
                                                </span>
                                                <button
                                                    style={styles.suscribeBtn}
                                                    onClick={() => agregarPlanAlCarrito(plan)}
                                                    disabled={yaEnCarrito || yaSuscrito}
                                                >
                                                    {yaSuscrito
                                                        ? "Ya está suscrito"
                                                        : yaEnCarrito
                                                            ? "En carrito"
                                                            : "Suscribirme"}
                                                </button>
                                                {(user && (user.id_rol === 2 || user.id_rol === 6)) && (
                                                    <>
                                                        <button
                                                            style={styles.iconBtn}
                                                            title="Modificar"
                                                            onClick={() => handleEditar(plan)}
                                                        >
                                                            <FaPen />
                                                        </button>
                                                        <button
                                                            style={styles.iconBtnDelete}
                                                            title="Eliminar"
                                                            onClick={() => handleEliminar(plan.ID_PLAN_NUTRICION)}
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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
            {/* Animación para la imagen */}
            <style>
                {`
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7);}
                    10% { opacity: 1; transform: translate(-50%, -50%) scale(1);}
                    90% { opacity: 1; transform: translate(-50%, -50%) scale(1);}
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.7);}
                }
                `}
            </style>
        </div>
    );
};

export default Nutricion;