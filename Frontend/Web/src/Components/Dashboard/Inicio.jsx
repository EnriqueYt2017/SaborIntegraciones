import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const sections = [
    { key: "Inicio", label: "Inicio" },
    { key: "usuarios", label: "Usuarios" },
    { key: "productos", label: "Productos" },
    { key: "Api", label: "Api" },
];


function Dashboard() {
    const [activeSection, setActiveSection] = useState("Inicio");
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);

    const [clientes, setClientes] = useState([]);
    const [usuario, setUsuario] = useState([]);
    const [form, setForm] = useState({
        rut: "", dvrut: "", primer_nombre: "", segundo_nombre: "",
        primer_apellido: "", segundo_apellido: "", direccion: "", correo: "", pass: ""
    });
    const [modoEdicion, setModoEdicion] = useState(false);

    const validarFormulario = () => {
        return form.rut && form.dvrut && form.primer_nombre && form.primer_apellido && form.correo;
    };
    const [currentPage, setCurrentPage] = useState(1); // Página actual
    const itemsPerPage = 5; // Clientes por página

    // Calcular el índice de inicio y fin de los clientes a mostrar
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientes.slice(indexOfFirstItem, indexOfLastItem);

    //PRODUCTOS
    const [codigo_producto, setCodigoProducto] = useState("");
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precio, setPrecio] = useState("");
    const [id_categoria, setIdCategoria] = useState("");





    // Obtener clientes
    const obtenerUsuarios = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/Usuarios");
            setUsuario(res.data);
        } catch (err) {
            console.error("Error al obtener usuarios:", err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/productos", {
                codigo_producto,
                nombre,
                descripcion,
                precio,
                id_categoria
            });
            alert("Producto agregado correctamente");
        } catch (error) {
            alert("Error al agregar producto");
        }
    };

    const eliminarProducto = async (id) => {
        if (window.confirm("¿Seguro que quieres eliminar este producto?")) {
            try {
                await axios.delete(`http://localhost:5000/productos/${id}`);
                setProductos(productos.filter(producto => producto.codigo_producto !== id));
                alert("Producto eliminado correctamente");
            } catch (error) {
                alert("Error al eliminar producto");
            }
        }
    };





    useEffect(() => {
        obtenerUsuarios();

        axios.get("http://localhost:5000/clientes")
            .then(response => setClientes(response.data))
            .catch(error => console.error("Error al obtener clientes:", error));
        axios.get("http://localhost:5000/productos")
            .then(response => setProductos(response.data))
            .catch(error => console.error("Error al obtener productos:", error));

    }, []);



    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAgregar = async () => {
        if (!validarFormulario()) {
            alert("Por favor completa todos los campos requeridos.");
            return;
        }
        // ...
    };

    const handleEditar = (usuario) => {
        setForm({ ...usuario, pass: "" });
        setModoEdicion(true);
    };

    const handleActualizar = async () => {
        try {
            const token = localStorage.getItem("token"); // Requiere autenticación
            await axios.put("http://localhost:5000/perfil", form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            obtenerUsuarios();
            setForm({
                rut: "", dvrut: "", primer_nombre: "", segundo_nombre: "",
                primer_apellido: "", segundo_apellido: "", direccion: "", correo: "", pass: ""
            });
            setModoEdicion(false);
        } catch (err) {
            console.error("Error al actualizar usuario:", err);
        }
    };


    const handleEliminar = async (rut) => {
        try {
            await axios.delete(`http://localhost:5000/usuarios/${rut}`);
            obtenerUsuarios();
        } catch (err) {
            console.error("Error al eliminar cliente:", err);
        }
    };

    const goHome = () => {
        navigate("/");
    };

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                fontFamily: "Inter, Segoe UI, Arial, sans-serif",
                background: `radial-gradient(circle at 80% 10%, #ffcc33 0%, #764ba2 100%)`,
                transition: "background 0.7s cubic-bezier(.4,0,.2,1)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Animated Background Blobs */}
            <div
                style={{
                    position: "absolute",
                    top: "-120px",
                    left: "-120px",
                    width: 340,
                    height: 340,
                    background: "linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)",
                    borderRadius: "50%",
                    filter: "blur(60px)",
                    opacity: 0.45,
                    zIndex: 0,
                    animation: "blobMove 16s infinite alternate ease-in-out",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "-160px",
                    right: "-160px",
                    width: 400,
                    height: 400,
                    background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                    borderRadius: "50%",
                    filter: "blur(80px)",
                    opacity: 0.35,
                    zIndex: 0,
                    animation: "blobMove2 18s infinite alternate-reverse ease-in-out",
                }}
            />
            <style>
                {`
                @keyframes blobMove {
                    0% { transform: scale(1) translateY(0); }
                    100% { transform: scale(1.2) translateY(40px); }
                }
                @keyframes blobMove2 {
                    0% { transform: scale(1) translateX(0); }
                    100% { transform: scale(1.1) translateX(-40px); }
                }
                .epic-glow {
                    box-shadow: 0 0 32px 8px #ffcc3340, 0 0 0 8px #764ba220;
                    animation: epicGlowPulse 2.5s infinite alternate;
                }
                @keyframes epicGlowPulse {
                    0% { box-shadow: 0 0 32px 8px #ffcc3340, 0 0 0 8px #764ba220; }
                    100% { box-shadow: 0 0 64px 16px #ffcc3380, 0 0 0 16px #764ba240; }
                }
                .epic-gradient-border {
                    border: 3px solid transparent;
                    border-radius: 22px;
                    background: linear-gradient(120deg, #fff 80%, #ffcc3320 100%) padding-box,
                        linear-gradient(90deg, #ffb347, #764ba2, #43cea2) border-box;
                }
                .epic-float {
                    animation: epicFloat 4s ease-in-out infinite alternate;
                }
                @keyframes epicFloat {
                    0% { transform: translateY(0) scale(1); }
                    100% { transform: translateY(-16px) scale(1.08); }
                }
                /* --- SUPER EPIC PRODUCTOS SECTION --- */
                .epic-productos-bg {
                    background: linear-gradient(135deg, #fffbe6 60%, #ffe0e0 100%);
                    box-shadow: 0 8px 48px 0 #f7971e22, 0 1.5px 0 #f7971e10;
                    border-radius: 32px;
                    border: 3.5px solid #f7971e30;
                    position: relative;
                    overflow: hidden;
                }
                .epic-productos-bg::before {
                    content: "";
                    position: absolute;
                    top: -60px; left: -60px;
                    width: 180px; height: 180px;
                    background: radial-gradient(circle, #ffcc33 0%, #f7971e00 80%);
                    filter: blur(24px);
                    opacity: 0.25;
                    z-index: 0;
                }
                .epic-productos-bg::after {
                    content: "";
                    position: absolute;
                    bottom: -40px; right: -40px;
                    width: 120px; height: 120px;
                    background: radial-gradient(circle, #764ba2 0%, #764ba200 80%);
                    filter: blur(18px);
                    opacity: 0.18;
                    z-index: 0;
                }
                .epic-productos-form input, .epic-productos-form button {
                    margin: 0 10px 10px 0;
                    padding: 12px 18px;
                    border-radius: 10px;
                    border: none;
                    font-size: 17px;
                    outline: none;
                    box-shadow: 0 1px 8px #f7971e10;
                    transition: box-shadow 0.2s, border 0.2s;
                }
                .epic-productos-form input {
                    background: #fff8e1;
                    border: 1.5px solid #f7971e40;
                }
                .epic-productos-form input:focus {
                    border: 1.5px solid #f7971e;
                    box-shadow: 0 0 0 2px #ffcc3340;
                }
                .epic-productos-form button {
                    background: linear-gradient(90deg, #f7971e 0%, #ffcc33 100%);
                    color: #fff;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    box-shadow: 0 2px 12px #f7971e30;
                    cursor: pointer;
                    border: none;
                }
                .epic-productos-form button:hover {
                    background: linear-gradient(90deg, #ffcc33 0%, #f7971e 100%);
                    color: #222;
                }
                .epic-productos-table th, .epic-productos-table td {
                    padding: 14px 12px;
                    text-align: left;
                }
                .epic-productos-table th {
                    background: linear-gradient(90deg, #fffbe6 60%, #ffe0e0 100%);
                    color: #f7971e;
                    font-size: 18px;
                    font-weight: 900;
                    border-bottom: 2px solid #f7971e30;
                }
                .epic-productos-table tr {
                    border-top: 1.5px solid #f7971e10;
                }
                .epic-productos-table td {
                    background: #fff;
                    font-size: 17px;
                }
                .epic-productos-table tr:hover td {
                    background: #fffbe6;
                    transition: background 0.2s;
                }
                .epic-productos-title {
                    font-size: 36px;
                    font-weight: 900;
                    color: #f7971e;
                    letter-spacing: 1.5px;
                    margin-bottom: 18px;
                    text-shadow: 0 2px 16px #ffcc3340;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .epic-productos-emoji {
                    font-size: 60px;
                    margin-bottom: 8px;
                    filter: drop-shadow(0 2px 8px #ffd20040);
                    animation: epicFloat 3s infinite alternate;
                }
                `}
            </style>
            {/* Sidebar */}
            <aside
                style={{
                    width: 270,
                    background: "rgba(30, 32, 48, 0.97)",
                    color: "#fff",
                    padding: 36,
                    boxShadow: "2px 0 32px 0 rgba(0,0,0,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    zIndex: 2,
                    borderTopRightRadius: 32,
                    borderBottomRightRadius: 32,
                    backdropFilter: "blur(2px)",
                }}
            >
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 48,
                    gap: 14,
                }}>
                    <span style={{
                        fontSize: 38,
                        background: "linear-gradient(90deg, #ffb347, #ffcc33)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontWeight: 900,
                        filter: "drop-shadow(0 2px 8px #ffcc3340)"
                    }}>🍽️</span>
                    <h2
                        style={{
                            fontWeight: 900,
                            fontSize: 32,
                            letterSpacing: 1,
                            background: "linear-gradient(90deg, #ffb347, #ffcc33)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            margin: 0,
                        }}
                    >
                        Sabor Admin
                    </h2>
                </div>
                <nav style={{ width: "100%" }}>
                    {sections.map((section) => (
                        <button
                            key={section.key}
                            onClick={() => setActiveSection(section.key)}
                            className={activeSection === section.key ? "epic-glow" : ""}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                                padding: "16px 22px",
                                marginBottom: 16,
                                background:
                                    activeSection === section.key
                                        ? "linear-gradient(90deg, #ffb347 0%, #ffcc33 100%)"
                                        : "rgba(255,255,255,0.08)",
                                color: activeSection === section.key ? "#222" : "#fff",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                borderRadius: 12,
                                fontWeight: 700,
                                fontSize: 20,
                                boxShadow:
                                    activeSection === section.key
                                        ? "0 4px 24px 0 rgba(255, 204, 51, 0.18)"
                                        : "none",
                                transition: "all 0.2s",
                                letterSpacing: 0.5,
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            <span style={{ marginRight: 16, fontSize: 26 }}>
                                {section.key === "Inicio" && "🏠"}
                                {section.key === "usuarios" && "👤"}
                                {section.key === "productos" && "🍔"}
                                {section.key === "Api" && "🔗"}
                            </span>
                            {section.label}
                            {activeSection === section.key && (
                                <span style={{
                                    position: "absolute",
                                    right: 18,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: 18,
                                    color: "#ffb347",
                                    fontWeight: 900,
                                }}>⮞</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div style={{ flex: 1 }} />
                <button
                    onClick={goHome}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 54,
                        height: 54,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ffcc33 0%, #ffb347 100%)",
                        color: "#222",
                        border: "none",
                        boxShadow: "0 2px 12px 0 rgba(255,204,51,0.22)",
                        cursor: "pointer",
                        marginBottom: 18,
                        fontSize: 30,
                        transition: "background 0.2s",
                    }}
                    title="Ir al inicio"
                >
                    🏠
                </button>
                <footer style={{ color: "#aaa", fontSize: 14, marginTop: 10, fontWeight: 500 }}>
                    © {new Date().getFullYear()} Sabor Integraciones
                </footer>
            </aside>

            {/* Main Content */}
            <main
                className="epic-gradient-border"
                style={{
                    flex: 1,
                    padding: "56px 64px",
                    background: "rgba(255,255,255,0.96)",
                    borderRadius: "40px 0 0 40px",
                    margin: 32,
                    boxShadow: "0 12px 48px 0 rgba(0,0,0,0.13)",
                    minHeight: "calc(100vh - 64px)",
                    position: "relative",
                    zIndex: 1,
                    overflow: "auto",
                    backdropFilter: "blur(1.5px)",
                }}
            >
                <section>
                    <h2
                        className="epic-glow"
                        style={{
                            fontSize: 40,
                            fontWeight: 900,
                            marginBottom: 22,
                            letterSpacing: 1.5,
                            color: "#222",
                            textShadow: "0 4px 24px #ffcc3340",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        {activeSection === "Inicio" && <>🚀 Bienvenido al <span style={{ color: "#ffb347" }}>Panel de Control</span></>}
                        {activeSection === "usuarios" && <>👤 <span style={{ color: "#764ba2" }}>Administrar Usuarios</span></>}
                        {activeSection === "productos" && <>🍔 <span style={{ color: "#f7971e" }}>Administrar Productos</span></>}
                        {activeSection === "Api" && <>🔗 <span style={{ color: "#43cea2" }}>API Clientes</span></>}
                    </h2>
                    <div
                        className="epic-gradient-border"
                        style={{
                            background: "linear-gradient(120deg, #f8fafc 80%, #ffcc3320 100%)",
                            borderRadius: 22,
                            boxShadow: "0 4px 32px 0 rgba(0,0,0,0.09)",
                            padding: 44,
                            minHeight: 260,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "flex-start",
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {/* Decorative floating icon */}
                        <span className="epic-float" style={{
                            position: "absolute",
                            top: 24,
                            right: 36,
                            fontSize: 54,
                            opacity: 0.13,
                            pointerEvents: "none",
                            userSelect: "none",
                            filter: "drop-shadow(0 2px 16px #ffcc3340)"
                        }}>
                            {activeSection === "Inicio" && "✨"}
                            {activeSection === "usuarios" && "👥"}
                            {activeSection === "productos" && "🍉"}
                            {activeSection === "Api" && "🔗"}
                        </span>
                        {activeSection === "Inicio" && (
                            <>
                                <p style={{ fontSize: 22, color: "#444", marginBottom: 18, fontWeight: 500 }}>
                                    ¡Gestiona tu negocio con <span style={{ color: "#ffb347", fontWeight: 700 }}>estilo</span>! Selecciona una sección en el menú lateral.
                                </p>
                                <ul style={{ fontSize: 18, color: "#666", marginLeft: 28, lineHeight: 2 }}>
                                    <li>👤 <b>Usuarios</b>: administra tu base de usuarios.</li>
                                    <li>🍉 <b>Productos</b>: controla tu inventario.</li>
                                    <li>🔗 <b>API</b>: consulta clientes externos.</li>
                                </ul>
                            </>
                        )}
                        {activeSection === "usuarios" && (
                            <div style={{ width: "100%" }}>
                                {/* Formulario */}
                                <div
                                    className="epic-gradient-border"
                                    style={{
                                        background: "#fff",
                                        padding: 28,
                                        borderRadius: 16,
                                        marginBottom: 36,
                                        boxShadow: "0 2px 16px 0 rgba(118,75,162,0.06)",
                                        border: "1.5px solid #f3f4f6",
                                    }}
                                >
                                    <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: "#764ba2" }}>
                                        {modoEdicion ? "Editar Usuario" : "Agregar Usuario"}
                                    </h3>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(2, 1fr)",
                                            gap: 18,
                                            marginBottom: 18,
                                        }}
                                    >
                                        {[
                                            "rut", "dvrut", "primer_nombre", "segundo_nombre",
                                            "primer_apellido", "segundo_apellido", "direccion", "correo"
                                        ].map((campo) => (
                                            <input
                                                key={campo}
                                                type="text"
                                                name={campo}
                                                value={form[campo]}
                                                onChange={handleChange}
                                                placeholder={campo.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                                                className="epic-float"
                                                style={{
                                                    border: "1.5px solid #d1d5db",
                                                    borderRadius: 8,
                                                    padding: "10px 14px",
                                                    fontSize: 17,
                                                    background: "#f8fafc",
                                                    boxShadow: "0 1px 4px #764ba210",
                                                    outline: "none",
                                                    transition: "border 0.2s",
                                                }}
                                            />
                                        ))}
                                        {!modoEdicion && (
                                            <input
                                                type="password"
                                                name="pass"
                                                value={form.pass}
                                                onChange={handleChange}
                                                placeholder="Contraseña"
                                                className="epic-float"
                                                style={{
                                                    border: "1.5px solid #d1d5db",
                                                    borderRadius: 8,
                                                    padding: "10px 14px",
                                                    fontSize: 17,
                                                    background: "#f8fafc",
                                                    boxShadow: "0 1px 4px #764ba210",
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        {modoEdicion && (
                                            <button
                                                onClick={() => {
                                                    setModoEdicion(false);
                                                    setForm({
                                                        rut: "", dvrut: "", primer_nombre: "", segundo_nombre: "",
                                                        primer_apellido: "", segundo_apellido: "", direccion: "", correo: "", pass: ""
                                                    });
                                                }}
                                                style={{
                                                    background: "#e5e7eb",
                                                    color: "#222",
                                                    padding: "10px 26px",
                                                    borderRadius: 8,
                                                    border: "none",
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                    cursor: "pointer",
                                                    boxShadow: "0 1px 4px #764ba210",
                                                    transition: "background 0.2s",
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                        {modoEdicion ? (
                                            <button
                                                className="epic-glow"
                                                style={{
                                                    background: "linear-gradient(90deg, #764ba2 0%, #ffcc33 100%)",
                                                    color: "#fff",
                                                    padding: "10px 32px",
                                                    borderRadius: 8,
                                                    border: "none",
                                                    fontWeight: 800,
                                                    fontSize: 18,
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 8px #764ba220",
                                                    letterSpacing: 0.5,
                                                }}
                                                onClick={handleActualizar}
                                            >
                                                Actualizar
                                            </button>
                                        ) : (
                                            <button
                                                className="epic-glow"
                                                style={{
                                                    background: "linear-gradient(90deg, #22c55e 0%, #43cea2 100%)",
                                                    color: "#fff",
                                                    padding: "10px 32px",
                                                    borderRadius: 8,
                                                    border: "none",
                                                    fontWeight: 800,
                                                    fontSize: 18,
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 8px #43cea220",
                                                    letterSpacing: 0.5,
                                                }}
                                                onClick={handleAgregar}
                                            >
                                                Agregar
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* Tabla */}
                                <div style={{ overflowX: "auto" }}>
                                    <table className="epic-gradient-border" style={{
                                        width: "100%",
                                        background: "#fff",
                                        borderRadius: 14,
                                        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.07)",
                                        borderCollapse: "collapse",
                                        fontSize: 17,
                                    }}>
                                        <thead>
                                            <tr style={{ background: "#f1f5f9", color: "#222" }}>
                                                <th style={{ padding: 12, textAlign: "left" }}>RUT</th>
                                                <th style={{ padding: 12, textAlign: "left" }}>Nombres</th>
                                                <th style={{ padding: 12, textAlign: "left" }}>Apellidos</th>
                                                <th style={{ padding: 12, textAlign: "left" }}>Correo</th>
                                                <th style={{ padding: 12, textAlign: "left" }}>Dirección</th>
                                                <th style={{ padding: 12, textAlign: "left" }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usuario.map((c) => (
                                                <tr key={c.RUT || c.rut} style={{ borderTop: "1px solid #e5e7eb" }}>
                                                    <td style={{ padding: 12 }}>{c.RUT || c.rut}-{c.DVRUT || c.dvrut}</td>
                                                    <td style={{ padding: 12 }}>{c.PRIMER_NOMBRE || c.primer_nombre} {c.SEGUNDO_NOMBRE || c.segundo_nombre}</td>
                                                    <td style={{ padding: 12 }}>{c.PRIMER_APELLIDO || c.primer_apellido} {c.SEGUNDO_APELLIDO || c.segundo_apellido}</td>
                                                    <td style={{ padding: 12 }}>{c.CORREO || c.correo}</td>
                                                    <td style={{ padding: 12 }}>{c.DIRECCION || c.direccion}</td>
                                                    <td style={{ padding: 12 }}>
                                                        <button
                                                            className="epic-glow"
                                                            style={{
                                                                background: "linear-gradient(90deg, #facc15 0%, #ffb347 100%)",
                                                                color: "#222",
                                                                padding: "7px 18px",
                                                                borderRadius: 6,
                                                                border: "none",
                                                                fontWeight: 700,
                                                                marginRight: 8,
                                                                cursor: "pointer",
                                                                boxShadow: "0 1px 4px #ffb34720",
                                                            }}
                                                            onClick={() => handleEditar(c)}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            className="epic-glow"
                                                            style={{
                                                                background: "linear-gradient(90deg, #ef4444 0%, #ff7979 100%)",
                                                                color: "#fff",
                                                                padding: "7px 18px",
                                                                borderRadius: 6,
                                                                border: "none",
                                                                fontWeight: 700,
                                                                cursor: "pointer",
                                                                boxShadow: "0 1px 4px #ef444420",
                                                            }}
                                                            onClick={() => handleEliminar(c.RUT || c.rut)}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeSection === "productos" && (
                            <div className="epic-productos-bg epic-float" style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 180,
                                padding: "36px 18px 44px 18px",
                                margin: "0 auto",
                                position: "relative",
                                zIndex: 1,
                            }}>
                                <span className="epic-productos-emoji">🍔</span>
                                <div className="epic-productos-title">
                                    <span>Administrar Productos</span>
                                    <span style={{
                                        fontSize: 28,
                                        marginLeft: 8,
                                        filter: "drop-shadow(0 2px 8px #ffcc3340)"
                                    }}>🔥</span>
                                </div>
                                <form className="epic-productos-form" onSubmit={handleSubmit} style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 24,
                                    zIndex: 2,
                                    background: "rgba(255,255,255,0.7)",
                                    borderRadius: 16,
                                    boxShadow: "0 2px 12px #f7971e10",
                                    padding: "18px 16px",
                                }}>
                                    <input type="number" placeholder="Código Producto" value={codigo_producto} onChange={(e) => setCodigoProducto(e.target.value)} />
                                    <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                                    <input type="text" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                                    <input type="number" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                                    <input type="number" placeholder="ID Categoría" value={id_categoria} onChange={(e) => setIdCategoria(e.target.value)} />
                                    <button type="submit">
                                        <span style={{ fontSize: 20, marginRight: 6 }}>➕</span> Agregar Producto
                                    </button>
                                </form>
                                <h3 style={{
                                    fontSize: 24,
                                    fontWeight: 800,
                                    color: "#f7971e",
                                    margin: "18px 0 10px 0",
                                    letterSpacing: 1,
                                    textShadow: "0 2px 8px #ffcc3340"
                                }}>
                                    <span style={{ fontSize: 22, marginRight: 8 }}>📦</span>
                                    Lista de Productos
                                </h3>
                                {productos.length > 0 ? (
                                    <div style={{
                                        width: "100%",
                                        overflowX: "auto",
                                        marginTop: 8,
                                        borderRadius: 18,
                                        boxShadow: "0 2px 16px 0 #f7971e10",
                                        background: "rgba(255,255,255,0.95)",
                                    }}>
                                        <table className="epic-productos-table epic-gradient-border" style={{
                                            width: "100%",
                                            borderRadius: 14,
                                            borderCollapse: "collapse",
                                            fontSize: 17,
                                            minWidth: 700,
                                        }}>
                                            <thead>
                                                <tr>
                                                    <th>Código</th>
                                                    <th>Nombre</th>
                                                    <th>Descripción</th>
                                                    <th>Precio</th>
                                                    <th>ID Categoría</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {productos.map((producto) => (
                                                    <tr key={producto.codigo_producto}>
                                                        <td>{producto.codigo_producto}</td>
                                                        <td>{producto.nombre}</td>
                                                        <td>{producto.descripcion}</td>
                                                        <td>
                                                            <span style={{
                                                                color: "#f7971e",
                                                                fontWeight: 700,
                                                                fontSize: 17,
                                                                letterSpacing: 0.5,
                                                            }}>
                                                                ${producto.precio}
                                                            </span>
                                                        </td>
                                                        <td>{producto.id_categoria}</td>
                                                        <td>
                                                            <button
                                                                className="epic-glow"
                                                                style={{
                                                                    background: "linear-gradient(90deg, #facc15 0%, #ffb347 100%)",
                                                                    color: "#222",
                                                                    padding: "7px 18px",
                                                                    borderRadius: 6,
                                                                    border: "none",
                                                                    fontWeight: 700,
                                                                    marginRight: 8,
                                                                    cursor: "not-allowed",
                                                                    boxShadow: "0 1px 4px #ffb34720",
                                                                    opacity: 0.6,
                                                                }}
                                                                // onClick={() => handleEditarProducto(producto)}
                                                                disabled
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                className="epic-glow"
                                                                style={{
                                                                    background: "linear-gradient(90deg, #ef4444 0%, #ff7979 100%)",
                                                                    color: "#fff",
                                                                    padding: "7px 18px",
                                                                    borderRadius: 6,
                                                                    border: "none",
                                                                    fontWeight: 700,
                                                                    cursor: "pointer",
                                                                    boxShadow: "0 1px 4px #ef444420",
                                                                }}
                                                                onClick={() => eliminarProducto(producto.codigo_producto)}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{
                                        color: "#aaa",
                                        fontSize: 18,
                                        marginTop: 18,
                                        fontWeight: 600,
                                        letterSpacing: 0.5,
                                    }}>
                                        <span style={{ fontSize: 22, marginRight: 6 }}>⏳</span>
                                        Cargando productos...
                                    </p>
                                )}
                            </div>
                        )}
                        {activeSection === "Api" && (
                            <div className="epic-gradient-border" style={{
                                width: "100%",
                                background: "#f8fafc",
                                borderRadius: 12,
                                padding: 28,
                                boxShadow: "0 1px 8px 0 rgba(67,206,162,0.08)",
                                minHeight: 120,
                            }}>
                                <h3 style={{
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: "#43cea2",
                                    marginBottom: 18,
                                }}>Lista de Clientes (API)</h3>
                                {clientes.length > 0 ? (
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="epic-gradient-border" style={{
                                            width: "100%",
                                            background: "#fff",
                                            borderRadius: 14,
                                            boxShadow: "0 2px 16px 0 rgba(0,0,0,0.07)",
                                            borderCollapse: "collapse",
                                            fontSize: 17,
                                        }}>
                                            <thead>
                                                <tr style={{ background: "#e0f7f1", color: "#222" }}>
                                                    <th style={{ padding: 12, textAlign: "left" }}>RUT</th>
                                                    <th style={{ padding: 12, textAlign: "left" }}>Nombres</th>
                                                    <th style={{ padding: 12, textAlign: "left" }}>Apellidos</th>
                                                    <th style={{ padding: 12, textAlign: "left" }}>Telefono</th>
                                                    <th style={{ padding: 12, textAlign: "left" }}>Dirección</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentClientes.map((cliente, idx) => (
                                                    <tr key={cliente.numero_rut || idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                                                        <td style={{ padding: 12 }}>{cliente.numero_rut}-{cliente.dv_rut}</td>
                                                        <td style={{ padding: 12 }}>{cliente.primer_nombre} {cliente.segundo_nombre}</td>
                                                        <td style={{ padding: 12 }}>{cliente.apellido_paterno} {cliente.apellido_materno}</td>
                                                        <td style={{ padding: 12 }}>{cliente.telefono}</td>
                                                        <td style={{ padding: 12 }}>{cliente.direccion}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan={5}>
                                                        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 10 }}>
                                                            <button
                                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                                disabled={currentPage === 1}
                                                                className="epic-glow"
                                                                style={{ padding: "8px 16px", borderRadius: 6, background: "#43cea2", color: "#fff", border: "none", cursor: "pointer" }}
                                                            >
                                                                ◀ Anterior
                                                            </button>
                                                            <span style={{ fontSize: 18, fontWeight: 600 }}>Página {currentPage}</span>
                                                            <button
                                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                                disabled={indexOfLastItem >= clientes.length}
                                                                className="epic-glow"
                                                                style={{ padding: "8px 16px", borderRadius: 6, background: "#43cea2", color: "#fff", border: "none", cursor: "pointer" }}
                                                            >
                                                                Siguiente ▶
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: "#aaa", fontSize: 17 }}>Cargando clientes...</p>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
