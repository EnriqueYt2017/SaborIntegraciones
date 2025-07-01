import React, { useState, useEffect } from 'react';
import './PedidosUnificados.css';

const PedidosUnificados = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // TODOS, TRADICIONAL, SOAP
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [estadisticas, setEstadisticas] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem('usuario');
    if (userData) {
      const user = JSON.parse(userData);
      setUsuario(user);
      cargarPedidos(user.rut || user.id_usuario);
    }
  }, []);

  const cargarPedidos = async (usuarioId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:5000/api/pedidos-unificados/${usuarioId}`);
      const data = await response.json();
      
      if (data.success) {
        setPedidos(data.pedidos);
        setEstadisticas({
          total: data.total_pedidos,
          tradicionales: data.tradicionales,
          soap: data.soap
        });
      } else {
        setError(data.message || 'Error cargando pedidos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const sincronizarPedidos = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/sincronizar-pedidos-soap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Sincronización completada: ${data.sincronizados} pedidos sincronizados, ${data.errores} errores`);
        if (usuario) {
          cargarPedidos(usuario.rut || usuario.id_usuario);
        }
      } else {
        setError(data.message || 'Error en sincronización');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión durante sincronización');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoSOAP = async (idPedido, nuevoEstado) => {
    try {
      const response = await fetch(`http://localhost:5000/api/soap/pedidos/${idPedido}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nuevo_estado: nuevoEstado })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Estado actualizado correctamente');
        if (usuario) {
          cargarPedidos(usuario.rut || usuario.id_usuario);
        }
      } else {
        setError(data.message || 'Error actualizando estado');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al actualizar estado');
    }
  };

  const actualizarEstadoTradicional = async (numeroOrden, nuevoEstado) => {
    try {
      const response = await fetch(`http://localhost:5000/pedidos/${numeroOrden}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      if (response.ok) {
        alert('Estado actualizado correctamente');
        if (usuario) {
          cargarPedidos(usuario.rut || usuario.id_usuario);
        }
      } else {
        setError('Error actualizando estado');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al actualizar estado');
    }
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    const cumpleTipo = filtroTipo === 'TODOS' || pedido.tipo === filtroTipo;
    const cumpleEstado = filtroEstado === 'TODOS' || pedido.estado === filtroEstado;
    return cumpleTipo && cumpleEstado;
  });

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-CL');
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Sin enviar': '#ff9800',
      'PENDIENTE': '#ffa500',
      'CONFIRMADO': '#2196f3',
      'EN_PROCESO': '#ff9800',
      'ENVIADO': '#9c27b0',
      'ENTREGADO': '#4caf50',
      'Completado': '#4caf50',
      'CANCELADO': '#f44336'
    };
    return colores[estado] || '#757575';
  };

  const getTipoColor = (tipo) => {
    return tipo === 'SOAP' ? '#667eea' : '#28a745';
  };

  if (!usuario) {
    return (
      <div className="pedidos-unificados">
        <div className="container">
          <p className="mensaje-login">Por favor, inicia sesión para ver tus pedidos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pedidos-unificados">
      <div className="container">
        <div className="header">
          <h1>Mis Pedidos Unificados</h1>
          <div className="estadisticas">
            <div className="stat-card">
              <span className="stat-number">{estadisticas.total || 0}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{estadisticas.tradicionales || 0}</span>
              <span className="stat-label">Tradicionales</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{estadisticas.soap || 0}</span>
              <span className="stat-label">SOAP</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="btn-close">×</button>
          </div>
        )}

        <div className="controles">
          <div className="filtros">
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="filtro-select"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="TRADICIONAL">Tradicionales</option>
              <option value="SOAP">SOAP</option>
            </select>

            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="filtro-select"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="Sin enviar">Sin enviar</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="ENVIADO">Enviado</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="Completado">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div className="acciones">
            <button 
              onClick={() => usuario && cargarPedidos(usuario.rut || usuario.id_usuario)}
              disabled={loading}
              className="btn-refresh"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
            
            <button 
              onClick={sincronizarPedidos}
              disabled={loading}
              className="btn-sync"
            >
              Sincronizar SOAP
            </button>
          </div>
        </div>

        {loading && <div className="loading">Cargando pedidos...</div>}

        <div className="pedidos-grid">
          {pedidosFiltrados.length === 0 ? (
            <p className="no-pedidos">No se encontraron pedidos con los filtros seleccionados.</p>
          ) : (
            pedidosFiltrados.map((pedido) => (
              <div key={`${pedido.tipo}-${pedido.id}`} className="pedido-card">
                <div className="pedido-header">
                  <div className="pedido-numero">
                    <h3>#{pedido.numero_orden}</h3>
                    <span 
                      className="tipo-badge"
                      style={{ backgroundColor: getTipoColor(pedido.tipo) }}
                    >
                      {pedido.tipo}
                    </span>
                  </div>
                  <span 
                    className="estado-badge"
                    style={{ backgroundColor: getEstadoColor(pedido.estado) }}
                  >
                    {pedido.estado}
                  </span>
                </div>

                <div className="pedido-info">
                  <p><strong>Fecha:</strong> {formatearFecha(pedido.fecha_pedido)}</p>
                  <p><strong>Total:</strong> ${Number(pedido.total).toLocaleString('es-CL')}</p>
                  <p><strong>Dirección:</strong> {pedido.direccion || 'No especificada'}</p>
                  <p><strong>Origen:</strong> {pedido.origen}</p>
                  
                  {pedido.telefono && (
                    <p><strong>Teléfono:</strong> {pedido.telefono}</p>
                  )}
                  
                  {pedido.email && (
                    <p><strong>Email:</strong> {pedido.email}</p>
                  )}

                  {pedido.observaciones && (
                    <p><strong>Observaciones:</strong> {pedido.observaciones}</p>
                  )}
                </div>

                {pedido.productos && pedido.productos.length > 0 && (
                  <div className="productos-lista">
                    <h4>Productos:</h4>
                    {pedido.productos.map((producto, index) => (
                      <div key={index} className="producto-item">
                        <span>{producto.nombre}</span>
                        <span>Cantidad: {producto.cantidad}</span>
                        <span>${Number(producto.subtotal || producto.precio * producto.cantidad).toLocaleString('es-CL')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {pedido.tipo === 'SOAP' && pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO' && (
                  <div className="pedido-acciones">
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          actualizarEstadoSOAP(pedido.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="select-estado"
                    >
                      <option value="">Cambiar estado</option>
                      <option value="CONFIRMADO">Confirmar</option>
                      <option value="EN_PROCESO">En proceso</option>
                      <option value="ENVIADO">Enviado</option>
                      <option value="ENTREGADO">Entregado</option>
                    </select>
                  </div>
                )}

                {pedido.tipo === 'TRADICIONAL' && pedido.estado !== 'Completado' && pedido.estado !== 'CANCELADO' && (
                  <div className="pedido-acciones">
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          actualizarEstadoTradicional(pedido.numero_orden, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="select-estado"
                    >
                      <option value="">Cambiar estado</option>
                      <option value="En preparación">En preparación</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Completado">Completado</option>
                    </select>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PedidosUnificados;
