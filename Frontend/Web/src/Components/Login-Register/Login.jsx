/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Imagen from '../../assets/loginimage.jpg';
import ImageProfile from '../../assets/react.svg';
import './login.css'; // Asegúrate de tener un archivo CSS para los estilos

function Login() {
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
        const response = await axios.post("http://localhost:5000/login", { correo, pass });

        console.log("Respuesta del backend:", response.data); // 🔎 Verifica qué llega del backend

        if (response.data && response.data.usuario) {
            console.log("Usuario autenticado:", response.data.usuario); // 🔎 Verifica los datos antes de guardarlos
            localStorage.setItem("user", JSON.stringify(response.data.usuario));
            localStorage.setItem("rut_usuario", response.data.usuario.rut); // 🔹 Guarda el RUT del usuario logueado

            localStorage.setItem("token", response.data.token); // 🔹 Guarda el token también
            navigate("/home");
        } else {
            console.error("Error: Usuario no encontrado en la respuesta.");
        }
    } catch (err) {
    setError(
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        "Error al conectar con el servidor"
    );
    console.error("Error en la solicitud:", err);
}
};
  return (
    <div className="login-container" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(120deg,rgb(101, 246, 145) 0%,rgb(133, 243, 253) 100%)"
    }}>
      <div className="login-card" style={{
        display: "flex",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        borderRadius: "20px",
        overflow: "hidden",
        background: "#fff",
        maxWidth: "900px",
        width: "100%"
      }}>
        <div className="login-form-section" style={{
          flex: 1,
          padding: "48px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src={ImageProfile} alt="" style={{ width: 70, marginBottom: 16 }} />
            <h2 style={{ fontWeight: 700, color: "#f76d6d" }}>Iniciar Sesión</h2>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                border: "1px solidrgb(133, 253, 189)",
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
                border: "1px solidrgb(133, 253, 163)",
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
              Iniciar Sesión
            </button>
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
              Continuar sin logearme
            </a>
            <a
              href="/register"
              style={{
                color: "#f76d6d",
                textAlign: "center",
                marginTop: "8px",
                textDecoration: "underline",
                fontSize: "15px"
              }}
            >
              No tengo cuenta. Registrarme
            </a>
          </form>
          {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
        </div>
        <div className="login-image-section" style={{
          flex: 1.2,
          background: "linear-gradient(120deg,rgb(101, 246, 145) 0%,rgb(133, 243, 253) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
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

export default Login;

/*<div className="containers">
      <div className="row">
        <div className="col-md-4">
          <div className="padre">
            <div className="card card-body shadow-lg">
              <h2 className="text-center">Inicia Sesion</h2>
              <img src={ImageProfile} alt="" className="estilo-profile" />
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Ingresar Email"
                  className="cajatexto"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Ingresar Contraseña"
                  className="cajatexto"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <button className="btnform" type="submit">Inicia Sesion</button>
              </form>
              {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <img src={Imagen} alt="" className="tamaño-imagen" />
        </div>
      </div>
    </div>*/