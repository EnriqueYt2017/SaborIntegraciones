# 📖 MANUAL DE USUARIO - SABORINTEGRACIONES

## Plataforma Integral de Fitness y Nutrición

---

### 📋 **ÍNDICE**

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Navegación Principal](#navegación-principal)
4. [Funcionalidades por Rol](#funcionalidades-por-rol)
5. [Módulos del Sistema](#módulos-del-sistema)
6. [Dashboard Administrativo](#dashboard-administrativo)
7. [Gestión de Productos](#gestión-de-productos)
8. [Sistema de Pedidos](#sistema-de-pedidos)
9. [Planes de Entrenamiento](#planes-de-entrenamiento)
10. [Planes de Nutrición](#planes-de-nutrición)
11. [Sistema de Comunicación](#sistema-de-comunicación)
12. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 **INTRODUCCIÓN**

**SaborIntegraciones** es una plataforma web integral diseñada para ofrecer servicios de fitness, nutrición y venta de productos deportivos. La plataforma conecta usuarios, entrenadores, nutricionistas y administradores en un ecosistema completo de bienestar.

### **Características Principales:**
- 🛒 **Tienda Online** - Compra de productos deportivos y suplementos
- 🏋️ **Planes de Entrenamiento** - Rutinas personalizadas con entrenadores
- 🥗 **Planes de Nutrición** - Dietas y consejos nutricionales
- 💬 **Sistema de Chat** - Comunicación directa con profesionales
- 📊 **Dashboard** - Panel de control administrativo
- 📱 **Diseño Responsive** - Compatible con móviles y tablets

### **URLs del Sistema:**
- **Aplicación Web:** http://localhost:5173/
- **API Backend:** http://localhost:5000/

---

## 🔐 **ACCESO AL SISTEMA**

### **1. Registro de Usuario**

**Ruta:** `/register`

1. **Accede a la página de registro**
2. **Completa el formulario con:**
   - RUT (sin puntos, con guión)
   - DV del RUT
   - Primer nombre
   - Segundo nombre (opcional)
   - Primer apellido
   - Segundo apellido (opcional)
   - Dirección
   - Correo electrónico
   - Contraseña
   - Teléfono

3. **Haz clic en "Registrarse"**
4. **El sistema te asignará automáticamente el rol de Cliente**

### **2. Inicio de Sesión**

**Ruta:** `/login`

#### **Opción 1: Login Tradicional**
1. Ingresa tu **correo electrónico**
2. Ingresa tu **contraseña**
3. Haz clic en **"Iniciar Sesión"**

#### **Opción 2: Login con Google**
1. Haz clic en **"Iniciar sesión con Google"**
2. Selecciona tu cuenta de Google
3. Autoriza el acceso a la aplicación
4. Si es tu primera vez, completa tus datos adicionales

### **3. Recuperación de Contraseña**
1. En la página de login, haz clic en **"¿Olvidaste tu contraseña?"**
2. Ingresa tu correo electrónico
3. Revisa tu bandeja de entrada para el enlace de recuperación

---

## 🧭 **NAVEGACIÓN PRINCIPAL**

### **Menú Superior**
- **🏠 Inicio** - Página principal con información de la empresa
- **🛍️ Productos** - Catálogo de productos deportivos y suplementos
- **💼 Servicios** - Información sobre planes de entrenamiento y nutrición
- **📞 Contáctenos** - Formulario de contacto y información de la empresa
- **👤 Perfil** - Gestión de datos personales y configuración
- **🛒 Carrito** - Productos agregados para compra

### **Menú Lateral (Usuarios Autenticados)**
- **📊 Dashboard** - Panel de control (solo administradores)
- **🏋️ Entrenamiento** - Planes y rutinas de ejercicio
- **🥗 Nutrición** - Planes alimentarios y recetas
- **💬 Foros** - Comunidad y discusiones
- **📦 Mis Pedidos** - Historial y seguimiento de compras

---

## 👥 **FUNCIONALIDADES POR ROL**

### **🔵 Cliente (Rol ID: 1)**
- ✅ Navegar y comprar productos
- ✅ Ver detalles de productos
- ✅ Gestionar carrito de compras
- ✅ Realizar pedidos y pagos
- ✅ Seguimiento de pedidos
- ✅ Actualizar perfil personal
- ✅ Suscribirse a planes de entrenamiento
- ✅ Suscribirse a planes de nutrición
- ✅ Comunicarse con entrenadores/nutricionistas

### **🟡 Entrenador (Rol ID: 2)**
- ✅ Todas las funciones de Cliente
- ✅ Crear y gestionar planes de entrenamiento
- ✅ Participar en foros de entrenamiento
- ✅ Chat con clientes asignados
- ✅ Ver estadísticas de sus planes

### **🟠 Nutricionista (Rol ID: 3)**
- ✅ Todas las funciones de Cliente
- ✅ Crear y gestionar planes de nutrición
- ✅ Participar en foros de nutrición
- ✅ Chat con clientes asignados
- ✅ Ver estadísticas de sus planes

### **🔴 Administrador (Rol ID: 6)**
- ✅ **Acceso total al sistema**
- ✅ Dashboard con estadísticas completas
- ✅ Gestión de usuarios (crear, editar, eliminar)
- ✅ Gestión de productos (inventario, precios, stock)
- ✅ Gestión de pedidos y ventas
- ✅ Acceso a todas las APIs del sistema
- ✅ Reportes y analytics

---

## 🏠 **PÁGINA PRINCIPAL (HOME)**

### **Secciones Principales:**

#### **1. Banner Principal**
- **Imagen destacada** con mensaje de bienvenida
- **Botones de acción** para servicios principales
- **Navegación rápida** a productos y planes

#### **2. Sección de Servicios**
- **💪 Entrenamiento Personal**
  - Planes personalizados
  - Entrenadores certificados
  - Seguimiento profesional

- **🥗 Nutrición Especializada**
  - Dietas personalizadas
  - Recetas saludables
  - Consultas nutricionales

- **🛒 Tienda de Productos**
  - Suplementos deportivos
  - Equipamiento fitness
  - Accesorios y más

#### **3. Productos Destacados**
- **Carrusel de productos** más vendidos
- **Precios y ofertas** especiales
- **Acceso rápido** al detalle de productos

#### **4. Testimonios**
- **Experiencias reales** de usuarios
- **Resultados obtenidos** con los servicios
- **Calificaciones y comentarios**

---

## 🛍️ **MÓDULO DE PRODUCTOS**

### **Catálogo de Productos** (`/productos`)

#### **Funcionalidades:**
1. **📋 Listado de Productos**
   - Vista en cuadrícula responsive
   - Filtros por categoría
   - Búsqueda por nombre
   - Ordenamiento por precio

2. **🔍 Detalle de Producto** (`/productos/:id`)
   - Imagen del producto
   - Descripción completa
   - Precio actual
   - Stock disponible
   - Botón "Agregar al carrito"
   - Comentarios y calificaciones

3. **🛒 Carrito de Compras** (`/carrito`)
   - Lista de productos agregados
   - Cantidad editable
   - Subtotal por producto
   - Total general
   - Botón "Proceder al pago"

#### **Proceso de Compra:**
1. **Seleccionar productos** desde el catálogo
2. **Agregar al carrito** con la cantidad deseada
3. **Revisar el carrito** y modificar si es necesario
4. **Proceder al pago** con WebPay (Transbank)
5. **Confirmación** y seguimiento del pedido

---

## 📦 **SISTEMA DE PEDIDOS**

### **Realizar Pedido**
1. **Desde el carrito**, haz clic en "Proceder al pago"
2. **Revisa los datos** de envío y facturación
3. **Selecciona método de pago** (WebPay)
4. **Confirma el pedido**
5. **Serás redirigido** a la pasarela de pago

### **Seguimiento de Pedidos** (`/seguimiento`)
- **📋 Lista de pedidos** realizados
- **🔍 Estado actual** de cada pedido:
  - ⏳ **Pendiente** - Pago en proceso
  - 📦 **En Proceso** - Preparando envío
  - 🚚 **En Camino** - Producto enviado
  - ✅ **Entregado** - Pedido completado
  - ❌ **Cancelado** - Pedido cancelado

### **Página de Confirmación** (`/return`)
- **Confirmación de pago** exitoso
- **Detalles del pedido** realizado
- **Número de seguimiento**
- **Tiempo estimado** de entrega

---

## 🏋️ **PLANES DE ENTRENAMIENTO**

### **Acceso:** `/planes/entrenamiento`

#### **Para Clientes:**
1. **📋 Ver Planes Disponibles**
   - Lista de planes de entrenamiento
   - Descripción de cada plan
   - Precio y duración
   - Entrenador asignado

2. **💳 Suscribirse a un Plan**
   - Seleccionar plan deseado
   - Proceso de pago
   - Asignación automática de entrenador

3. **📱 Acceder a Rutinas**
   - Rutinas semanales personalizadas
   - Videos explicativos
   - Progreso y estadísticas

#### **Para Entrenadores:**
1. **➕ Crear Planes**
   - Nombre y descripción del plan
   - Precio y duración
   - Rutinas y ejercicios incluidos

2. **👥 Gestionar Clientes**
   - Lista de clientes suscritos
   - Progreso individual
   - Comunicación directa

3. **📊 Estadísticas**
   - Número de suscripciones
   - Ingresos generados
   - Calificaciones recibidas

### **Foros de Entrenamiento** (`/planes/foros`)
- **💬 Discusiones** sobre rutinas y técnicas
- **❓ Preguntas y respuestas** entre usuarios
- **📚 Consejos** de entrenadores profesionales
- **📸 Compartir** progreso y resultados

---

## 🥗 **PLANES DE NUTRICIÓN**

### **Acceso:** `/planes/nutricion`

#### **Para Clientes:**
1. **📋 Ver Planes Nutricionales**
   - Planes de alimentación disponibles
   - Objetivos (pérdida de peso, ganancia muscular, etc.)
   - Nutricionista asignado
   - Precio y duración

2. **💳 Suscribirse a Plan**
   - Evaluación nutricional inicial
   - Selección de plan personalizado
   - Pago y activación

3. **📱 Seguir Plan Alimentario**
   - Menús semanales
   - Recetas detalladas
   - Lista de compras
   - Seguimiento de progreso

#### **Para Nutricionistas:**
1. **➕ Crear Planes**
   - Objetivos nutricionales
   - Menús balanceados
   - Recetas y preparaciones
   - Recomendaciones especiales

2. **👥 Gestionar Pacientes**
   - Evaluaciones nutricionales
   - Seguimiento de peso y medidas
   - Ajustes al plan según progreso

3. **📊 Reportes**
   - Progreso de pacientes
   - Adherencia al plan
   - Resultados obtenidos

---

## 📊 **DASHBOARD ADMINISTRATIVO**

### **Acceso:** `/dashboard/inicio` (Solo Administradores)

#### **Sección de Inicio - Estadísticas Principales**

1. **📈 Tarjetas de Resumen**
   - **💰 Total Ventas:** Número de ventas y monto total generado
   - **📦 Total Productos:** Cantidad de productos y alertas de stock bajo
   - **👥 Total Usuarios:** Usuarios registrados y nuevos usuarios del mes
   - **📋 Pedidos Pendientes:** Pedidos en proceso y por procesar

2. **📊 Gráficos Interactivos**
   - **📈 Gráfico de Barras:** Ventas por mes (últimos 6 meses)
   - **🍩 Gráfico de Dona:** Distribución de estados de pedidos
   - **Colores dinámicos** y **animaciones suaves**

3. **📋 Tablas de Información**
   - **🏆 Top Usuarios:** Clientes con más compras y gasto total
   - **⭐ Productos Más Vendidos:** Ranking de productos por popularidad
   - **Datos actualizados** en tiempo real

4. **🔌 Indicador de Conexión**
   - **🟢 Verde:** Conectado al servidor backend
   - **🟡 Amarillo:** Cargando datos
   - **🔴 Rojo:** Error de conexión
   - **Mensajes informativos** sobre el estado del sistema

#### **Gestión de Usuarios** (Sección: `usuarios`)
- **📋 Lista completa** de usuarios registrados
- **➕ Agregar nuevos usuarios** con todos los datos
- **✏️ Editar información** de usuarios existentes
- **🗑️ Eliminar usuarios** (con confirmación)
- **🔄 Cambiar roles** de usuario
- **📊 Paginación** para mejor rendimiento

#### **Gestión de Productos** (Sección: `productos`)
- **📋 Inventario completo** de productos
- **➕ Agregar nuevos productos** con imágenes
- **✏️ Editar productos** existentes
- **🗑️ Eliminar productos** del catálogo
- **📊 Gestión de stock** y precios
- **🖼️ Subida de imágenes** para productos

#### **APIs del Sistema** (Sección: `Api`)
- **🔗 Enlaces directos** a todas las APIs
- **📝 Documentación** de endpoints
- **🧪 Herramientas de prueba** para desarrolladores
- **📊 Monitoreo** de performance de APIs

---

## 👤 **GESTIÓN DE PERFIL**

### **Acceso:** `/perfil`

#### **Información Personal**
- **📝 Editar datos básicos:**
  - Nombres y apellidos
  - Correo electrónico
  - Teléfono
  - Dirección

#### **Configuración de Cuenta**
- **🔒 Cambiar contraseña**
- **📧 Verificar correo electrónico**
- **🔔 Preferencias de notificaciones**

#### **Historial de Actividad**
- **🛒 Compras realizadas**
- **📋 Planes suscritos**
- **💬 Conversaciones activas**

---

## 💬 **SISTEMA DE COMUNICACIÓN**

### **Chat con Profesionales**
- **🏋️ Chat con Entrenadores:** Consultas sobre rutinas y ejercicios
- **🥗 Chat con Nutricionistas:** Dudas sobre alimentación y dietas
- **📱 Interfaz tipo WhatsApp** para facilidad de uso

#### **Funcionalidades del Chat:**
- **💬 Mensajes en tiempo real**
- **📸 Envío de imágenes** (progreso, comidas, etc.)
- **📞 Historial de conversaciones**
- **🔔 Notificaciones** de mensajes nuevos

### **Búsqueda de Profesionales**
- **🔍 Buscar por teléfono** para iniciar conversaciones
- **👥 Profesionales asignados** automáticamente al suscribirse
- **⭐ Calificaciones** y reseñas de profesionales

---

## 📞 **CONTACTO Y SOPORTE**

### **Página de Contacto** (`/contactenos`)

#### **Información de la Empresa**
- **📍 Dirección física**
- **📞 Teléfonos de contacto**
- **📧 Correos electrónicos**
- **🕒 Horarios de atención**

#### **Formulario de Contacto**
- **👤 Datos del remitente**
- **📝 Mensaje personalizado**
- **📋 Tipo de consulta**
- **📧 Respuesta por correo electrónico**

#### **Redes Sociales**
- **📱 Enlaces** a perfiles oficiales
- **📢 Noticias** y actualizaciones
- **🎯 Promociones** especiales

---

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Problemas Comunes y Soluciones**

#### **🔐 Problemas de Acceso**

**❌ No puedo iniciar sesión**
- ✅ Verifica que el correo y contraseña sean correctos
- ✅ Usa la opción "Recuperar contraseña"
- ✅ Intenta con el login de Google
- ✅ Verifica que tu cuenta esté activa

**❌ No recibo el correo de recuperación**
- ✅ Revisa la carpeta de spam
- ✅ Verifica que el correo esté escrito correctamente
- ✅ Espera unos minutos e intenta nuevamente

#### **🛒 Problemas con Compras**

**❌ No puedo agregar productos al carrito**
- ✅ Verifica que haya stock disponible
- ✅ Inicia sesión en tu cuenta
- ✅ Actualiza la página web
- ✅ Verifica tu conexión a internet

**❌ Error en el pago**
- ✅ Verifica los datos de tu tarjeta
- ✅ Asegúrate de tener fondos suficientes
- ✅ Intenta con otro método de pago
- ✅ Contacta a tu banco si persiste el error

#### **📱 Problemas Técnicos**

**❌ La página carga lentamente**
- ✅ Verifica tu conexión a internet
- ✅ Cierra otras pestañas del navegador
- ✅ Actualiza la página (F5)
- ✅ Limpia el caché del navegador

**❌ No aparecen las imágenes**
- ✅ Verifica tu conexión a internet
- ✅ Actualiza la página
- ✅ Intenta con otro navegador
- ✅ Desactiva bloqueadores de anuncios

#### **💬 Problemas con el Chat**

**❌ No puedo enviar mensajes**
- ✅ Verifica que estés conectado
- ✅ Comprueba que el profesional esté disponible
- ✅ Actualiza la página del chat
- ✅ Verifica tu suscripción al plan

### **📞 Soporte Técnico**

Si los problemas persisten, contacta al equipo de soporte:

- **📧 Email:** soporte@saborintegraciones.cl
- **📞 Teléfono:** +56 9 XXXX XXXX
- **🕒 Horario:** Lunes a Viernes, 9:00 - 18:00
- **💬 Chat:** Disponible en la plataforma

---

## ⚙️ **CONFIGURACIÓN TÉCNICA**

### **Requisitos del Sistema**
- **🌐 Navegadores soportados:**
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

- **📱 Dispositivos compatibles:**
  - Computadores de escritorio
  - Tablets (iPad, Android)
  - Smartphones (iOS, Android)

### **URLs Importantes**
- **🏠 Página Principal:** http://localhost:5173/
- **📊 Dashboard Admin:** http://localhost:5173/dashboard/inicio
- **🛒 Tienda:** http://localhost:5173/productos
- **🏋️ Entrenamiento:** http://localhost:5173/planes/entrenamiento
- **🥗 Nutrición:** http://localhost:5173/planes/nutricion

### **APIs del Backend**
- **👥 Usuarios:** http://localhost:5000/api/Usuarios
- **📦 Productos:** http://localhost:5000/api/productos
- **📊 Estadísticas:** http://localhost:5000/api/estadisticas/*
- **💬 Chat:** http://localhost:5000/api/chat/*

---

## 📝 **TÉRMINOS Y CONDICIONES**

### **Uso de la Plataforma**
- La plataforma está destinada para usuarios mayores de 18 años
- Se requiere información veraz al registrarse
- El uso debe ser conforme a las leyes vigentes

### **Privacidad y Datos**
- Los datos personales son protegidos según la ley chilena
- No compartimos información con terceros sin autorización
- Puedes solicitar la eliminación de tu cuenta en cualquier momento

### **Política de Devoluciones**
- Productos físicos: 30 días para devolución
- Planes digitales: 7 días de garantía
- Productos usados no son elegibles para devolución

---

## 📋 **RESUMEN DE FUNCIONALIDADES**

### **✅ Para Todos los Usuarios**
- 🏠 Navegación por la página principal
- 📱 Registro e inicio de sesión (tradicional y Google)
- 🛍️ Exploración del catálogo de productos
- 📞 Contacto con la empresa
- 📱 Versión móvil optimizada

### **✅ Para Clientes Registrados**
- 🛒 Compra de productos con carrito
- 💳 Pago seguro con WebPay
- 📦 Seguimiento de pedidos
- 👤 Gestión de perfil personal
- 🏋️ Suscripción a planes de entrenamiento
- 🥗 Suscripción a planes de nutrición
- 💬 Chat con entrenadores y nutricionistas

### **✅ Para Entrenadores**
- 📋 Creación y gestión de planes de entrenamiento
- 👥 Gestión de clientes asignados
- 💬 Chat con clientes
- 📊 Estadísticas de sus servicios
- 🏆 Participación en foros especializados

### **✅ Para Nutricionistas**
- 🥗 Creación y gestión de planes nutricionales
- 👥 Seguimiento de pacientes
- 💬 Consultas nutricionales por chat
- 📊 Reportes de progreso
- 📚 Participación en comunidad profesional

### **✅ Para Administradores**
- 📊 Dashboard completo con estadísticas en tiempo real
- 👥 Gestión total de usuarios (CRUD)
- 📦 Gestión completa de productos e inventario
- 📋 Supervisión de pedidos y ventas
- 🔗 Acceso a todas las APIs del sistema
- 📈 Reportes y analytics avanzados

---

## 🎯 **OBJETIVOS DE LA PLATAFORMA**

**SaborIntegraciones** busca ser la solución integral para personas que desean mejorar su calidad de vida a través de:

- **🏋️ Ejercicio personalizado** con entrenadores certificados
- **🥗 Nutrición especializada** con profesionales de la salud
- **🛒 Productos de calidad** para complementar el estilo de vida saludable
- **💬 Comunicación directa** con expertos en fitness y nutrición
- **📊 Seguimiento del progreso** mediante herramientas digitales

---

*Este manual está en constante actualización. Para sugerencias o reportar errores, contacta al equipo de desarrollo.*

**Versión:** 1.0  
**Fecha:** Julio 2025  
**Última actualización:** 13/07/2025
