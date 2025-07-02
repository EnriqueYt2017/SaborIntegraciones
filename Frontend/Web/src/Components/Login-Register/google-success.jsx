import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleSuccess() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const rut = params.get("rut");
    const nombre = params.get("nombre");
    const correo = params.get("correo");
    const id_rol = params.get("id_rol");
    const dvrut = params.get("dvrut");
    const telefono = params.get("telefono") || "";
    const primer_apellido = params.get("primer_apellido") || "";

    // Validación básica de datos requeridos
    if (!token || !correo || !nombre) {
      setError("Faltan datos necesarios para el inicio de sesión");
      return;
    }

    try {
      // Guarda datos completos del usuario
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ 
        rut, 
        primer_nombre: nombre,
        primer_apellido,
        correo, 
        id_rol, 
        dvrut,
        telefono
      }));

      // Redirige según el estado del RUT
      if (rut === "12345678" && (!dvrut || dvrut === "0")) {
        navigate("/completar-datos");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError("Error al procesar los datos de inicio de sesión");
      console.error("Error en GoogleSuccess:", err);
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {error}
        <button 
          className="btn btn-outline-danger ms-3"
          onClick={() => navigate("/login")}
        >
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <div className="text-center p-4">
      <div className="spinner-border text-primary m-2" role="status">
        <span className="visually-hidden">Iniciando sesión...</span>
      </div>
      <p>Iniciando sesión con Google...</p>
    </div>
  );
}