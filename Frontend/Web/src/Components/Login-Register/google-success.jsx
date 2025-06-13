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

    console.log("GoogleSuccess params:", { token, rut, nombre, correo, id_rol });

    if (token && rut && nombre && correo) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ rut, primer_nombre: nombre, correo, id_rol }));
      navigate("/home");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return <div>Iniciando sesión con Google...</div>;
}