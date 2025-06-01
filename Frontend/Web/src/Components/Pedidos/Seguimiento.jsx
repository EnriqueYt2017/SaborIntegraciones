import React, { useState } from "react";

const Seguimiento = () => {
    const [pedido, setPedido] = useState(null);
    const [error, setError] = useState("");
    const params = new URLSearchParams(window.location.search);
    const numeroOrdenInicial = params.get("numero_orden") || "";
    const [numeroOrden, setNumeroOrden] = useState(numeroOrdenInicial);

    const handleBuscar = async (e) => {
        e.preventDefault();
        setError("");
        setPedido(null);

        try {
            const res = await fetch(`http://localhost:5000/pedidos/${numeroOrden}`);
            if (!res.ok) {
                throw new Error("Pedido no encontrado");
            }
            const data = await res.json();
            setPedido(data);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: 500, margin: "auto", padding: 20 }}>
            <h2>Seguimiento de Pedido</h2>
            <form onSubmit={handleBuscar}>
                <label>
                    Número de Orden:
                    <input
                        type="text"
                        value={numeroOrden}
                        onChange={(e) => setNumeroOrden(e.target.value)}
                        required
                        style={{ marginLeft: 10 }}
                    />
                </label>
                <button type="submit" style={{ marginLeft: 10 }}>
                    Buscar
                </button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {pedido && (
                <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 15 }}>
                    <h3>Información del Pedido</h3>
                    <p><strong>Número de Orden:</strong> {pedido.numero_orden}</p>
                    <p><strong>RUT:</strong> {pedido.rut}</p>
                    <p><strong>Fecha del Pedido:</strong> {pedido.fecha_pedido}</p>
                    <p><strong>Estado:</strong> {pedido.estado}</p>
                    <p><strong>Total:</strong> ${pedido.total}</p>
                    <p><strong>Dirección:</strong> {pedido.direccion}</p>
                    <p><strong>Observaciones:</strong> {pedido.observaciones}</p>
                </div>
            )}
        </div>
    );
};

export default Seguimiento;