import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function CompletarDatosGoogle() {
  const [rut, setRut] = useState("");
  const [dvrut, setDvrut] = useState("");
  const [primer_nombre, setPrimerNombre] = useState("");
  const [primer_apellido, setPrimerApellido] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Obtener token y datos de la URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Guardar token
      localStorage.setItem('token', token);

      // Guardar datos iniciales del usuario
      const userData = {
        correo: params.get('correo'),
        id_rol: params.get('id_rol'),
        primer_nombre: params.get('nombre') || ''
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Pre-llenar el nombre si existe
      setPrimerNombre(userData.primer_nombre);
    } else {
      // Si no hay token, redirigir al login
      navigate('/login');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user?.correo) {
        throw new Error('Sesión no válida');
      }

      const response = await axios.put(
        "http://localhost:5000/api/Usuarios/google",
        {
          correo: user.correo,
          rut,
          dvrut,
          primer_nombre,
          primer_apellido,
          id_rol: user.id_rol || 1
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.usuario) {
        // Actualizar datos del usuario en localStorage
        localStorage.setItem('user', JSON.stringify({
          ...user,
          ...response.data.usuario
        }));

        // Si hay nuevo token, actualizarlo
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }

        navigate("/home");
      } else {
        setError("Error al actualizar los datos");
      }
    } catch (err) {
      console.error("Error:", err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.error || "No se pudo guardar los datos. Intenta nuevamente.");
      }
    }
  };

  // Validación de RUT
  const validarRut = (rut) => {
    // Permitir cualquier número de 7 u 8 dígitos
    return /^\d{0,8}$/.test(rut);
  };

  const validarDv = (dv) => {
    // Permitir números y 'k'
    return /^[0-9kK]?$/.test(dv);
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
          <label>RUT (sin puntos ni guión)</label>
          <input
            type="text"
            className="form-control"
            value={rut}
            onChange={e => {
              const value = e.target.value.replace(/[^\d]/g, '').substring(0, 8);
              setRut(value);
            }}
            placeholder="Ejemplo: 12345678"
            maxLength="8"
            required
          />
        </div>
        <div className="mb-3">
          <label>Dígito Verificador</label>
          <input
            type="text"
            className="form-control"
            value={dvrut}
            onChange={e => {
              const value = e.target.value.toLowerCase();
              if (validarDv(value)) {
                setDvrut(value);
              }
            }}
            placeholder="Ejemplo: k o 1-9"
            maxLength="1"
            required
          />
        </div>
        <div className="mb-3">
          <label>Primer Nombre</label>
          <input
            type="text"
            className="form-control"
            value={primer_nombre}
            onChange={e => setPrimerNombre(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label>Primer Apellido</label>
          <input
            type="text"
            className="form-control"
            value={primer_apellido}
            onChange={e => setPrimerApellido(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={!validarRut(rut) || !validarDv(dvrut)}
        >
          Guardar y continuar
        </button>
      </form>
    </div>
  );
}