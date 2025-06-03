import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaTrashAlt, FaHome, FaDownload, FaArrowLeft } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import Imagelogo from "../../assets/icono-logo.png";

// Simulación de sucursales (reemplaza con fetch real si tienes endpoint)
const sucursales = [{ id: 1, nombre: "Sucursal Puente Alto" }];

function calcularTotal(productos) {
    return productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
}

function sumarDiasHabiles(fecha, dias) {
    let count = 0;
    let result = new Date(fecha);
    while (count < dias) {
        result.setDate(result.getDate() + 1);
        if (result.getDay() !== 0 && result.getDay() !== 6) {
            count++;
        }
    }
    return result;
}

function generarNumeroReserva() {
    const now = new Date();
    const fecha = now.toISOString().slice(0, 10).replace(/-/g, "");
    const hora =
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0");
    return `RES-${fecha}-${hora}`;
}

const styles = {
    container: {
        maxWidth: 600,
        margin: "2rem auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 16px #e0e0e0",
        padding: 32,
    },
    title: {
        fontWeight: 700,
        fontSize: 28,
        color: "#43e97b",
        marginBottom: 12,
        letterSpacing: 1,
    },
    subtitle: {
        fontWeight: 600,
        fontSize: 20,
        margin: "24px 0 12px 0",
        color: "#222",
    },
    important: {
        color: "#e53935",
        fontWeight: 600,
        margin: "18px 0 8px 0",
        fontSize: 16,
    },
    productList: {
        listStyle: "none",
        padding: 0,
        margin: 0,
    },
    productItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid #f0f0f0",
    },
    trashBtn: {
        background: "none",
        border: "none",
        color: "#e53935",
        cursor: "pointer",
        marginLeft: 8,
        fontSize: 18,
    },
    formTitle: {
        fontWeight: 700,
        fontSize: 22,
        color: "#43e97b",
        margin: "32px 0 16px 0",
        letterSpacing: 1,
    },
    formGroup: {
        marginBottom: 18,
    },
    label: {
        display: "block",
        fontWeight: 500,
        marginBottom: 4,
        color: "#333",
    },
    input: {
        width: "100%",
        padding: "8px 12px",
        borderRadius: 6,
        border: "1px solid #ccc",
        fontSize: 16,
    },
    select: {
        width: "100%",
        padding: "8px 12px",
        borderRadius: 6,
        border: "1px solid #ccc",
        fontSize: 16,
    },
    button: {
        marginTop: 16,
        background: "linear-gradient(90deg,#43e97b 0%,#38f9d7 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "12px 28px",
        fontWeight: 700,
        fontSize: 16,
        cursor: "pointer",
        boxShadow: "0 2px 8px #e0e0e0",
        transition: "background 0.2s",
    },
    empty: {
        textAlign: "center",
        color: "#888",
        margin: "48px 0",
    },
    homeIcon: {
        fontSize: 48,
        color: "#43e97b",
        marginBottom: 12,
    },
    backBtn: {
        background: "#43e97b",
        color: "#fff",
        marginTop: 24,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        textDecoration: "none",
        border: "none",
        borderRadius: 8,
        padding: "10px 24px",
        fontWeight: 600,
        cursor: "pointer",
    },
    voucher: {
        maxWidth: 800, // antes 600
        minHeight: 600, // agrega altura mínima
        margin: "2rem auto",
        border: "2px solid #43e97b",
        padding: 48, // antes 32
        borderRadius: 16,
        background: "#f8fff8",
        boxShadow: "0 2px 16px #e0e0e0",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    },
    voucherTitle: {
        color: "#43e97b",
        fontWeight: 800,
        fontSize: 28,
        marginBottom: 12,
        letterSpacing: 1,
    },
    downloadBtn: {

        background: "#38f9d7",
        color: "#fff",
        marginTop: 16,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "none",
        borderRadius: 8,
        padding: "10px 24px",
        fontWeight: 600,
        cursor: "pointer",
    },
};

