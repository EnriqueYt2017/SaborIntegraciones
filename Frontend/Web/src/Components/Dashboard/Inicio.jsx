import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const sections = [
    { key: "Inicio", label: "Inicio" },
    { key: "usuarios", label: "Usuarios" },
    { key: "productos", label: "Productos" },
    { key: "Api", label: "Api" },
];

const gradients = {
    Inicio: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    clientes: "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)",
    vendedores: "linear-gradient(135deg, #ff512f 0%, #dd2476 100%)",
    productos: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
};

function Dashboard() {
    const [activeSection, setActiveSection] = useState("Inicio");
    const navigate = useNavigate();
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



    // Obtener clientes
    const obtenerUsuarios = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/Usuarios");
            setUsuario(res.data);
        } catch (err) {
            console.error("Error al obtener usuarios:", err);
        }
    };


    useEffect(() => {
        obtenerUsuarios();

        axios.get("http://localhost:5000/clientes")
            .then(response => setClientes(response.data))
            .catch(error => console.error("Error al obtener clientes:", error));
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
                        <span style={{
                            position: "absolute",
                            top: 24,
                            right: 36,
                            fontSize: 54,
                            opacity: 0.08,
                            pointerEvents: "none",
                            userSelect: "none",
                        }}>
                            {activeSection === "Inicio" && "✨"}
                            {activeSection === "usuarios" && "👥"}
                            {activeSection === "productos" && "🍟"}
                            {activeSection === "Api" && "🔗"}
                        </span>
                        {activeSection === "Inicio" && (
                            <>
                                <p style={{ fontSize: 22, color: "#444", marginBottom: 18, fontWeight: 500 }}>
                                    ¡Gestiona tu negocio con <span style={{ color: "#ffb347", fontWeight: 700 }}>estilo</span>! Selecciona una sección en el menú lateral.
                                </p>
                                <ul style={{ fontSize: 18, color: "#666", marginLeft: 28, lineHeight: 2 }}>
                                    <li>👤 <b>Usuarios</b>: administra tu base de usuarios.</li>
                                    <li>🍔 <b>Productos</b>: controla tu inventario.</li>
                                    <li>🔗 <b>API</b>: consulta clientes externos.</li>
                                </ul>
                            </>
                        )}
                        {activeSection === "usuarios" && (
                            <div style={{ width: "100%" }}>
                                {/* Formulario */}
                                <div
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
                                    <table style={{
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
                                                <th style={{ padding: 12, textAlign: "left" }}>Nombre</th>
                                                <th style={{ padding: 12, textAlign: "left" }}>Apellido</th>
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
                                                    <td style={{ padding: 12 }}>{c.PRIMER_APELLIDO || c.primer_apellido}</td>
                                                    <td style={{ padding: 12 }}>{c.CORREO || c.correo}</td>
                                                    <td style={{ padding: 12 }}>{c.DIRECCION || c.direccion}</td>
                                                    <td style={{ padding: 12 }}>
                                                        <button
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
                            <div style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 180,
                            }}>
                                <span style={{
                                    fontSize: 60,
                                    marginBottom: 18,
                                    color: "#f7971e",
                                    filter: "drop-shadow(0 2px 8px #ffd20040)"
                                }}>🍔</span>
                                <p style={{ fontSize: 22, color: "#444", fontWeight: 600 }}>
                                    Gestión de productos: agregar, editar, eliminar, buscar...
                                </p>
                                <p style={{ color: "#888", fontSize: 16, marginTop: 8 }}>
                                    (Próximamente: panel avanzado de inventario)
                                </p>
                            </div>
                        )}
                        {activeSection === "Api" && (
                            <div style={{
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
                                        <table style={{
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
                                                {clientes.map((cliente, idx) => (
                                                    <tr key={cliente.numero_rut || idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                                                        <td style={{ padding: 12 }}>{cliente.numero_rut}-{cliente.dv_rut}</td>
                                                        <td style={{ padding: 12 }}>{cliente.primer_nombre} {cliente.segundo_nombre}</td>
                                                        <td style={{ padding: 12 }}>{cliente.apellido_paterno} {cliente.apellido_materno}</td>
                                                        <td style={{ padding: 12 }}>{cliente.telefono}</td>
                                                        <td style={{ padding: 12 }}>{cliente.direccion}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
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
