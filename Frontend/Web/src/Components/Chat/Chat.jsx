import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './Chat.css';
import { FiSend, FiPhone, FiVideo, FiMoreVertical, FiUsers, FiPlus, FiSearch } from 'react-icons/fi';
import { BsEmojiSmile, BsPaperclip } from 'react-icons/bs';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [escribiendo, setEscribiendo] = useState(null);
  const [mostrarCrearGrupo, setMostrarCrearGrupo] = useState(false);
  const [vistaActual, setVistaActual] = useState('conversaciones'); // 'conversaciones' o 'grupos'
  const mensajesRef = useRef(null);
  const inputRef = useRef(null);

  // Configuración inicial
  useEffect(() => {
    // Obtener usuario actual del localStorage o contexto
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    setUsuarioActual(usuario);

    // Conectar a Socket.IO
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Unirse como usuario
    if (usuario.rut) {
      newSocket.emit('join_user', usuario.rut);
    }

    return () => newSocket.close();
  }, []);

  // Cargar conversaciones y grupos
  const cargarConversaciones = useCallback(async () => {
    if (!usuarioActual?.rut) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/conversaciones/${usuarioActual.rut}`);
      setConversaciones(response.data);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  }, [usuarioActual?.rut]);

  const cargarGrupos = useCallback(async () => {
    if (!usuarioActual?.rut) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/grupos/${usuarioActual.rut}`);
      setGrupos(response.data);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
    }
  }, [usuarioActual?.rut]);

  useEffect(() => {
    cargarConversaciones();
    cargarGrupos();
  }, [cargarConversaciones, cargarGrupos]);

  const seleccionarConversacion = async (conversacion) => {
    setConversacionActiva(conversacion);
    setMensajes([]);

    // Unirse a la conversación
    if (socket) {
      socket.emit('join_conversation', conversacion.conversacionId);
    }

    // Cargar mensajes
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/mensajes/${conversacion.conversacionId}`);
      setMensajes(response.data);
      scrollToBottom();

      // Marcar como leídos
      if (socket) {
        socket.emit('mark_as_read', {
          conversacionId: conversacion.conversacionId,
          rutUsuario: usuarioActual.rut
        });
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const seleccionarGrupo = async (grupo) => {
    setConversacionActiva({ ...grupo, esGrupo: true });
    setMensajes([]);

    // Unirse al grupo
    if (socket) {
      socket.emit('join_group', grupo.idGrupo);
    }

    // Cargar mensajes del grupo
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/mensajes-grupo/${grupo.idGrupo}`);
      setMensajes(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error al cargar mensajes del grupo:', error);
    }
  };

  const enviarMensaje = (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !conversacionActiva || !socket) return;

    const mensaje = {
      rutRemitente: usuarioActual.rut,
      contenido: nuevoMensaje.trim(),
      tipoMensaje: 'texto'
    };

    if (conversacionActiva.esGrupo) {
      mensaje.grupoId = conversacionActiva.idGrupo;
      socket.emit('send_group_message', mensaje);
    } else {
      mensaje.conversacionId = conversacionActiva.conversacionId;
      socket.emit('send_message', mensaje);
    }

    setNuevoMensaje('');
    inputRef.current?.focus();
  };

  const manejarEscritura = (e) => {
    setNuevoMensaje(e.target.value);
    
    if (socket && conversacionActiva && !conversacionActiva.esGrupo) {
      socket.emit('typing', {
        conversacionId: conversacionActiva.conversacionId,
        rutUsuario: usuarioActual.rut,
        nombreUsuario: `${usuarioActual.primer_nombre} ${usuarioActual.primer_apellido}`
      });
    }
  };

  const dejarDeEscribir = () => {
    if (socket && conversacionActiva && !conversacionActiva.esGrupo) {
      socket.emit('stop_typing', {
        conversacionId: conversacionActiva.conversacionId,
        rutUsuario: usuarioActual.rut
      });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (mensajesRef.current) {
        mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
      }
    }, 100);
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filtrarConversaciones = () => {
    if (!busqueda) return conversaciones;
    return conversaciones.filter(conv => 
      conv.nombreCliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      conv.nombrePlan.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const filtrarGrupos = () => {
    if (!busqueda) return grupos;
    return grupos.filter(grupo => 
      grupo.nombreGrupo.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const CrearGrupoModal = () => {
    const [nombreGrupo, setNombreGrupo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [clientesDisponibles, setClientesDisponibles] = useState([]);
    const [clientesSeleccionados, setClientesSeleccionados] = useState([]);

    useEffect(() => {
      if (mostrarCrearGrupo) {
        cargarClientesDisponibles();
      }
    }, [mostrarCrearGrupo]);

    const cargarClientesDisponibles = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/chat/clientes-disponibles/${usuarioActual.rut}`);
        setClientesDisponibles(response.data);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      }
    };

    const crearGrupo = async () => {
      if (!nombreGrupo.trim()) return;

      try {
        await axios.post('http://localhost:5000/api/chat/crear-grupo', {
          nombreGrupo,
          descripcion,
          rutCreador: usuarioActual.rut,
          miembros: clientesSeleccionados
        });
        
        setMostrarCrearGrupo(false);
        setNombreGrupo('');
        setDescripcion('');
        setClientesSeleccionados([]);
        cargarGrupos();
      } catch (error) {
        console.error('Error al crear grupo:', error);
      }
    };

    if (!mostrarCrearGrupo) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Crear Nuevo Grupo</h3>
          <input
            type="text"
            placeholder="Nombre del grupo"
            value={nombreGrupo}
            onChange={(e) => setNombreGrupo(e.target.value)}
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <div className="clientes-list">
            <h4>Seleccionar Clientes:</h4>
            {clientesDisponibles.map(cliente => (
              <label key={cliente.rut} className="cliente-checkbox">
                <input
                  type="checkbox"
                  checked={clientesSeleccionados.includes(cliente.rut)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setClientesSeleccionados([...clientesSeleccionados, cliente.rut]);
                    } else {
                      setClientesSeleccionados(clientesSeleccionados.filter(rut => rut !== cliente.rut));
                    }
                  }}
                />
                {cliente.nombre} - {cliente.plan}
              </label>
            ))}
          </div>
          <div className="modal-buttons">
            <button onClick={() => setMostrarCrearGrupo(false)}>Cancelar</button>
            <button onClick={crearGrupo}>Crear Grupo</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-header">
          <h2>💬 Chat</h2>
          <div className="chat-tabs">
            <button 
              className={vistaActual === 'conversaciones' ? 'active' : ''}
              onClick={() => setVistaActual('conversaciones')}
            >
              Chats
            </button>
            <button 
              className={vistaActual === 'grupos' ? 'active' : ''}
              onClick={() => setVistaActual('grupos')}
            >
              Grupos
            </button>
          </div>
          {vistaActual === 'grupos' && (
            <button 
              className="crear-grupo-btn"
              onClick={() => setMostrarCrearGrupo(true)}
            >
              <FiPlus /> Crear Grupo
            </button>
          )}
        </div>

        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="conversaciones-list">
          {vistaActual === 'conversaciones' ? (
            filtrarConversaciones().map((conv) => (
              <div
                key={conv.conversacionId}
                className={`conversacion-item ${conversacionActiva?.conversacionId === conv.conversacionId ? 'active' : ''}`}
                onClick={() => seleccionarConversacion(conv)}
              >
                <div className="avatar">
                  {conv.nombreCliente.charAt(0).toUpperCase()}
                </div>
                <div className="conversacion-info">
                  <div className="nombre">{conv.nombreCliente}</div>
                  <div className="plan">{conv.nombrePlan}</div>
                  <div className="ultimo-mensaje">
                    {conv.ultimoMensaje || 'Sin mensajes'}
                  </div>
                </div>
                <div className="conversacion-meta">
                  {conv.fechaUltimoMensaje && (
                    <div className="hora">
                      {formatearHora(conv.fechaUltimoMensaje)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            filtrarGrupos().map((grupo) => (
              <div
                key={grupo.idGrupo}
                className={`conversacion-item ${conversacionActiva?.idGrupo === grupo.idGrupo ? 'active' : ''}`}
                onClick={() => seleccionarGrupo(grupo)}
              >
                <div className="avatar grupo-avatar">
                  <FiUsers />
                </div>
                <div className="conversacion-info">
                  <div className="nombre">{grupo.nombreGrupo}</div>
                  <div className="plan">{grupo.totalMiembros} miembros</div>
                  <div className="ultimo-mensaje">
                    {grupo.ultimoMensaje || 'Sin mensajes'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className="chat-main">
        {conversacionActiva ? (
          <>
            {/* Header del chat */}
            <div className="chat-main-header">
              <div className="contact-info">
                <div className="avatar">
                  {conversacionActiva.esGrupo ? (
                    <FiUsers />
                  ) : (
                    conversacionActiva.nombreCliente?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="contact-name">
                    {conversacionActiva.esGrupo ? conversacionActiva.nombreGrupo : conversacionActiva.nombreCliente}
                  </div>
                  <div className="contact-status">
                    {conversacionActiva.esGrupo ? 
                      `${conversacionActiva.totalMiembros} miembros` : 
                      conversacionActiva.nombrePlan
                    }
                  </div>
                </div>
              </div>
              <div className="chat-actions">
                <button><FiPhone /></button>
                <button><FiVideo /></button>
                <button><FiMoreVertical /></button>
              </div>
            </div>

            {/* Área de mensajes */}
            <div className="mensajes-container" ref={mensajesRef}>
              {mensajes.map((mensaje) => (
                <div
                  key={mensaje.id}
                  className={`mensaje ${mensaje.rutRemitente === usuarioActual.rut ? 'propio' : 'ajeno'}`}
                >
                  <div className="mensaje-content">
                    {conversacionActiva.esGrupo && mensaje.rutRemitente !== usuarioActual.rut && (
                      <div className="remitente-nombre">{mensaje.nombreRemitente}</div>
                    )}
                    <div className="mensaje-texto">{mensaje.contenido}</div>
                    <div className="mensaje-meta">
                      <span className="mensaje-hora">{formatearHora(mensaje.fechaEnvio)}</span>
                      {mensaje.rutRemitente === usuarioActual.rut && !conversacionActiva.esGrupo && (
                        <span className={`mensaje-estado ${mensaje.leido ? 'leido' : 'enviado'}`}>
                          ✓{mensaje.leido ? '✓' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {escribiendo && (
                <div className="escribiendo-indicator">
                  {escribiendo} está escribiendo...
                </div>
              )}
            </div>

            {/* Input de mensaje */}
            <form className="mensaje-input-container" onSubmit={enviarMensaje}>
              <button type="button" className="emoji-btn">
                <BsEmojiSmile />
              </button>
              <button type="button" className="attach-btn">
                <BsPaperclip />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={nuevoMensaje}
                onChange={manejarEscritura}
                onBlur={dejarDeEscribir}
                placeholder="Escribe un mensaje..."
                className="mensaje-input"
              />
              <button type="submit" className="send-btn" disabled={!nuevoMensaje.trim()}>
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Selecciona una conversación para comenzar</h3>
            <p>Elige un cliente o grupo para enviar mensajes</p>
          </div>
        )}
      </div>

      <CrearGrupoModal />
    </div>
  );
};

export default Chat;