const Reserva = () => {
    const [usuario, setUsuario] = useState(null);
    const [productos, setProductos] = useState([]);
    const [email, setEmail] = useState("");
    const [sucursal, setSucursal] = useState("");
    const [voucher, setVoucher] = useState(null);
    const voucherRef = useRef();
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Obtener usuario de localStorage y setear usuario para el formulario
        const userData = localStorage.getItem("user");
        if (userData && userData !== "undefined" && userData !== "{}" && userData !== "null") {
            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && Object.keys(parsedUser).length > 0) {
                    setUser(parsedUser);
                    // Si tiene rut, obtener datos actualizados del backend
                    if (parsedUser.rut) {
                        axios
                            .get(`http://localhost:5000/usuarios/${parsedUser.rut}`)
                            .then((res) => setUsuario(res.data))
                            .catch(() => setUsuario(parsedUser));
                    }
                } else {
                    navigate("/login");
                }
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
        setUser(null); // ✅ Limpia el estado
        navigate("/login"); // ✅ Redirige al login
    };


    useEffect(() => {
        const carrito = JSON.parse(localStorage.getItem("carrito_reserva")) || [];
        setProductos(carrito);
    }, []);

    const total = calcularTotal(productos);

    const handleReservar = async (e) => {
        e.preventDefault();
        const fechaReserva = new Date();
        const fechaLimite = sumarDiasHabiles(fechaReserva, 10);
        const numeroReserva = generarNumeroReserva();

        const reservaData = {
            numeroReserva,
            usuario: { ...usuario, email },
            sucursal: sucursales.find((s) => s.id === parseInt(sucursal)),
            productos,
            total,
            fechaReserva: fechaReserva.toLocaleDateString(),
            fechaLimite: fechaLimite.toLocaleDateString(),
        };

        try {
            await axios.post("http://localhost:5000/api/reservas", reservaData);
            await axios.post("http://localhost:5000/enviar-voucher-reserva", reservaData);
            setVoucher(reservaData);
            localStorage.setItem("carrito_reserva", JSON.stringify([]));
            setProductos([]);
        } catch (error) {
            alert("No se pudo enviar la reserva. Intenta nuevamente.");
            console.error(error);
        }
    };

    const handleEliminarProducto = (id) => {
        const nuevosProductos = productos.filter((p) => p.id !== id);
        setProductos(nuevosProductos);
        localStorage.setItem("carrito_reserva", JSON.stringify(nuevosProductos));
    };

    const handleVolverProductos = () => {
        window.location.href = "/productos";
    };

    const handleVolverInicio = () => {
        window.location.href = "/";
    };

    const handleDescargarPDF = async () => {
        const input = voucherRef.current;
        // Agrega padding temporal para el PDF
        const originalPadding = input.style.padding;
        input.style.padding = "64px 48px 64px 48px"; // más espacio arriba y abajo

        // Espera a que el DOM se actualice
        await new Promise((resolve) => setTimeout(resolve, 100));

        const canvas = await html2canvas(input, { scale: 2, backgroundColor: "#f8fff8" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Centra la imagen verticalmente si sobra espacio
        const y = pdfHeight < pdf.internal.pageSize.getHeight()
            ? (pdf.internal.pageSize.getHeight() - pdfHeight) / 2
            : 0;

        pdf.addImage(imgData, "PNG", 0, y, pdfWidth, pdfHeight);
        pdf.save(`${voucher.numeroReserva}.pdf`);

        // Restaura el padding original
        input.style.padding = originalPadding;
    };

    if (voucher) {
        return (
            <div style={styles.voucher}>
                <div
                    ref={voucherRef}
                    style={{
                        ...styles.voucher,
                        boxShadow: "none",
                        margin: 0,
                        padding: "64px 48px 64px 48px", // más espacio para PDF y pantalla
                        minHeight: 700,
                        background: "#f8fff8",
                    }}
                >
                    <h2 style={styles.voucherTitle}>Voucher de Reserva</h2>
                    <p>
                        <strong>N° Reserva:</strong> {voucher.numeroReserva}
                    </p>
                    <p>
                        <strong>Nombre:</strong> {voucher.usuario?.primer_nombre}{" "}
                        {voucher.usuario?.primer_apellido}
                    </p>
                    <p>
                        <strong>RUT:</strong> {voucher.usuario?.rut}
                    </p>
                    <p>
                        <strong>Email:</strong> {voucher.usuario?.email}
                    </p>
                    <p>
                        <strong>Sucursal:</strong> {voucher.sucursal?.nombre}
                    </p>
                    <h3 style={{ marginTop: 32, color: "#43e97b" }}>
                        Productos Reservados:
                    </h3>
                    <ul style={{ ...styles.productList, marginBottom: 32 }}>
                        {voucher.productos.map((p) => (
                            <li key={p.id} style={{ ...styles.productItem, padding: "16px 0" }}>
                                <span>
                                    {p.nombre} x {p.cantidad}
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    ${p.precio * p.cantidad}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p style={{ fontWeight: 700, fontSize: 20, marginTop: 24, marginBottom: 24 }}>
                        Total: ${voucher.total}
                    </p>
                    <div
                        style={{
                            background: "#fff3e0",
                            borderRadius: 8,
                            padding: 24,
                            margin: "32px 0 24px 0",
                            color: "#e53935",
                            fontWeight: 600,
                            fontSize: 16,
                        }}
                    >
                        <span style={{ fontSize: 20 }}>¡Importante!</span>
                        <br />
                        El sistema de reservas funciona de la siguiente manera: No tiene costo adicional la reserva de un producto, pero tendrás un plazo de <b>10 días hábiles</b> para ir a retirar el producto.
                    </div>
                    <p style={{ marginTop: 24, marginBottom: 24, fontSize: 16 }}>
                        Puedes retirar tus productos entre el <b>{voucher.fechaReserva}</b> y el <b>{voucher.fechaLimite}</b> (10 días hábiles desde la reserva).
                        Desde las 10:00 AM hasta las 7:00 PM.
                    </p>
                    <p style={{ color: "#43e97b", fontWeight: 600, fontSize: 18, marginTop: 24 }}>
                        ¡Gracias por reservar con nosotros!
                    </p>
                </div>
                <button style={styles.downloadBtn} onClick={handleDescargarPDF}>
                    <FaDownload /> Descargar PDF
                </button>
                <button style={styles.backBtn} onClick={handleVolverInicio}>
                    <FaArrowLeft /> Volver al inicio
                </button>
            </div>
        );
    }

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
                <h2 style={styles.title}>Reserva de Productos</h2>
                <h3 style={styles.subtitle}>Productos en tu reserva:</h3>
                {productos.length === 0 ? (
                    <div style={styles.empty}>
                        <FaHome style={styles.homeIcon} />
                        <div style={{ fontSize: 20, marginBottom: 16 }}>
                            Sin productos
                        </div>
                        <button style={styles.button} onClick={handleVolverProductos}>
                            <FaArrowLeft style={{ marginRight: 8 }} />
                            Volver a productos
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ margin: "24px 0" }}>
                            <table style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                background: "#f9f9f9",
                                borderRadius: 8,
                                overflow: "hidden",
                                boxShadow: "0 1px 6px #e0e0e0"
                            }}>
                                <thead>
                                    <tr style={{ background: "#43e97b", color: "#fff" }}>
                                        <th style={{ padding: "12px 8px", textAlign: "left" }}>Nombre Producto</th>
                                        <th style={{ padding: "12px 8px", textAlign: "center" }}>Cantidad</th>
                                        <th style={{ padding: "12px 8px", textAlign: "center" }}>Precio unitario</th>
                                        <th style={{ padding: "12px 8px", textAlign: "center" }}>Subtotal</th>
                                        <th style={{ padding: "12px 8px", textAlign: "center" }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productos.map((p) => (
                                        <tr key={p.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                                            <td style={{ padding: "10px 8px" }}>{p.nombre}</td>
                                            <td style={{ padding: "10px 8px", textAlign: "center" }}>{p.cantidad}</td>
                                            <td style={{ padding: "10px 8px", textAlign: "center" }}>${p.precio}</td>
                                            <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600 }}>${p.precio * p.cantidad}</td>
                                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                                <button
                                                    style={styles.trashBtn}
                                                    title="Eliminar producto"
                                                    onClick={() => handleEliminarProducto(p.id)}
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p style={{ fontWeight: 700, fontSize: 18, marginTop: 16 }}>
                            Total: ${total}
                        </p>
                        <div style={styles.important}>
                            ¡Importante!
                            <br />
                            El sistema de reservas funciona de la siguiente manera: No tiene costo adicional la reserva de un producto, pero tendrás un plazo de <b>10 días hábiles</b> para ir a retirar el producto.
                        </div>
                        <form onSubmit={handleReservar} style={{ marginTop: 32 }}>
                            <div style={styles.formTitle}>Formulario de Reserva</div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>RUT:</label>
                                <input
                                    type="text"
                                    value={
                                        usuario
                                            ? `${usuario.rut}`
                                            : ""
                                    }
                                    disabled
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nombre:</label>
                                <input
                                    type="text"
                                    value={
                                        usuario
                                            ? `${usuario.primer_nombre} ${usuario.primer_apellido}`
                                            : ""
                                    }
                                    disabled
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email:</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Ingresa tu email"
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Sucursal:</label>
                                <select
                                    required
                                    value={sucursal}
                                    onChange={(e) => setSucursal(e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="">Selecciona una sucursal</option>
                                    {sucursales.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" style={styles.button}>
                                Reservar
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Reserva;