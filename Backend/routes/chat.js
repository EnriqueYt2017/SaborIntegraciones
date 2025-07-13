const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const dbConfig = require("../dbConfig");

// Obtener conversaciones de un usuario (entrenador/nutricionista)
router.get("/conversaciones/:userId", async (req, res) => {
  const { userId } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Obtener conversaciones donde el usuario es entrenador/nutricionista
    const query = `
      SELECT DISTINCT 
        c.rut_cliente,
        u.primer_nombre || ' ' || u.primer_apellido as nombre_cliente,
        u.telefono as telefono_cliente,
        p.nombre_plan,
        p.tipo_plan,
        (SELECT contenido FROM Mensajes m WHERE m.conversacion_id = c.rut_cliente || '_' || :userId 
         ORDER BY m.fecha_envio DESC FETCH FIRST 1 ROWS ONLY) as ultimo_mensaje,
        (SELECT fecha_envio FROM Mensajes m WHERE m.conversacion_id = c.rut_cliente || '_' || :userId 
         ORDER BY m.fecha_envio DESC FETCH FIRST 1 ROWS ONLY) as fecha_ultimo_mensaje
      FROM Compras c
      JOIN Usuarios u ON c.rut_cliente = u.rut
      JOIN Planes p ON c.id_plan = p.id_plan
      WHERE (p.rut_entrenador = :userId OR p.rut_nutricionista = :userId)
      AND c.estado_compra = 'completado'
      ORDER BY fecha_ultimo_mensaje DESC NULLS LAST
    `;
    
    const result = await connection.execute(query, { userId });
    
    const conversaciones = result.rows.map(row => ({
      rutCliente: row[0],
      nombreCliente: row[1],
      telefonoCliente: row[2],
      nombrePlan: row[3],
      tipoPlan: row[4],
      ultimoMensaje: row[5],
      fechaUltimoMensaje: row[6],
      conversacionId: `${row[0]}_${userId}`
    }));
    
    res.json(conversaciones);
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Obtener mensajes de una conversación específica
router.get("/mensajes/:conversacionId", async (req, res) => {
  const { conversacionId } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const query = `
      SELECT 
        id_mensaje,
        rut_remitente,
        contenido,
        fecha_envio,
        leido,
        tipo_mensaje
      FROM Mensajes 
      WHERE conversacion_id = :conversacionId 
      ORDER BY fecha_envio ASC
    `;
    
    const result = await connection.execute(query, { conversacionId });
    
    const mensajes = result.rows.map(row => ({
      id: row[0],
      rutRemitente: row[1],
      contenido: row[2],
      fechaEnvio: row[3],
      leido: row[4],
      tipoMensaje: row[5]
    }));
    
    res.json(mensajes);
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Enviar un mensaje
router.post("/enviar-mensaje", async (req, res) => {
  const { conversacionId, rutRemitente, contenido, tipoMensaje = "texto" } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Generar ID único para el mensaje
    const idMensaje = `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO Mensajes (
        id_mensaje, 
        conversacion_id, 
        rut_remitente, 
        contenido, 
        fecha_envio, 
        leido, 
        tipo_mensaje
      ) VALUES (
        :idMensaje, 
        :conversacionId, 
        :rutRemitente, 
        :contenido, 
        CURRENT_TIMESTAMP, 
        0, 
        :tipoMensaje
      )
    `;
    
    await connection.execute(query, {
      idMensaje,
      conversacionId,
      rutRemitente,
      contenido,
      tipoMensaje
    });
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      mensaje: "Mensaje enviado correctamente",
      idMensaje 
    });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Marcar mensajes como leídos
router.put("/marcar-leidos/:conversacionId", async (req, res) => {
  const { conversacionId } = req.params;
  const { rutUsuario } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const query = `
      UPDATE Mensajes 
      SET leido = 1 
      WHERE conversacion_id = :conversacionId 
      AND rut_remitente != :rutUsuario 
      AND leido = 0
    `;
    
    await connection.execute(query, { conversacionId, rutUsuario });
    await connection.commit();
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Obtener grupos de un usuario
router.get("/grupos/:userId", async (req, res) => {
  const { userId } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const query = `
      SELECT DISTINCT
        g.id_grupo,
        g.nombre_grupo,
        g.descripcion,
        g.rut_creador,
        g.fecha_creacion,
        (SELECT COUNT(*) FROM GrupoMiembros gm WHERE gm.id_grupo = g.id_grupo) as total_miembros,
        (SELECT contenido FROM MensajesGrupo mg WHERE mg.id_grupo = g.id_grupo 
         ORDER BY mg.fecha_envio DESC FETCH FIRST 1 ROWS ONLY) as ultimo_mensaje
      FROM Grupos g
      JOIN GrupoMiembros gm ON g.id_grupo = gm.id_grupo
      WHERE gm.rut_miembro = :userId
      ORDER BY g.fecha_creacion DESC
    `;
    
    const result = await connection.execute(query, { userId });
    
    const grupos = result.rows.map(row => ({
      idGrupo: row[0],
      nombreGrupo: row[1],
      descripcion: row[2],
      rutCreador: row[3],
      fechaCreacion: row[4],
      totalMiembros: row[5],
      ultimoMensaje: row[6]
    }));
    
    res.json(grupos);
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Crear un nuevo grupo
router.post("/crear-grupo", async (req, res) => {
  const { nombreGrupo, descripcion, rutCreador, miembros } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Generar ID único para el grupo
    const idGrupo = `GRP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear el grupo
    const queryGrupo = `
      INSERT INTO Grupos (id_grupo, nombre_grupo, descripcion, rut_creador, fecha_creacion)
      VALUES (:idGrupo, :nombreGrupo, :descripcion, :rutCreador, CURRENT_TIMESTAMP)
    `;
    
    await connection.execute(queryGrupo, {
      idGrupo,
      nombreGrupo,
      descripcion,
      rutCreador
    });
    
    // Agregar el creador como miembro
    const queryMiembro = `
      INSERT INTO GrupoMiembros (id_grupo, rut_miembro, fecha_union)
      VALUES (:idGrupo, :rutMiembro, CURRENT_TIMESTAMP)
    `;
    
    await connection.execute(queryMiembro, {
      idGrupo,
      rutMiembro: rutCreador
    });
    
    // Agregar otros miembros si los hay
    if (miembros && miembros.length > 0) {
      for (const rutMiembro of miembros) {
        if (rutMiembro !== rutCreador) {
          await connection.execute(queryMiembro, {
            idGrupo,
            rutMiembro
          });
        }
      }
    }
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      mensaje: "Grupo creado correctamente",
      idGrupo 
    });
  } catch (error) {
    console.error("Error al crear grupo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Obtener clientes disponibles para agregar a un grupo
router.get("/clientes-disponibles/:rutEntrenador", async (req, res) => {
  const { rutEntrenador } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const query = `
      SELECT DISTINCT 
        c.rut_cliente,
        u.primer_nombre || ' ' || u.primer_apellido as nombre_cliente,
        p.nombre_plan
      FROM Compras c
      JOIN Usuarios u ON c.rut_cliente = u.rut
      JOIN Planes p ON c.id_plan = p.id_plan
      WHERE (p.rut_entrenador = :rutEntrenador OR p.rut_nutricionista = :rutEntrenador)
      AND c.estado_compra = 'completado'
      ORDER BY nombre_cliente
    `;
    
    const result = await connection.execute(query, { rutEntrenador });
    
    const clientes = result.rows.map(row => ({
      rut: row[0],
      nombre: row[1],
      plan: row[2]
    }));
    
    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes disponibles:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Obtener mensajes de un grupo específico
router.get("/mensajes-grupo/:grupoId", async (req, res) => {
  const { grupoId } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const query = `
      SELECT 
        mg.id_mensaje,
        mg.rut_remitente,
        u.primer_nombre || ' ' || u.primer_apellido as nombre_remitente,
        mg.contenido,
        mg.fecha_envio,
        mg.tipo_mensaje
      FROM MensajesGrupo mg
      JOIN Usuarios u ON mg.rut_remitente = u.rut
      WHERE mg.id_grupo = :grupoId 
      ORDER BY mg.fecha_envio ASC
    `;
    
    const result = await connection.execute(query, { grupoId });
    
    const mensajes = result.rows.map(row => ({
      id: row[0],
      rutRemitente: row[1],
      nombreRemitente: row[2],
      contenido: row[3],
      fechaEnvio: row[4],
      tipoMensaje: row[5]
    }));
    
    res.json(mensajes);
  } catch (error) {
    console.error("Error al obtener mensajes del grupo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

module.exports = router;
