/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

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
    const [usuarios, setUsuarios] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [form, setForm] = useState({
        rut: "", dvrut: "", primer_nombre: "", segundo_nombre: "",
        primer_apellido: "", segundo_apellido: "", direccion: "", correo: "", pass: "", id_rol: ""
    });
    const [modoEdicion, setModoEdicion] = useState(false);

    // PRODUCTOS
    const [codigo_producto, setCodigoProducto] = useState("");
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precio, setPrecio] = useState("");
    const [id_categoria, setIdCategoria] = useState("");
    const [stock, setStock] = useState("");
    const [imagen, setImagen] = useState(null);
    const [preview, setPreview] = useState(null);
    const [editandoProducto, setEditandoProducto] = useState(false);

    // ESTADÍSTICAS
    const [estadisticasVentas, setEstadisticasVentas] = useState({});
    const [estadisticasProductos, setEstadisticasProductos] = useState({});
    const [estadisticasUsuarios, setEstadisticasUsuarios] = useState({});
    const [estadisticasPedidos, setEstadisticasPedidos] = useState({});
    const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);

    const fileInputRef = useRef();

    const validarFormulario = () => {
        return form.rut && form.dvrut && form.primer_nombre && form.primer_apellido && form.correo;
    };
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientes.slice(indexOfFirstItem, indexOfLastItem);

    const [alerta, setAlerta] = useState({ visible: false, mensaje: "", tipo: "info" });

    const mostrarAlerta = useCallback((mensaje, tipo = "info") => {
        setAlerta({ visible: true, mensaje, tipo });
        setTimeout(() => setAlerta(prev => ({ ...prev, visible: false })), 3000);
    }, []);

    // Obtener usuarios
    const obtenerUsuarios = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/Usuarios");
            setUsuarios(res.data);
        } catch (err) {
            console.error("Error al obtener usuarios:", err);
        }
    };

    // Obtener productos
    const obtenerProductos = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/productos");
            setProductos(res.data);
        } catch (err) {
            console.error("Error al obtener productos:", err);
        }
    };

    // Obtener estadísticas
    const obtenerEstadisticas = useCallback(async () => {
        setCargandoEstadisticas(true);
        try {
            const [ventasRes, productosRes, usuariosRes, pedidosRes] = await Promise.all([
                axios.get("http://localhost:5000/api/estadisticas/ventas"),
                axios.get("http://localhost:5000/api/estadisticas/productos"),
                axios.get("http://localhost:5000/api/estadisticas/usuarios"),
                axios.get("http://localhost:5000/api/estadisticas/pedidos")
            ]);

            setEstadisticasVentas(ventasRes.data);
            setEstadisticasProductos(productosRes.data);
            setEstadisticasUsuarios(usuariosRes.data);
            setEstadisticasPedidos(pedidosRes.data);
        } catch (err) {
            console.error("Error al obtener estadísticas:", err);
            mostrarAlerta("Error al cargar estadísticas", "error");
        } finally {
            setCargandoEstadisticas(false);
        }
    }, [mostrarAlerta]);

    // AGREGAR O ACTUALIZAR PRODUCTO
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!codigo_producto || !nombre || !descripcion || !precio || !id_categoria || stock === "") {
            alert("Completa todos los campos del producto.");
            return;
        }
        try {
            const formData = new FormData();
            formData.append("codigo_producto", codigo_producto);
            formData.append("nombre", nombre);
            formData.append("descripcion", descripcion);
            formData.append("precio", precio);
            formData.append("id_categoria", id_categoria);
            formData.append("stock", stock);
            if (imagen) formData.append("imagen", imagen);

            if (editandoProducto) {
                // Actualizar producto
                await axios.put(`http://localhost:5000/productos/${codigo_producto}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                mostrarAlerta("Producto actualizado correctamente", "success");
            } else {
                // Agregar producto
                await axios.post("http://localhost:5000/productos", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                mostrarAlerta("Producto agregado correctamente", "success");
            }
            obtenerProductos();
            limpiarFormularioProducto();
        } catch (error) {
            mostrarAlerta("Error al guardar producto", "error");
        }
    };

    // ELIMINAR PRODUCTO
    const eliminarProducto = async (id) => {
        if (window.confirm("¿Seguro que quieres eliminar este producto?")) {
            try {
                await axios.delete(`http://localhost:5000/productos/${id}`);
                setProductos(productos.filter(producto => producto.codigo_producto !== id));
                mostrarAlerta("Producto eliminado correctamente", "success");
            } catch (error) {
                mostrarAlerta("Error al eliminar producto", "error");
            }
        }
    };

    // EDITAR PRODUCTO
    const handleEditarProducto = (producto) => {
        setCodigoProducto(producto.codigo_producto);
        setNombre(producto.nombre);
        setDescripcion(producto.descripcion);
        setPrecio(producto.precio);
        setIdCategoria(producto.id_categoria);
        setStock(producto.stock || 0);
        setImagen(null);
        setPreview(producto.imagen || null);
        setEditandoProducto(true);
        setActiveSection("productos");
    };

    // LIMPIAR FORMULARIO PRODUCTO
    const limpiarFormularioProducto = () => {
        setCodigoProducto("");
        setNombre("");
        setDescripcion("");
        setPrecio("");
        setIdCategoria("");
        setStock("");
        setImagen(null);
        setPreview(null);
        setEditandoProducto(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Imagen preview
    const handleImagenChange = (e) => {
        const file = e.target.files[0];
        setImagen(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    // USUARIOS
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // AGREGAR USUARIO
    const handleAgregar = async () => {
        if (!validarFormulario()) {
            mostrarAlerta("Por favor completa todos los campos requeridos.");
            return;
        }
        try {
            await axios.post("http://localhost:5000/api/Usuarios", { ...form, id_rol: Number(form.id_rol) });
            obtenerUsuarios();
            setForm({
                rut: "", dvrut: "", primer_nombre: "", segundo_nombre: "",
                primer_apellido: "", segundo_apellido: "", direccion: "", correo: "", pass: "", id_rol: ""
            });
            mostrarAlerta("Usuario agregado correctamente", "success");
        } catch (err) {
            mostrarAlerta("Error al agregar usuario", "error");
        }
    };

    // EDITAR USUARIO
    const handleEditar = (usuario) => {
        setForm({
            rut: usuario.rut || usuario.RUT || "",
            dvrut: usuario.dvrut || usuario.DVRUT || "",
            primer_nombre: usuario.primer_nombre || usuario.PRIMER_NOMBRE || "",
            segundo_nombre: usuario.segundo_nombre || usuario.SEGUNDO_NOMBRE || "",
            primer_apellido: usuario.primer_apellido || usuario.PRIMER_APELLIDO || "",
            segundo_apellido: usuario.segundo_apellido || usuario.SEGUNDO_APELLIDO || "",
            direccion: usuario.direccion || usuario.DIRECCION || "",
            correo: usuario.correo || usuario.CORREO || "",
            pass: "",
            id_rol: String(usuario.id_rol || usuario.ID_ROL || "")
        });
        setModoEdicion(true);
    };

    // ACTUALIZAR USUARIO
    const handleActualizar = async () => {
        try {
            await axios.put(`http://localhost:5000/api/Usuarios/${form.rut}`, form);
            obtenerUsuarios();
            setForm({
                rut: "", dvrut: "", primer_nombre: "", segundo_nombre: "",
                primer_apellido: "", segundo_apellido: "", direccion: "", correo: "", pass: "", id_rol: ""
            });
            setModoEdicion(false);
            mostrarAlerta("Usuario editado correctamente", "success");
        } catch (err) {
            mostrarAlerta("Error al actualizar usuario", "error");
        }
    };

    // ELIMINAR USUARIO (por RUT)
    const handleEliminar = async (rut) => {
        if (window.confirm("¿Seguro que quieres eliminar este usuario?")) {
            try {
                await axios.delete(`http://localhost:5000/api/Usuarios/${rut}`);
                obtenerUsuarios();
            } catch (err) {
                mostrarAlerta("Error al eliminar usuario", "error");
            }
        }
    };

    const goHome = () => {
        navigate("/");
    };

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData && userData !== "undefined" && userData !== "{}" && userData !== "null") {
            try {
                setUsuario(JSON.parse(userData));
            } catch {
                setUsuario(null);
            }
        }
        obtenerUsuarios();
        axios.get("http://localhost:5000/clientes")
            .then(response => setClientes(response.data))
            .catch(error => console.error("Error al obtener clientes:", error));
        obtenerProductos();
        obtenerEstadisticas();
    }, [obtenerEstadisticas]);

    // Si no tiene permiso para dashboard, redirige
    useEffect(() => {
        if (usuario && usuario.id_rol === 1) {
            navigate("/home");
        }
    }, [usuario, navigate]);

    // Permisos por rol
    const puedeVerUsuarios = usuario && usuario.id_rol === 6;
    const puedeVerProductos = usuario && (usuario.id_rol === 2 || usuario.id_rol === 6);
    const puedeVerApi = usuario && usuario.id_rol === 6;

    // Sidebar con permisos
    const filteredSections = sections.filter(section => {
        if (section.key === "usuarios") return puedeVerUsuarios;
        if (section.key === "productos") return puedeVerProductos;
        if (section.key === "Api") return puedeVerApi;
        return true;
    });
    // 
    return (
        <>
            {alerta.visible && (
                <div
                    style={{
                        position: "fixed",
                        top: 30,
                        right: 30,
                        zIndex: 9999,
                        padding: "18px 32px",
                        borderRadius: 12,
                        background: alerta.tipo === "success"
                            ? "linear-gradient(90deg, #22c55e 0%, #43cea2 100%)"
                            : alerta.tipo === "error"
                                ? "linear-gradient(90deg, #ef4444 0%, #ff7979 100%)"
                                : "linear-gradient(90deg, #facc15 0%, #ffb347 100%)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 18,
                        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.13)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 220,
                        letterSpacing: 0.5,
                        border: "2px solid #fff4",
                        animation: "epicFloat 0.6s"
                    }}
                >
                    {alerta.tipo === "success" && "✅"}
                    {alerta.tipo === "error" && "❌"}
                    {alerta.tipo === "info" && "ℹ️"}
                    <span>{alerta.mensaje}</span>
                </div>
            )
            }

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
                        }}>⚙️</span>
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
                        {filteredSections.map((section) => (
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
                                    {section.key === "productos" && "🛍️"}
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
                            {activeSection === "productos" && <>🛍️ <span style={{ color: "#f7971e" }}>Administrar Productos</span></>}
                            {activeSection === "Api" && <>🔗 <span style={{ color: "#43cea2" }}>API Clientes</span></>}
                        </h2>
                        <div
                            className="epic-gradient-border"
                            style={{
                                background: activeSection === "Inicio" ? "#f8fafc" : "linear-gradient(120deg, #f8fafc 80%, #ffcc3320 100%)",
                                borderRadius: 22,
                                boxShadow: "0 4px 32px 0 rgba(0,0,0,0.09)",
                                padding: activeSection === "Inicio" ? 20 : 44,
                                minHeight: activeSection === "Inicio" ? "auto" : 260,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: activeSection === "Inicio" ? "flex-start" : "center",
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
                                {activeSection === "productos" && "🛍️"}
                                {activeSection === "Api" && "🔗"}
                            </span>
                            {activeSection === "Inicio" && (
                                <div style={{ width: "100%", padding: "0 20px" }}>
                                    {cargandoEstadisticas ? (
                                        <div style={{ textAlign: "center", padding: "40px" }}>
                                            <p style={{ fontSize: 18, color: "#666" }}>Cargando estadísticas...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Tarjetas de resumen */}
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                                                gap: "20px",
                                                marginBottom: "30px"
                                            }}>
                                                <div style={{
                                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                    borderRadius: "16px",
                                                    padding: "25px",
                                                    color: "white",
                                                    textAlign: "center",
                                                    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.25)"
                                                }}>
                                                    <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", opacity: 0.9 }}>Total Ventas</h3>
                                                    <p style={{ margin: "0", fontSize: "32px", fontWeight: "bold" }}>
                                                        {estadisticasVentas.totalVentas || 0}
                                                    </p>
                                                    <p style={{ margin: "5px 0 0 0", fontSize: "14px", opacity: 0.8 }}>
                                                        ${(estadisticasVentas.montoTotal || 0).toLocaleString()}
                                                    </p>
                                                </div>

                                                <div style={{
                                                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                                    borderRadius: "16px",
                                                    padding: "25px",
                                                    color: "white",
                                                    textAlign: "center",
                                                    boxShadow: "0 8px 25px rgba(240, 147, 251, 0.25)"
                                                }}>
                                                    <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", opacity: 0.9 }}>Total Productos</h3>
                                                    <p style={{ margin: "0", fontSize: "32px", fontWeight: "bold" }}>
                                                        {estadisticasProductos.totalProductos || 0}
                                                    </p>
                                                    <p style={{ margin: "5px 0 0 0", fontSize: "14px", opacity: 0.8 }}>
                                                        {(estadisticasProductos.productosBajoStock || []).length} bajo stock
                                                    </p>
                                                </div>

                                                <div style={{
                                                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                                    borderRadius: "16px",
                                                    padding: "25px",
                                                    color: "white",
                                                    textAlign: "center",
                                                    boxShadow: "0 8px 25px rgba(79, 172, 254, 0.25)"
                                                }}>
                                                    <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", opacity: 0.9 }}>Total Usuarios</h3>
                                                    <p style={{ margin: "0", fontSize: "32px", fontWeight: "bold" }}>
                                                        {estadisticasUsuarios.totalUsuarios || 0}
                                                    </p>
                                                    <p style={{ margin: "5px 0 0 0", fontSize: "14px", opacity: 0.8 }}>
                                                        {estadisticasUsuarios.nuevosUsuarios || 0} nuevos este mes
                                                    </p>
                                                </div>

                                                <div style={{
                                                    background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                                                    borderRadius: "16px",
                                                    padding: "25px",
                                                    color: "white",
                                                    textAlign: "center",
                                                    boxShadow: "0 8px 25px rgba(250, 112, 154, 0.25)"
                                                }}>
                                                    <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", opacity: 0.9 }}>Pedidos Pendientes</h3>
                                                    <p style={{ margin: "0", fontSize: "32px", fontWeight: "bold" }}>
                                                        {(estadisticasPedidos.pedidosPorEstado || []).find(p => p.estado === 'Pendiente')?.cantidad || 0}
                                                    </p>
                                                    <p style={{ margin: "5px 0 0 0", fontSize: "14px", opacity: 0.8 }}>
                                                        En proceso
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Gráficos */}
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "2fr 1fr",
                                                gap: "25px",
                                                marginBottom: "30px"
                                            }}>
                                                {/* Gráfico de ventas por mes */}
                                                <div style={{
                                                    background: "white",
                                                    borderRadius: "16px",
                                                    padding: "25px",
                                                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                                                }}>
                                                    <h3 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>Ventas por Mes</h3>
                                                    {estadisticasVentas.ventasPorMes && estadisticasVentas.ventasPorMes.length > 0 ? (
                                                        <Bar
                                                            data={{
                                                                labels: estadisticasVentas.ventasPorMes.map(v => v.mes),
                                                                datasets: [{
                                                                    label: 'Cantidad de Ventas',
                                                                    data: estadisticasVentas.ventasPorMes.map(v => v.cantidadVentas),
                                                                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                                                                    borderColor: 'rgba(102, 126, 234, 1)',
                                                                    borderWidth: 1,
                                                                    borderRadius: 8,
                                                                }]
                                                            }}
                                                            options={{
                                                                responsive: true,
                                                                plugins: {
                                                                    legend: {
                                                                        display: false
                                                                    }
                                                                },
                                                                scales: {
                                                                    y: {
                                                                        beginAtZero: true,
                                                                        grid: {
                                                                            color: 'rgba(0,0,0,0.05)'
                                                                        }
                                                                    },
                                                                    x: {
                                                                        grid: {
                                                                            display: false
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <p style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
                                                            No hay datos de ventas disponibles
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Gráfico de estados de pedidos */}
                                                <div style={{
                                                    background: "white",
                                                    borderRadius: "16px",
                                                    padding: "25px",
                                                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                                    height: "400px", // Altura fija para el contenedor
                                                    display: "flex",
                                                    flexDirection: "column"
                                                }}>
                                                    <h3 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>Estados de Pedidos</h3>
                                                    {estadisticasPedidos.pedidosPorEstado && estadisticasPedidos.pedidosPorEstado.length > 0 ? (
                                                        <div style={{
                                                            flex: 1,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            maxHeight: "320px" // Altura máxima para el gráfico
                                                        }}>
                                                            <Doughnut
                                                                data={{
                                                                    labels: estadisticasPedidos.pedidosPorEstado.map(p => p.estado),
                                                                    datasets: [{
                                                                        data: estadisticasPedidos.pedidosPorEstado.map(p => p.cantidad),
                                                                        backgroundColor: [
                                                                            '#667eea',
                                                                            '#f093fb',
                                                                            '#4facfe',
                                                                            '#fa709a',
                                                                            '#ffeaa7',
                                                                            '#fd79a8'
                                                                        ],
                                                                        borderWidth: 0
                                                                    }]
                                                                }}
                                                                options={{
                                                                    responsive: true,
                                                                    maintainAspectRatio: true,
                                                                    aspectRatio: 1, // Mantener relación 1:1 (círculo perfecto)
                                                                    plugins: {
                                                                        legend: {
                                                                            position: 'bottom',
                                                                            labels: {
                                                                                padding: 15,
                                                                                usePointStyle: true,
                                                                                boxWidth: 12,
                                                                                font: {
                                                                                    size: 12
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
                                                            No hay datos de pedidos disponibles
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tablas de datos */}
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "25px"
                                            }}>
                                                {/* Top usuarios */}
                                                <div style={{
                                                    background: "white",
                                                    borderRadius: "16px",
                                                    padding: "25px",
                                                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                                                }}>
                                                    <h3 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>Top Usuarios (Más Compras)</h3>
                                                    {estadisticasUsuarios.usuariosMasCompras && estadisticasUsuarios.usuariosMasCompras.length > 0 ? (
                                                        <div>
                                                            {estadisticasUsuarios.usuariosMasCompras.map((usuario, index) => (
                                                                <div key={index} style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    padding: "12px 0",
                                                                    borderBottom: index < estadisticasUsuarios.usuariosMasCompras.length - 1 ? "1px solid #f0f0f0" : "none"
                                                                }}>
                                                                    <div>
                                                                        <p style={{ margin: "0", fontWeight: "600", color: "#333" }}>{usuario.nombre}</p>
                                                                        <p style={{ margin: "2px 0 0 0", fontSize: "14px", color: "#666" }}>{usuario.totalCompras} compras</p>
                                                                    </div>
                                                                    <div style={{ textAlign: "right" }}>
                                                                        <p style={{ margin: "0", fontWeight: "600", color: "#667eea" }}>
                                                                            ${usuario.totalGastado.toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ textAlign: "center", color: "#666", padding: "20px 0" }}>
                                                            No hay datos de usuarios disponibles
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Top productos */}
                                                <div style={{
                                                    background: "white",
                                                    borderRadius: "16px",
                                                    padding: "25px",
                                                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                                                }}>
                                                    <h3 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>Productos Más Vendidos</h3>
                                                    {estadisticasProductos.productosMasVendidos && estadisticasProductos.productosMasVendidos.length > 0 ? (
                                                        <div>
                                                            {estadisticasProductos.productosMasVendidos.map((producto, index) => (
                                                                <div key={index} style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    padding: "12px 0",
                                                                    borderBottom: index < estadisticasProductos.productosMasVendidos.length - 1 ? "1px solid #f0f0f0" : "none"
                                                                }}>
                                                                    <div>
                                                                        <p style={{ margin: "0", fontWeight: "600", color: "#333" }}>{producto.nombre}</p>
                                                                    </div>
                                                                    <div style={{ textAlign: "right" }}>
                                                                        <p style={{ margin: "0", fontWeight: "600", color: "#f093fb" }}>
                                                                            {producto.totalVendido} vendidos
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ textAlign: "center", color: "#666", padding: "20px 0" }}>
                                                            No hay datos de productos disponibles
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Botón para actualizar datos */}
                                            <div style={{ textAlign: "center", marginTop: "30px" }}>
                                                <button
                                                    onClick={obtenerEstadisticas}
                                                    disabled={cargandoEstadisticas}
                                                    style={{
                                                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "10px",
                                                        padding: "12px 24px",
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        cursor: cargandoEstadisticas ? "not-allowed" : "pointer",
                                                        opacity: cargandoEstadisticas ? 0.7 : 1,
                                                        boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                                                        transition: "all 0.3s ease"
                                                    }}
                                                >
                                                    {cargandoEstadisticas ? "Actualizando..." : "🔄 Actualizar Estadísticas"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            {activeSection === "usuarios" && puedeVerUsuarios && (
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
                                            <select
                                                name="id_rol"
                                                value={form.id_rol || ""}
                                                onChange={handleChange}
                                                ClassName="epic-float"
                                                style={{
                                                    border: "1.5px solid #d1d5db",
                                                    borderRadius: 8,
                                                    padding: "10px 14px",
                                                    fontSize: 17,
                                                    background: "#f8fafc",
                                                    boxShadow: "0 1px 4px #764ba210",

                                                }}
                                                required
                                            >
                                                <option value="">Selecciona un rol</option>
                                                <option value={1}>Cliente</option>
                                                <option value={2}>Vendedor</option>
                                                <option value={3}>Preparador Fisico</option>
                                                <option value={4}>Nutricionista</option>
                                                <option value={5}>Repartidor</option>
                                                <option value={6}>Super Admin</option>
                                            </select>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            {modoEdicion && (
                                                <button
                                                    onClick={() => {
                                                        setModoEdicion(false);
                                                        setForm({
                                                            rut: "", dvrut: "", primer_nombre: "", segundo_nombre: "",
                                                            primer_apellido: "", segundo_apellido: "", direccion: "", correo: "", pass: "", id_rol: ""
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
                                                    <th style={{ padding: 12, textAlign: "left" }}>Rol</th>
                                                    <th style={{ padding: 12, textAlign: "left" }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usuarios.map((c) => (
                                                    <tr key={c.RUT || c.rut} style={{ borderTop: "1px solid #e5e7eb" }}>
                                                        <td style={{ padding: 12 }}>{c.RUT || c.rut}-{c.DVRUT || c.dvrut}</td>
                                                        <td style={{ padding: 12 }}>{c.PRIMER_NOMBRE || c.primer_nombre} {c.SEGUNDO_NOMBRE || c.segundo_nombre}</td>
                                                        <td style={{ padding: 12 }}>{c.PRIMER_APELLIDO || c.primer_apellido} {c.SEGUNDO_APELLIDO || c.segundo_apellido}</td>
                                                        <td style={{ padding: 12 }}>{c.CORREO || c.correo}</td>
                                                        <td style={{ padding: 12 }}>{c.DIRECCION || c.direccion}</td>
                                                        <td style={{ padding: 12 }}>{c.ID_ROL || c.id_rol}</td>
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
                            {activeSection === "productos" && puedeVerProductos && (
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
                                    <span className="epic-productos-emoji">🛍️</span>
                                    <div className="epic-productos-title">
                                        <span>{editandoProducto ? "Editar Producto" : "Administrar Productos"}</span>
                                        <span style={{
                                            fontSize: 28,
                                            marginLeft: 8,
                                            filter: "drop-shadow(0 2px 8px #ffcc3340)"
                                        }}>🔥</span>
                                    </div>
                                    {/* Formulario de productos */}
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
                                        {/* Mostrar preview de imagen si existe */}
                                        {preview && (
                                            <div style={{ marginBottom: 12, width: "100%", textAlign: "center" }}>
                                                <img
                                                    src={preview}
                                                    alt="Vista previa"
                                                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12, boxShadow: "0 2px 8px #43e97b30" }}
                                                />
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleImagenChange} ref={fileInputRef} />
                                        <input
                                            type="number"
                                            placeholder="Código Producto"
                                            value={codigo_producto}
                                            onChange={(e) => setCodigoProducto(e.target.value)}
                                            disabled={editandoProducto}
                                        />
                                        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                                        <input type="text" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                                        <input type="number" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                                        <input type="number" placeholder="ID Categoría" value={id_categoria} onChange={(e) => setIdCategoria(e.target.value)} />
                                        <input
                                            type="number"
                                            placeholder="Stock"
                                            value={stock}
                                            onChange={e => setStock(e.target.value)}
                                        />

                                        {usuario && (usuario.id_rol === 2 || usuario.id_rol === 6) && (
                                            <>
                                                <button type="submit">
                                                    <span style={{ fontSize: 20, marginRight: 6 }}>{editandoProducto ? "✏️" : "➕"}</span>
                                                    {editandoProducto ? "Actualizar Producto" : "Agregar Producto"}
                                                </button>
                                                {editandoProducto && (
                                                    <button
                                                        type="button"
                                                        style={{
                                                            background: "#e5e7eb",
                                                            color: "#222",
                                                            padding: "10px 26px",
                                                            borderRadius: 8,
                                                            border: "none",
                                                            fontWeight: 700,
                                                            fontSize: 16,
                                                            cursor: "pointer",
                                                            marginLeft: 8,
                                                            boxShadow: "0 1px 4px #764ba210",
                                                            transition: "background 0.2s",
                                                        }}
                                                        onClick={limpiarFormularioProducto}
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </>
                                        )}
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
                                                        <th>Imagen</th>
                                                        <th>Código</th>
                                                        <th>Nombre</th>
                                                        <th>Descripción</th>
                                                        <th>Precio</th>
                                                        <th>ID Categoría</th>
                                                        <th>Stock</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {productos.map((producto) => (
                                                        <tr key={producto.codigo_producto}>
                                                            <td>
                                                                {producto.imagen ? (
                                                                    <img src={producto.imagen} alt={producto.nombre} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
                                                                ) : (
                                                                    <span role="img" aria-label="producto" style={{ fontSize: 36 }}>🛍️</span>
                                                                )}
                                                            </td>
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
                                                            <td>{producto.stock}</td>
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
                                                                        cursor: "pointer",
                                                                        boxShadow: "0 1px 4px #ffb34720",
                                                                    }}
                                                                    onClick={() => handleEditarProducto(producto)}
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
                            {activeSection === "Api" && puedeVerApi && (
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
        </>
    );
}

export default Dashboard;