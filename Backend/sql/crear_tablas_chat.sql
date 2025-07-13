-- ============================================================================
-- SCRIPT SQL PARA SISTEMA DE CHAT ESTILO WHATSAPP
-- Compatible con Oracle Database y SQL Developer
-- PASO 1: VERIFICAR ESTRUCTURA DE TABLA USUARIOS
-- ============================================================================

-- VERIFICAR EL TIPO DE DATOS DEL RUT EN LA TABLA USUARIOS
SELECT column_name, data_type, data_length, data_precision, data_scale, nullable
FROM user_tab_columns 
WHERE table_name = 'USUARIOS' AND column_name = 'RUT';

-- ============================================================================
-- PASO 2: ELIMINAR TABLAS SI EXISTEN (ejecutar si necesitas recrear)
-- ============================================================================
-- DROP TABLE MensajesGrupo CASCADE CONSTRAINTS;
-- DROP TABLE GrupoMiembros CASCADE CONSTRAINTS;
-- DROP TABLE Grupos CASCADE CONSTRAINTS;
-- DROP TABLE Mensajes CASCADE CONSTRAINTS;

-- ============================================================================
-- PASO 3: CREAR TABLAS SIN FOREIGN KEYS PRIMERO
-- ============================================================================

-- 1. TABLA MENSAJES (sin foreign key primero)
CREATE TABLE Mensajes (
    id_mensaje VARCHAR2(50) NOT NULL,
    conversacion_id VARCHAR2(100) NOT NULL,
    rut_remitente VARCHAR2(20) NOT NULL,  -- Ajustado a VARCHAR2(20) para compatibilidad
    contenido CLOB NOT NULL,
    fecha_envio DATE DEFAULT SYSDATE,
    leido NUMBER(1) DEFAULT 0,
    tipo_mensaje VARCHAR2(20) DEFAULT 'texto',
    CONSTRAINT pk_mensajes PRIMARY KEY (id_mensaje)
);

-- 2. TABLA GRUPOS (sin foreign key primero)
CREATE TABLE Grupos (
    id_grupo VARCHAR2(50) NOT NULL,
    nombre_grupo VARCHAR2(100) NOT NULL,
    descripcion VARCHAR2(500),
    rut_creador VARCHAR2(20) NOT NULL,  -- Ajustado a VARCHAR2(20) para compatibilidad
    fecha_creacion DATE DEFAULT SYSDATE,
    activo NUMBER(1) DEFAULT 1,
    CONSTRAINT pk_grupos PRIMARY KEY (id_grupo)
);

-- 3. TABLA GRUPOMIEMBROS (sin foreign keys primero)
CREATE TABLE GrupoMiembros (
    id_grupo VARCHAR2(50) NOT NULL,
    rut_miembro VARCHAR2(20) NOT NULL,  -- Ajustado a VARCHAR2(20) para compatibilidad
    fecha_union DATE DEFAULT SYSDATE,
    es_admin NUMBER(1) DEFAULT 0,
    activo NUMBER(1) DEFAULT 1,
    CONSTRAINT pk_grupo_miembros PRIMARY KEY (id_grupo, rut_miembro)
);

-- 4. TABLA MENSAJESGRUPO (sin foreign keys primero)
CREATE TABLE MensajesGrupo (
    id_mensaje VARCHAR2(50) NOT NULL,
    id_grupo VARCHAR2(50) NOT NULL,
    rut_remitente VARCHAR2(20) NOT NULL,  -- Ajustado a VARCHAR2(20) para compatibilidad
    contenido CLOB NOT NULL,
    fecha_envio DATE DEFAULT SYSDATE,
    tipo_mensaje VARCHAR2(20) DEFAULT 'texto',
    CONSTRAINT pk_mensajes_grupo PRIMARY KEY (id_mensaje)
);

-- ============================================================================
-- PASO 4: AGREGAR FOREIGN KEYS DESPUÉS (ejecutar solo si no hay errores arriba)
-- ============================================================================

