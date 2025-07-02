import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const rut = params.get("rut");
    const nombre = params.get("nombre");
    const correo = params.get("correo");
    const id_rol = params.get("id_rol");
    const dvrut = params.get("dvrut"); // <-- si lo envías desde backend

    // Guarda datos mínimos
    if (token && correo && nombre) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ rut, primer_nombre: nombre, correo, id_rol, dvrut }));

      // Redirige SOLO si rut temporal y dvrut es "0"
      if (rut === "12345678" && (!dvrut || dvrut === "0")) {
        navigate("/completar-datos");
      } else {
        navigate("/home");
      }
    }
  }, [navigate]);

  return <div>Iniciando sesión con Google...</div>;
}