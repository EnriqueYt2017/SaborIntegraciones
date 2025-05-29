import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Imagen from '../../assets/loginimage.jpg';
import ImageProfile from '../../assets/react.svg';
function Register() {
    const [rut, setRut] = useState("");
    const [primer_nombre, setPrimer_nombre] = useState("");
    const [dvrut, setDvrut] = useState("");
    const [correo, setCorreo] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/home"); // ✅ Redirige si el usuario ya está autenticado
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/register", {
                rut,
                dvrut,
                primer_nombre,
                correo,
                pass,
            });
            alert(response.data.mensaje);
            navigate("/login");
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError("Error al registrar. Intente nuevamente.");
            }
        }
    };

    return (
        <div
            className="register-container"
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(120deg,rgb(101, 246, 145) 0%,rgb(133, 243, 253) 100%)"
            }}
        >
            <div
                className="register-card"
                style={{
                    display: "flex",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    background: "#fff",
                    maxWidth: "900px",
                    width: "100%"
                }}
            >
                <div
                    className="register-form-section"
                    style={{
                        flex: 1,
                        padding: "48px 32px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                    }}
                >
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <img src={ImageProfile} alt="" style={{ width: 70, marginBottom: 16 }} />
                        <h2 style={{ fontWeight: 700, color: "#65f691" }}>Registro de Usuario</h2>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <input
                            className="cajatexto"
                            type="text"
                            placeholder="RUT"
                            value={rut}
                            onChange={(e) => setRut(e.target.value)}
                            required
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid rgb(133, 253, 189)",
                                outline: "none",
                                fontSize: "16px"
                            }}
                        />
                        <input
                            className="cajatexto"
                            type="text"
                            placeholder="DVRUT"
                            value={dvrut}
                            onChange={(e) => setDvrut(e.target.value)}
                            required
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid rgb(133, 253, 163)",
                                outline: "none",
                                fontSize: "16px"
                            }}
                        />
                        <input
                            className="cajatexto"
                            type="text"
                            placeholder="Primer Nombre"
                            value={primer_nombre}
                            onChange={(e) => setPrimer_nombre(e.target.value)}
                            required
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid rgb(133, 253, 163)",
                                outline: "none",
                                fontSize: "16px"
                            }}
                        />
                        <input
                            className="cajatexto"
                            type="email"
                            placeholder="Correo electrónico"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid rgb(133, 253, 189)",
                                outline: "none",
                                fontSize: "16px"
                            }}
                        />
                        <input
                            className="cajatexto"
                            type="password"
                            placeholder="Contraseña"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            required
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid rgb(133, 253, 163)",
                                outline: "none",
                                fontSize: "16px"
                            }}
                        />
                        <button
                            className="btnform"
                            type="submit"
                            style={{
                                background: "linear-gradient(120deg,rgb(101, 246, 145) 0%,rgb(133, 243, 253) 100%)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "12px",
                                fontWeight: 600,
                                fontSize: "16px",
                                cursor: "pointer",
                                marginTop: "8px",
                                transition: "background 0.3s"
                            }}
                        >
                            Registrarse
                        </button>
                        <a
                            href="/login"
                            style={{
                                color: "#f76d6d",
                                textAlign: "center",
                                marginTop: "8px",
                                textDecoration: "underline",
                                fontSize: "15px"
                            }}
                        >
                            Ya tengo cuenta. Iniciar Sesión
                        </a>
                        <a
                            href="/home"
                            style={{
                                color: "#f76d6d",
                                textAlign: "center",
                                marginTop: "8px",
                                textDecoration: "underline",
                                fontSize: "15px"
                            }}
                        >
                            Continuar sin registrarme
                        </a>
                    </form>
                    {error && (
                        <p style={{ color: "red", marginTop: 12, textAlign: "center" }}>{error}</p>
                    )}
                </div>
                <div
                    className="register-image-section"
                    style={{
                        flex: 1.2,
                        background: "linear-gradient(120deg,rgb(101, 246, 145) 0%,rgb(133, 243, 253) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <img
                        src={Imagen}
                        alt=""
                        style={{
                            width: "90%",
                            maxWidth: "400px",
                            borderRadius: "16px",
                            boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.18)"
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default Register;