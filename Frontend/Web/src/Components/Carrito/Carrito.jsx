import React, { useEffect, useState } from "react";

const styles = {
    container: {
        maxWidth: "500px",
        margin: "40px auto",
        background: "linear-gradient(135deg,rgb(141, 206, 246) 0%,rgb(118, 255, 152) 100%)",
        borderRadius: "22px",
        boxShadow: "0 12px 40px rgba(230, 126, 34, 0.18), 0 2px 8px #e67e2255",
        padding: "38px 28px",
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
        color: "#222",
        border: "2px solid #e67e22",
        position: "relative",
        overflow: "hidden",
    },
    title: {
        fontSize: "2.5rem",
        fontWeight: "bold",
        marginBottom: "22px",
        letterSpacing: "2px",
        color: "#fff",
        textShadow: "0 4px 18px #e67e22cc, 0 2px 8px #f6e58d99",
        textAlign: "center",
        WebkitBackgroundClip: "text",
    },
    list: {
        listStyle: "none",
        padding: 0,
        marginBottom: "22px",
    },
    item: {
        background: "rgba(255,255,255,0.85)",
        borderRadius: "12px",
        marginBottom: "14px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px #e67e2222",
        border: "1.5px solid #f6e58d",
        transition: "transform 0.15s",
    },
    productInfo: {
        fontWeight: "600",
        fontSize: "1.15rem",
        color: "#e67e22",
        letterSpacing: "0.5px",
    },
    eliminarBtn: {
        background: "linear-gradient(90deg, #e74c3c 60%, #ff7979 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 18px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "1rem",
        boxShadow: "0 2px 8px #e74c3c44",
        transition: "background 0.2s, transform 0.1s",
    },
    limpiarBtn: {
        background: "linear-gradient(90deg, #e67e22 60%, #f6e58d 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "12px 26px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "1.1rem",
        marginTop: "14px",
        marginRight: "12px",
        boxShadow: "0 2px 12px #e67e2255",
        transition: "background 0.2s, transform 0.1s",
    },
    pagarBtn: {
        background: "linear-gradient(90deg, #27ae60 60%, #6ab04c 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "12px 32px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "1.15rem",
        marginTop: "14px",
        boxShadow: "0 2px 16px #27ae6044",
        transition: "background 0.2s, transform 0.1s",
        float: "right",
        letterSpacing: "1px",
        textTransform: "uppercase",
    },
    total: {
        marginTop: "34px",
        fontSize: "1.7rem",
        fontWeight: "bold",
        color: "#27ae60",
        textAlign: "right",
        letterSpacing: "1.5px",
        textShadow: "0 2px 8px #6ab04c33",
    },
    empty: {
        color: "#888",
        fontStyle: "italic",
        margin: "36px 0",
        textAlign: "center",
        fontSize: "1.2rem",
    }
};

function Carrito() {
    const [carrito, setCarrito] = useState([]);

    useEffect(() => {
        const carritoGuardado = JSON.parse(localStorage.getItem("carrito")) || [];
        setCarrito(carritoGuardado);
    }, []);

    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const limpiarCarrito = () => {
        setCarrito([]);
        localStorage.setItem("carrito", JSON.stringify([]));
    };

    const eliminarProducto = (codigo_producto) => {
        const nuevoCarrito = carrito.filter(item => item.codigo_producto !== codigo_producto);
        setCarrito(nuevoCarrito);
        localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));
    };

    const pagar = () => {
        alert("¡Gracias por tu compra! 🥳");
        limpiarCarrito();
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Carrito de Compras</h2>
            {carrito.length === 0 ? (
                <p style={styles.empty}>El carrito está vacío.</p>
            ) : (
                <>
                    <ul style={styles.list}>
                        {carrito.map(item => (
                            <li key={item.codigo_producto} style={styles.item}>
                                <span style={styles.productInfo}>
                                    {item.nombre} <span style={{color:"#e67e22"}}>-</span> ${item.precio} x {item.cantidad}
                                </span>
                                <button
                                    style={styles.eliminarBtn}
                                    onClick={() => eliminarProducto(item.codigo_producto)}
                                >
                                    Eliminar
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div>
                        <button style={styles.limpiarBtn} onClick={limpiarCarrito}>
                            Limpiar Todo
                        </button>
                        <button style={styles.pagarBtn} onClick={pagar}>
                            <span role="img" aria-label="pagar">💳</span> Pagar
                        </button>
                    </div>
                </>
            )}
            <div style={styles.total}>Total: ${total}</div>
        </div>
    );
}

export default Carrito;