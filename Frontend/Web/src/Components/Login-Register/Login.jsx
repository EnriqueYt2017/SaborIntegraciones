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
            localStorage.setItem("token", response.data.token); // 🔹 Guarda el token también
            navigate("/home");
        } else {
            console.error("Error: Usuario no encontrado en la respuesta.");
        }
    } catch (err) {
        console.error("Error en la solicitud:", err);
    }
};
  return (
    <div className="containers">
      <div className="row">
        <div className="col-md-4">
          <div className="padre">
            <div className="card card-body shadow-lg">
              <h2 className="text-center">Iniciar Sesión</h2>
              <img src={ImageProfile} alt="" className="estilo-profile" />
              <form onSubmit={handleSubmit}>
                <input className="cajatexto" type="email" placeholder="Ingresar Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
                <input className="cajatexto" type="password" placeholder="Ingresar Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} required />
                <button className="btnform" type="submit">Iniciar Sesión</button>
              </form>
              {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
          </div>
        </div>
      <div className="col-md-8">
          <img src={Imagen} alt="" className="tamaño-imagen" />
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