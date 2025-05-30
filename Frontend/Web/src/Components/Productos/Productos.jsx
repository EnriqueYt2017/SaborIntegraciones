import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Productos() {
    const [productos, setProductos] = useState([]);
    const [nuevoProducto, setNuevoProducto] = useState({
        nombre: '',
        precio: '',
        descripcion: '',
        id_categoria: ''
    });

    // Obtener productos al cargar
    useEffect(() => {
        obtenerProductos();
    }, []);

    const obtenerProductos = async () => {
        try {
            const res = await axios.get('http://localhost:5000/productos');
            setProductos(res.data);
        } catch (error) {
            console.error('Error al obtener productos:', error);
        }
    };

    // Manejar cambios en el formulario
    const handleChange = e => {
        setNuevoProducto({
            ...nuevoProducto,
            [e.target.name]: e.target.value
        });
    };

    // Agregar producto
    const agregarProducto = async e => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/productos', {
                ...nuevoProducto,
                precio: parseFloat(nuevoProducto.precio)
            });
            setNuevoProducto({ nombre: '', precio: '', descripcion: '', id_categoria: '' });
            obtenerProductos();
            alert('Producto agregado correctamente');
        } catch (error) {
            console.error('Error al agregar producto:', error);
            alert('Error al agregar producto');
        }
    };

    return (
        <div>
            <h2>Productos</h2>
            <ul>
                {productos.map(prod => (
                    <li key={prod.CODIGO_PRODUCTO || prod.codigo_producto}>
                        <b>{prod.NOMBRE || prod.nombre}</b> - ${prod.PRECIO || prod.precio} <br />
                        {prod.DESCRIPCION || prod.descripcion}
                    </li>
                ))}
            </ul>
            <h3>Agregar Producto</h3>
            <form onSubmit={agregarProducto}>
                <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre"
                    value={nuevoProducto.nombre}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="precio"
                    placeholder="Precio"
                    value={nuevoProducto.precio}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="descripcion"
                    placeholder="Descripción"
                    value={nuevoProducto.descripcion}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="id_categoria"
                    placeholder="ID Categoría"
                    value={nuevoProducto.id_categoria}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Agregar</button>
            </form>
        </div>
    );
}

export default Productos;