-- Foreign keys para Mensajes
ALTER TABLE Mensajes 
ADD CONSTRAINT fk_mensajes_remitente 
FOREIGN KEY (rut_remitente) REFERENCES Usuarios(rut);

-- Foreign keys para Grupos  
ALTER TABLE Grupos 
ADD CONSTRAINT fk_grupos_creador 
FOREIGN KEY (rut_creador) REFERENCES Usuarios(rut);

-- Foreign keys para GrupoMiembros
ALTER TABLE GrupoMiembros 
ADD CONSTRAINT fk_grupo_miembros_grupo 
FOREIGN KEY (id_grupo) REFERENCES Grupos(id_grupo);

ALTER TABLE GrupoMiembros 
ADD CONSTRAINT fk_grupo_miembros_usuario 
FOREIGN KEY (rut_miembro) REFERENCES Usuarios(rut);

-- Foreign keys para MensajesGrupo
ALTER TABLE MensajesGrupo 
ADD CONSTRAINT fk_mensajes_grupo_grupo 
FOREIGN KEY (id_grupo) REFERENCES Grupos(id_grupo);

ALTER TABLE MensajesGrupo 
ADD CONSTRAINT fk_mensajes_grupo_remitente 
FOREIGN KEY (rut_remitente) REFERENCES Usuarios(rut);

-- ============================================================================
-- PASO 5: CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para tabla Mensajes
CREATE INDEX idx_mensajes_conversacion ON Mensajes(conversacion_id);
CREATE INDEX idx_mensajes_fecha ON Mensajes(fecha_envio);
CREATE INDEX idx_mensajes_remitente ON Mensajes(rut_remitente);
CREATE INDEX idx_mensajes_leido ON Mensajes(leido);

-- Índices para tabla MensajesGrupo
CREATE INDEX idx_mensajes_grupo_grupo ON MensajesGrupo(id_grupo);
CREATE INDEX idx_mensajes_grupo_fecha ON MensajesGrupo(fecha_envio);
CREATE INDEX idx_mensajes_grupo_remitente ON MensajesGrupo(rut_remitente);

-- Índices para tabla GrupoMiembros
CREATE INDEX idx_grupo_miembros_grupo ON GrupoMiembros(id_grupo);
CREATE INDEX idx_grupo_miembros_usuario ON GrupoMiembros(rut_miembro);

-- ============================================================================
-- PASO 6: VERIFICACIÓN Y DATOS DE PRUEBA
-- ============================================================================

-- Verificar que las tablas se crearon correctamente
SELECT table_name FROM user_tables 
WHERE table_name IN ('MENSAJES', 'GRUPOS', 'GRUPOMIEMBROS', 'MENSAJESGRUPO')
ORDER BY table_name;

-- Verificar constraints
SELECT constraint_name, table_name, constraint_type 
FROM user_constraints 
WHERE table_name IN ('MENSAJES', 'GRUPOS', 'GRUPOMIEMBROS', 'MENSAJESGRUPO')
ORDER BY table_name, constraint_type;

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================
-- 1. Ejecutar PASO 1 para verificar el tipo de RUT en Usuarios
-- 2. Si el RUT es diferente a VARCHAR2(20), ajustar el script
-- 3. Ejecutar PASO 3 (crear tablas sin foreign keys)
-- 4. Si no hay errores, ejecutar PASO 4 (agregar foreign keys)
-- 5. Ejecutar PASO 5 (crear índices)
-- 6. Ejecutar PASO 6 (verificar creación)
-- ============================================================================
-- Tablas creadas exitosamente:
--   ✓ Mensajes (conversaciones privadas)
--   ✓ Grupos (información de grupos)  
--   ✓ GrupoMiembros (miembros de grupos)
--   ✓ MensajesGrupo (mensajes de grupo)
--   ✓ Índices para optimización
-- ============================================================================
