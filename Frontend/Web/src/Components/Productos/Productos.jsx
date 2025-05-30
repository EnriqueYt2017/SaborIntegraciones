import { useState } from "react";
import axios from "axios";

function AgregarProducto() {
    const [codigo_producto, setCodigoProducto] = useState("");
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precio, setPrecio] = useState("");
    const [id_categoria, setIdCategoria] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!codigo_producto || !nombre || !descripcion || !precio || !id_categoria) {
            alert("Todos los campos son obligatorios");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/productos", {
                codigo_producto,
                nombre,
                descripcion,
                precio,
                id_categoria
            });

            console.log("Respuesta del servidor:", response.data); // ✅ Verificar si llega correctamente
            alert(response.data.mensaje); // ✅ Mostrar mensaje de éxito
        } catch (error) {
            console.error("Error al agregar producto:", error.response?.data || error.message);
            alert("Error al agregar producto: " + (error.response?.data?.error || "Problema desconocido"));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="number" placeholder="Código Producto" value={codigo_producto} onChange={(e) => setCodigoProducto(e.target.value)} />
            <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <input type="text" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            <input type="number" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            <input type="number" placeholder="ID Categoría" value={id_categoria} onChange={(e) => setIdCategoria(e.target.value)} />
            <button type="submit">Agregar Producto</button>
        </form>
    );
}

export default AgregarProducto;