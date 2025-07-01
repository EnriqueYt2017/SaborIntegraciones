import React, { useState, useEffect } from 'react';
import './SeguimientoSOAP.css';

const SeguimientoSOAP = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState('');
  const [pedidoBuscado, setPedidoBuscado] = useState(null);
  const [servicioDisponible, setServicioDisponible] = useState(false);

  // Verificar estado del servicio SOAP al cargar
  useEffect(() => {
    verificarServicioSOAP();
  }, []);

  // Cargar pedidos del usuario si está logueado
  useEffect(() => {
    const cargarPedidosIniciales = async () => {
      if (!servicioDisponible) return;
      
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      if (!usuario.id_usuario) return;
      
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/soap/usuarios/${usuario.id_usuario}/pedidos`);
        const data = await response.json();
        
        if (data.success) {
          setPedidos(data.pedidos || []);
        } else {
          setError(data.message || 'Error cargando pedidos');
        }
      } catch (error) {
        console.error('Error cargando pedidos:', error);
        setError('Error de conexión al cargar pedidos');
      } finally {
        setLoading(false);
      }
    };
    
    cargarPedidosIniciales();
  }, [servicioDisponible]);

  /**
   * Verificar si el servicio SOAP está disponible
   */
  const verificarServicioSOAP = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/soap/status');
      const data = await response.json();
      setServicioDisponible(data.service_running);
      
      if (!data.service_running) {
        setError('Servicio de seguimiento SOAP no disponible');
      }
    } catch (error) {
      console.error('Error verificando servicio SOAP:', error);
      setServicioDisponible(false);
      setError('No se pudo conectar al servicio de seguimiento');
    }
  };

  /**
   * Cargar todos los pedidos de un usuario
   */
  const cargarPedidosUsuario = async (idUsuario) => {
    if (!servicioDisponible) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/soap/usuarios/${idUsuario}/pedidos`);
      const data = await response.json();
      
      if (data.success) {
        setPedidos(data.pedidos || []);
      } else {
        setError(data.message || 'Error cargando pedidos');
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setError('Error de conexión al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar un pedido específico por ID
   */
  const buscarPedido = async () => {
    if (!searchId.trim()) {
      setError('Ingrese un ID de pedido válido');
      return;
    }

    setLoading(true);
    setPedidoBuscado(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/soap/pedidos/${searchId}`);
      const data = await response.json();
      
      if (data.success && data.pedido) {
        setPedidoBuscado(data.pedido);
        setError('');
      } else {
        setError(data.message || 'Pedido no encontrado');
        setPedidoBuscado(null);
      }
    } catch (error) {
      console.error('Error buscando pedido:', error);
      setError('Error de conexión al buscar pedido');
      setPedidoBuscado(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar estado de un pedido
   */
  const actualizarEstado = async (idPedido, nuevoEstado) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/soap/pedidos/${idPedido}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nuevo_estado: nuevoEstado }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recargar pedidos
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (usuario.id_usuario) {
          await cargarPedidosUsuario(usuario.id_usuario);
        }
        
        // Actualizar pedido buscado si coincide
        if (pedidoBuscado && pedidoBuscado.id_pedido === idPedido) {
          setPedidoBuscado({ ...pedidoBuscado, estado: nuevoEstado });
        }
        
        alert('Estado actualizado correctamente');
      } else {
        setError(data.message || 'Error actualizando estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setError('Error de conexión al actualizar estado');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancelar un pedido
   */
  const cancelarPedido = async (idPedido) => {
    if (!confirm('¿Está seguro de cancelar este pedido?')) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/soap/pedidos/${idPedido}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recargar pedidos
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (usuario.id_usuario) {
          await cargarPedidosUsuario(usuario.id_usuario);
        }
        
        // Actualizar pedido buscado si coincide
        if (pedidoBuscado && pedidoBuscado.id_pedido === idPedido) {
          setPedidoBuscado({ ...pedidoBuscado, estado: 'CANCELADO' });
        }
        
        alert('Pedido cancelado correctamente');
      } else {
        setError(data.message || 'Error cancelando pedido');
      }
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      setError('Error de conexión al cancelar pedido');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatear fecha
   */
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-CL');
  };

  /**
   * Obtener color del estado
   */
  const getEstadoColor = (estado) => {
    const colores = {
      'PENDIENTE': '#ffa500',
      'CONFIRMADO': '#2196f3',
      'EN_PROCESO': '#ff9800',
      'ENVIADO': '#9c27b0',
      'ENTREGADO': '#4caf50',
      'CANCELADO': '#f44336'
    };
    return colores[estado] || '#757575';
  };

  /**
   * Componente para mostrar un pedido
   */
  const PedidoCard = ({ pedido, mostrarAcciones = false }) => (
    <div className="pedido-card">
      <div className="pedido-header">
        <h3>Pedido #{pedido.id_pedido}</h3>
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
        <p><strong>Dirección:</strong> {pedido.direccion_entrega}</p>
        <p><strong>Teléfono:</strong> {pedido.telefono}</p>
      </div>

      {pedido.productos && pedido.productos.length > 0 && (
        <div className="productos-lista">
          <h4>Productos:</h4>
          {pedido.productos.map((producto, index) => (
            <div key={index} className="producto-item">
              <span>{producto.nombre}</span>
              <span>Cantidad: {producto.cantidad}</span>
              <span>${Number(producto.subtotal).toLocaleString('es-CL')}</span>
            </div>
          ))}
        </div>
      )}

      {mostrarAcciones && pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO' && (
        <div className="pedido-acciones">
          <select 
            onChange={(e) => actualizarEstado(pedido.id_pedido, e.target.value)}
            defaultValue=""
          >
            <option value="">Cambiar estado</option>
            <option value="CONFIRMADO">Confirmar</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="ENVIADO">Enviado</option>
            <option value="ENTREGADO">Entregado</option>
          </select>
          
          {pedido.estado === 'PENDIENTE' && (
            <button 
              onClick={() => cancelarPedido(pedido.id_pedido)}
              className="btn-cancelar"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (!servicioDisponible) {
    return (
      <div className="seguimiento-soap">
        <div className="error-container">
          <h2>Servicio de Seguimiento No Disponible</h2>
          <p>El servicio SOAP de seguimiento de pedidos no está disponible en este momento.</p>
          <button onClick={verificarServicioSOAP} className="btn-retry">
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="seguimiento-soap">
      <div className="container">
        <h1>Seguimiento de Pedidos SOAP</h1>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="btn-close">×</button>
          </div>
        )}

        {/* Búsqueda por ID */}
        <div className="busqueda-section">
          <h2>Buscar Pedido por ID</h2>
          <div className="busqueda-form">
            <input
              type="number"
              placeholder="Ingrese ID del pedido"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && buscarPedido()}
            />
            <button onClick={buscarPedido} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          
          {pedidoBuscado && (
            <div className="resultado-busqueda">
              <h3>Resultado de la búsqueda:</h3>
              <PedidoCard pedido={pedidoBuscado} mostrarAcciones={true} />
            </div>
          )}
        </div>

        {/* Lista de pedidos del usuario */}
        <div className="pedidos-usuario-section">
          <h2>Mis Pedidos</h2>
          
          {loading && <div className="loading">Cargando pedidos...</div>}
          
          {pedidos.length === 0 && !loading ? (
            <p className="no-pedidos">No tienes pedidos registrados.</p>
          ) : (
            <div className="pedidos-grid">
              {pedidos.map((pedido) => (
                <PedidoCard 
                  key={pedido.id_pedido} 
                  pedido={pedido} 
                  mostrarAcciones={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Estado del servicio */}
        <div className="service-status">
          <div className="status-indicator">
            <span 
              className={`status-dot ${servicioDisponible ? 'online' : 'offline'}`}
            ></span>
            Servicio SOAP: {servicioDisponible ? 'En línea' : 'Fuera de línea'}
          </div>
          <button onClick={verificarServicioSOAP} className="btn-refresh">
            Verificar Estado
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeguimientoSOAP;