import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars
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
    const [direccion, setDireccion] = useState("");
    const [correo, setCorreo] = useState("");

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
    }, []);

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    // Función para guardar cambios en el perfil
    const actualizarPerfil = async () => {
        try {
            const response = await axios.put("http://localhost:5000/perfil", {
                primer_nombre,
                segundo_nombre,
                primer_apellido,
                segundo_apellido,
                direccion,
                correo: user?.correo // <-- Agrega el correo aquí
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            if (response.data) {
                const updatedUser = { ...user, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, direccion };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
            }

            alert("Perfil actualizado correctamente");
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            alert("Hubo un error al actualizar el perfil.");
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
                                        <button
                                            className="dropdown-item"
                                            onClick={() => navigate("/Dashboard/Inicio")}
                                        >
                                            Dashboard
                                        </button>
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