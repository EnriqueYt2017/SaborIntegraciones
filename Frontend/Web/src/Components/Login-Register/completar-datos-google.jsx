/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CompletarDatosGoogle() {
  const [rut, setRut] = useState("");
  const [dvrut, setDvrut] = useState("");
  const [primer_nombre, setPrimerNombre] = useState("");
  const [primer_apellido, setPrimerApellido] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const correo = user?.correo;
      const id_rol = user?.id_rol || 1;

      // Envía los datos al backend para actualizar el usuario
      await axios.put("http://localhost:5000/api/Usuarios", {
        correo,
        rut,
        dvrut,
        primer_nombre,
        primer_apellido,
        id_rol
      });

      // Actualiza localStorage
      localStorage.setItem("user", JSON.stringify({
        ...user,
        rut,
        dvrut,
        primer_nombre,
        primer_apellido
      }));

      navigate("/home");
    } catch (err) {
      setError("No se pudo guardar los datos. Intenta nuevamente.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(120deg,rgb(101, 246, 145) 0%,rgb(133, 243, 253) 100%)"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#fff",
        padding: 32,
        borderRadius: 16,
        boxShadow: "0 4px 16px #43e97b22",
        minWidth: 340
      }}>
        <h2 style={{ color: "#43e97b", fontWeight: 700, marginBottom: 18 }}>Completa tus datos</h2>
        <div className="mb-3">
          <label>RUT</label>
          <input type="text" className="form-control" value={rut} onChange={e => setRut(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Dígito Verificador</label>
          <input type="text" className="form-control" value={dvrut} onChange={e => setDvrut(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Primer Nombre</label>
          <input type="text" className="form-control" value={primer_nombre} onChange={e => setPrimerNombre(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Primer Apellido</label>
          <input type="text" className="form-control" value={primer_apellido} onChange={e => setPrimerApellido(e.target.value)} required />
        </div>
        {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
        <button type="submit" className="btn btn-success w-100">Guardar y continuar</button>
      </form>
    </div>
  );
}