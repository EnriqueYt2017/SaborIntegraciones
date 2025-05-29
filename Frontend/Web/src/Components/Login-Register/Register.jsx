import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
        setError(null);
        try {
            const response = await axios.post("http://localhost:5000/register", {
                rut,
                dvrut,
                primer_nombre,
                correo,
                pass,
            });
            console.log("Registro exitoso:", response.data);
            localStorage.setItem("token", response.data.token); // Guarda el token en localStorage
            navigate("/home"); // Redirige al usuario a la página de inicio
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError("Error al registrar. Intente nuevamente.");
            }
        }
    };

    return (
        <div className="containers">
            <h2 className="text-center">Registro de Usuario</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="RUT"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="DVRUT"
                    value={dvrut}
                    onChange={(e) => setDvrut(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Primer Nombre"
                    value={primer_nombre}
                    onChange={(e) => setPrimer_nombre(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    required
                />
                <button type="submit">Registrarse</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

export default Register;