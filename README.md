# 🏋️‍♂️ SaborIntegraciones - Sistema Integral de Gestión Deportiva

<div align="center">
  <img src="Frontend/Web/src/assets/icono-logo.png" alt="SaborIntegraciones Logo" width="200"/>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
  [![Oracle](https://img.shields.io/badge/Oracle-Database-red.svg)](https://www.oracle.com/database/)
  [![Express](https://img.shields.io/badge/Express-4.18-yellow.svg)](https://expressjs.com/)
  [![Chart.js](https://img.shields.io/badge/Chart.js-4.0-ff6384.svg)](https://www.chartjs.org/)
</div>

## 📋 Descripción

SaborIntegraciones es un sistema integral de gestión deportiva que combina e-commerce, planes de entrenamiento, nutrición y un potente dashboard administrativo. Diseñado especialmente para centros deportivos, gimnasios y profesionales del fitness.

## ✨ Características Principales

### 🛒 **E-commerce Completo**
- Catálogo de productos deportivos
- Carrito de compras inteligente
- Sistema de reservas sin costo adicional
- Integración con WebPay para pagos seguros
- Gestión de stock en tiempo real
- Sistema de comentarios y valoraciones

### 👥 **Gestión de Usuarios**
- Registro e inicio de sesión tradicional
- Autenticación con Google OAuth 2.0
- Sistema de roles y permisos
- Perfiles personalizados
- Historial de compras y actividades

### 🏋️‍♂️ **Planes de Entrenamiento**
- Creación y personalización de rutinas
- Seguimiento de progreso
- Diferentes niveles y objetivos
- Foro de entrenadoras para consultas
- Planes adaptados por profesionales

### 🥗 **Planes de Nutrición**
- Planes personalizados de alimentación
- Cálculo de calorías y macronutrientes
- Diferentes tipos de dieta
- Seguimiento nutricional
- Recomendaciones profesionales

### 📊 **Dashboard Administrativo Avanzado**
- **Estadísticas en tiempo real**
  - Total de ventas y montos
  - Gráficos de ventas por mes
  - Análisis de productos más vendidos
  - Estados de pedidos con gráfico circular
  - Top usuarios con más compras
  - Productos con bajo stock
  - Nuevos usuarios por período

- **Gestión de Datos**
  - CRUD completo de usuarios
  - CRUD completo de productos
  - Gestión de pedidos y seguimiento
  - Sistema de notificaciones
  - Reportes exportables

### 🚚 **Logística y Envíos**
- Integración con BlueExpress
- Seguimiento de envíos en tiempo real
- Notificaciones automáticas por email
- Sistema de vouchers PDF
- Gestión de direcciones

### 📧 **Comunicaciones**
- Sistema de contacto integrado
- Notificaciones por email automáticas
- Confirmaciones de pedidos
- Alertas de estado de envío
- Newsletter y promociones

## 🛠 Tecnologías Utilizadas

### Frontend
- **React 18.2** - Biblioteca principal
- **Vite** - Herramienta de construcción rápida
- **Chart.js + react-chartjs-2** - Gráficos interactivos
- **Axios** - Cliente HTTP
- **React Router DOM** - Navegación
- **CSS3** - Estilos personalizados

### Backend
- **Node.js + Express** - Servidor web
- **Oracle Database** - Base de datos principal
- **JWT** - Autenticación segura
- **Bcrypt** - Encriptación de contraseñas
- **Multer** - Subida de archivos
- **Nodemailer** - Envío de emails
- **Passport.js** - Autenticación OAuth
- **PDFKit** - Generación de documentos

### Integraciones
- **Google OAuth 2.0** - Autenticación social
- **WebPay** - Pasarela de pagos
- **BlueExpress API** - Servicios de envío
- **Gmail SMTP** - Envío de correos

## 🚀 Instalación

### Prerrequisitos
- Node.js 18 o superior
- Oracle Database XE
- Git

### Configuración del Backend

1. **Clona el repositorio:**
```bash
git clone https://github.com/EnriqueYt2017/SaborIntegraciones.git
cd SaborIntegraciones/Backend
```

2. **Instala las dependencias:**
```bash
npm install
```

3. **Configura la base de datos:**
   - Instala Oracle Database XE
   - Configura las credenciales en `dbConfig.js`
   - Ejecuta los scripts de la base de datos

4. **Configura las variables de entorno:**
```bash
# Crea un archivo .env con:
JWT_SECRET=tu_jwt_secret
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
WEBPAY_COMMERCE_CODE=tu_codigo_comercio
WEBPAY_API_KEY=tu_api_key
```

5. **Inicia el servidor:**
```bash
node server.js
```

### Configuración del Frontend

1. **Navega al directorio del frontend:**
```bash
cd ../Frontend/Web
```

2. **Instala las dependencias:**
```bash
npm install
```

3. **Instala dependencias adicionales para gráficos:**
```bash
npm install chart.js react-chartjs-2
```

4. **Inicia el servidor de desarrollo:**
```bash
npm run dev
```

## 📱 Estructura del Proyecto

```
SaborIntegraciones/
├── Backend/
│   ├── server.js              # Servidor principal
│   ├── dbConfig.js           # Configuración de BD
│   ├── routes/
│   │   └── webpay.js         # Rutas de pagos
│   └── uploads/              # Archivos subidos
├── Frontend/
│   └── Web/
│       ├── src/
│       │   ├── Components/
│       │   │   ├── Dashboard/    # Panel administrativo
│       │   │   ├── Home/         # Página principal
│       │   │   ├── Login-Register/ # Autenticación
│       │   │   ├── Productos/    # Catálogo
│       │   │   ├── Carrito/      # Compras
│       │   │   ├── Pedidos/      # Seguimiento
│       │   │   └── Planes/       # Entrenamiento y nutrición
│       │   └── assets/           # Recursos estáticos
│       └── public/
└── README.md
```

## 🔐 Sistema de Roles

| Rol ID | Nombre | Permisos |
|--------|--------|----------|
| 1 | Usuario Final | Compras, planes, perfil |
| 2 | Vendedor | Gestión de productos |
| 6 | Administrador | Acceso completo al dashboard |

## 📊 APIs Disponibles

### Autenticación
- `POST /login` - Inicio de sesión
- `POST /register` - Registro de usuario
- `GET /auth/google` - Login con Google

### Usuarios
- `GET /api/Usuarios` - Listar usuarios
- `POST /api/Usuarios` - Crear usuario
- `PUT /api/Usuarios/:rut` - Actualizar usuario
- `DELETE /api/Usuarios/:rut` - Eliminar usuario

### Productos
- `GET /api/productos` - Listar productos
- `POST /productos` - Crear producto
- `PUT /productos/:id` - Actualizar producto
- `DELETE /productos/:id` - Eliminar producto

### Estadísticas (Dashboard)
- `GET /api/estadisticas/ventas` - Estadísticas de ventas
- `GET /api/estadisticas/productos` - Estadísticas de productos
- `GET /api/estadisticas/usuarios` - Estadísticas de usuarios
- `GET /api/estadisticas/pedidos` - Estadísticas de pedidos

### Pedidos
- `GET /pedidos` - Listar pedidos
- `PUT /pedidos/:id/estado` - Actualizar estado
- `PUT /pedidos/:id/tracking` - Actualizar tracking

## 🎨 Características del Dashboard

El dashboard incluye:

### 📈 **Tarjetas de Resumen**
- Total de ventas con monto
- Número total de productos
- Total de usuarios registrados
- Pedidos pendientes en tiempo real

### 📊 **Gráficos Interactivos**
- **Gráfico de barras**: Ventas por mes (últimos 6 meses)
- **Gráfico circular**: Estados de pedidos
- **Tablas dinámicas**: Top usuarios y productos más vendidos

### 🔄 **Actualización en Tiempo Real**
- Botón de actualización manual
- Datos sincronizados con la base de datos
- Estados de carga optimizados

## 🚀 Funcionalidades Destacadas

### Sistema de Reservas
- Reserva productos sin costo adicional
- Plazo de 10 días hábiles para retiro
- Generación automática de vouchers PDF
- Notificaciones por email

### Integración de Pagos
- WebPay Plus para tarjetas
- Confirmación automática de transacciones
- Generación de comprobantes
- Historial de pagos detallado

### Sistema de Seguimiento
- Integración con BlueExpress
- Códigos de tracking automáticos
- Notificaciones de estado
- Historial completo de envíos

## 🛡️ Seguridad

- Encriptación de contraseñas con bcrypt
- Tokens JWT para autenticación
- Validación de datos en frontend y backend
- Protección contra inyección SQL
- Middleware de autorización por roles

## 📞 Soporte y Contacto

- **Email**: esancchezp2005@gmail.com
- **GitHub**: [EnriqueYt2017](https://github.com/EnriqueYt2017)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🏆 Características Futuras

- [ ] App móvil nativa
- [ ] Sistema de chat en tiempo real
- [ ] Inteligencia artificial para recomendaciones
- [ ] API para terceros
- [ ] Sistema de afiliados
- [ ] Marketplace multi-vendedor

---

<div align="center">
  <p>⭐ Si te gusta este proyecto, no olvides darle una estrella ⭐</p>
  <p>💻 Desarrollado con ❤️ por el equipo de SaborIntegraciones</p>
</div>
