import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Imagelogo from '../../assets/icono-logo.png';
import './Home.css';

function Perfil() {
    const [user, setUser] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();

    // Estados para los valores del perfil
    const [primer_nombre, setPrimerNombre] = useState("");
    const [segundo_nombre, setSegundoNombre] = useState("");
    const [primer_apellido, setPrimerApellido] = useState("");
    const [segundo_apellido, setSegundoApellido] = useState("");
    const [rutOriginal, setRutOriginal] = useState("");
    const [direccion, setDireccion] = useState("");
    const [correo, setCorreo] = useState("");
    const [rut, setRut] = useState("");
    const [dvrut, setDvrut] = useState("");

    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const res = await axios.get("http://localhost:5000/perfil", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const usuario = res.data;
                setUser(usuario);
                setPrimerNombre(usuario.primer_nombre || usuario.PRIMER_NOMBRE || "");
                setSegundoNombre(usuario.segundo_nombre || usuario.SEGUNDO_NOMBRE || "");
                setPrimerApellido(usuario.primer_apellido || usuario.PRIMER_APELLIDO || "");
                setSegundoApellido(usuario.segundo_apellido || usuario.SEGUNDO_APELLIDO || "");
                setDireccion(usuario.direccion || usuario.DIRECCION || "");
                setCorreo(usuario.correo || usuario.CORREO || "");
                setRut(usuario.rut || usuario.RUT || "");
                setDvrut(usuario.dvrut || usuario.DVRUT || "");
                setRut(usuario.rut || usuario.RUT || "");
                setRutOriginal(usuario.rut || usuario.RUT || "");

            } catch (error) {
                console.error("Error al obtener perfil:", error);
            }
        };
        fetchPerfil();
    }, []);

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    // Considera temporal si rut tiene exactamente 8 dígitos y dvrut es "0" o vacío
    const esRutTemporal = /^\d{8}$/.test(rut) && (!dvrut || dvrut === "0");

    // Solo editable si el rut es temporal (o vacío)
    const puedeEditarRut = !rut || esRutTemporal;
    const puedeEditarDvrut = !dvrut || esRutTemporal;

    const actualizarPerfil = async () => {
    try {
        const response = await axios.put("http://localhost:5000/perfil", {
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            direccion,
            correo: user?.correo,
            rut,
            dvrut
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        if (response.data) {
            // Solo forzar logout si el usuario realmente cambió el input de RUT
            if (rut !== rutOriginal) {
                alert("RUT actualizado. Debes iniciar sesión nuevamente.");
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
                navigate("/login");
                return;
            }
            // Si no cambió el rut, solo actualiza el estado local
            setRutOriginal(rut); // Actualiza el original
            const updatedUser = { ...user, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion, rut, dvrut };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            alert("Perfil actualizado correctamente");
        }
    } catch (error) {
        alert(error.response?.data?.error || "Hubo un error al actualizar el perfil.");
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
                                    {user && (user.primer_nombre || user.PRIMER_NOMBRE)
                                        ? (user.primer_nombre || user.PRIMER_NOMBRE).toUpperCase()
                                        : "USUARIO"}
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
            {/*Perifl */}
            <div className="container mt-5 mb-5">
                <div className="row justify-content-center">
                    <div className="col-md-7 col-lg-6">
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-body p-5">
                                <h2 className="mb-4 text-center fw-bold" style={{ color: "#d2691e" }}>
                                    Editar Perfil
                                </h2>
                                {/* Mensaje si falta rut/dvrut */}
                                {(puedeEditarRut || puedeEditarDvrut) && (
                                    <div className="alert alert-warning text-center">
                                        <b>¡Atención!</b> Debes ingresar tu RUT y dígito verificador reales. Solo podrás hacerlo una vez.
                                    </div>
                                )}
                                <form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        actualizarPerfil();
                                    }}
                                >
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Primer Nombre</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-pill"
                                                value={primer_nombre}
                                                onChange={e => setPrimerNombre(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Segundo Nombre</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-pill"
                                                value={segundo_nombre}
                                                onChange={e => setSegundoNombre(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Primer Apellido</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-pill"
                                                value={primer_apellido}
                                                onChange={e => setPrimerApellido(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Segundo Apellido</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-pill"
                                                value={segundo_apellido}
                                                onChange={e => setSegundoApellido(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Dirección</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-pill"
                                                value={direccion}
                                                onChange={e => setDireccion(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Correo Electronico</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-pill"
                                                value={correo}
                                                onChange={e => setCorreo(e.target.value)}
                                                disabled
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">RUT</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-pill"
                                                value={rut}
                                                onChange={e => setRut(e.target.value)}
                                                required
                                                disabled={!puedeEditarRut}
                                                placeholder="Ingresa tu RUT"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Dígito Verificador (DV)</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-pill"
                                                value={dvrut}
                                                onChange={e => setDvrut(e.target.value)}
                                                required
                                                disabled={!puedeEditarDvrut}
                                                placeholder="Ingresa tu DV"
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-center mt-4">
                                        <button
                                            type="submit"
                                            className="btn btn-lg px-5 rounded-pill fw-bold"
                                            style={{
                                                background: "linear-gradient(90deg, #ffb347 0%, #ffcc80 100%)",
                                                color: "#fff",
                                                boxShadow: "0 4px 12px rgba(210,105,30,0.15)"
                                            }}>
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
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
export default Perfil;