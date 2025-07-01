# Integración SOAP - Sistema de Pedidos

Esta integración SOAP permite gestionar pedidos del sistema Sabor de manera distribuida y escalable.

## 🌟 Características

- **Servicio SOAP completo** para gestión de pedidos
- **Cliente Python** para consumir servicios SOAP
- **Adaptador Node.js** para integración con el backend Express
- **Interfaz React** para seguimiento en tiempo real
- **Base de datos Oracle** como almacenamiento principal

## 🏗️ Arquitectura

```
Frontend (React) → Backend (Node.js) → Adaptador SOAP → Servicio SOAP (Python) → Base de datos (Oracle)
```

## 📁 Archivos de la Integración

### Backend
- `soap/soap_pedidos_service.py` - Servicio SOAP principal en Python
- `soap/soap_client.py` - Cliente SOAP para testing y consumo
- `soap/soap_adapter.js` - Adaptador Node.js para Express
- `soap/soap_pedidos_service_flask.py` - Servicio SOAP Flask alternativo
- `soap/test_integracion_soap.py` - Tests de integración SOAP
- `server.js` - Servidor principal con integración SOAP

### Frontend
- `SeguimientoSOAP.jsx` - Componente React para UI
- `SeguimientoSOAP.css` - Estilos del componente

## 🚀 Instalación

### 1. Instalar Dependencias

#### Windows:
```bash
.\install_dependencies.bat
```

#### Linux/macOS:
```bash
chmod +x install_dependencies.sh
./install_dependencies.sh
```

#### Manual:
```bash
# Node.js
npm install soap express oracledb cors dotenv bcrypt jsonwebtoken nodemailer pdfkit twilio multer passport passport-google-oauth20 express-session

# Python
pip install spyne zeep cx_Oracle python-dotenv lxml
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en el directorio Backend:

```env
DB_USER=tu_usuario_oracle
DB_PASSWORD=tu_contraseña_oracle
DB_DSN=localhost:1521/XE
```

### 3. Esquema de Base de Datos

Asegúrate de tener las siguientes tablas en Oracle:

```sql
-- Tabla de pedidos
CREATE TABLE PEDIDOS (
    ID_PEDIDO NUMBER PRIMARY KEY,
    ID_USUARIO NUMBER NOT NULL,
    FECHA_PEDIDO DATE DEFAULT SYSDATE,
    ESTADO VARCHAR2(20) DEFAULT 'PENDIENTE',
    TOTAL NUMBER(10,2) NOT NULL,
    DIRECCION_ENTREGA VARCHAR2(200),
    TELEFONO VARCHAR2(20),
    EMAIL VARCHAR2(100),
    METODO_PAGO VARCHAR2(50),
    FECHA_ACTUALIZACION DATE DEFAULT SYSDATE
);

-- Tabla de detalle de pedidos
CREATE TABLE DETALLE_PEDIDOS (
    ID_DETALLE NUMBER PRIMARY KEY,
    ID_PEDIDO NUMBER REFERENCES PEDIDOS(ID_PEDIDO),
    ID_PRODUCTO NUMBER NOT NULL,
    CANTIDAD NUMBER NOT NULL,
    PRECIO_UNITARIO NUMBER(10,2) NOT NULL,
    SUBTOTAL NUMBER(10,2) NOT NULL
);

-- Secuencia para pedidos
CREATE SEQUENCE PEDIDOS_SEQ START WITH 1 INCREMENT BY 1;
```

## 🎯 Uso

### 1. Iniciar el Sistema

```bash
# En el directorio Backend
node server.js
```

Esto iniciará:
- Servidor Express en puerto 5000
- Servicio SOAP automáticamente en puerto 8001

### 2. Verificar Estado

```bash
curl http://localhost:5000/api/soap/status
```

### 3. WSDL del Servicio

El WSDL está disponible en: `http://localhost:8001?wsdl`

## 📚 API SOAP

### Operaciones Disponibles

1. **crear_pedido**
   - Crea un nuevo pedido con productos
   - Actualiza automáticamente el stock
   - Retorna ID del pedido creado

2. **obtener_pedido**
   - Obtiene información completa de un pedido
   - Incluye productos y detalles

3. **actualizar_estado_pedido**
   - Cambia el estado del pedido
   - Estados: PENDIENTE, CONFIRMADO, EN_PROCESO, ENVIADO, ENTREGADO, CANCELADO

4. **listar_pedidos_usuario**
   - Lista todos los pedidos de un usuario específico

5. **cancelar_pedido**
   - Cancela un pedido y restaura el stock

### Estados de Pedido

- `PENDIENTE` - Pedido recién creado
- `CONFIRMADO` - Pedido confirmado por el sistema
- `EN_PROCESO` - Pedido en preparación
- `ENVIADO` - Pedido enviado al cliente
- `ENTREGADO` - Pedido entregado exitosamente
- `CANCELADO` - Pedido cancelado

## 🌐 API REST (Adaptador)

### Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/soap/pedidos` | Crear nuevo pedido |
| GET | `/api/soap/pedidos/:id` | Obtener pedido específico |
| PUT | `/api/soap/pedidos/:id/estado` | Actualizar estado del pedido |
| GET | `/api/soap/usuarios/:id/pedidos` | Listar pedidos del usuario |
| DELETE | `/api/soap/pedidos/:id` | Cancelar pedido |
| GET | `/api/soap/status` | Estado del servicio SOAP |

### Ejemplos de Uso

#### Crear Pedido
```javascript
const pedido = {
  id_usuario: 1,
  direccion_entrega: "Calle Falsa 123",
  telefono: "+56912345678",
  email: "cliente@email.com",
  metodo_pago: "WEBPAY",
  productos: [
    {
      id_producto: 1,
      nombre: "Producto A",
      precio: 15.99,
      cantidad: 2
    }
  ]
};

fetch('/api/soap/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pedido)
});
```

#### Actualizar Estado
```javascript
fetch('/api/soap/pedidos/123/estado', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nuevo_estado: 'CONFIRMADO' })
});
```

## 🖥️ Interfaz de Usuario

El componente `SeguimientoSOAP.jsx` proporciona:

- **Búsqueda de pedidos** por ID
- **Lista de pedidos** del usuario logueado
- **Actualización de estados** en tiempo real
- **Cancelación de pedidos** con confirmación
- **Estado del servicio** SOAP en tiempo real

### Integración en React

```jsx
import SeguimientoSOAP from './Components/Pedidos/SeguimientoSOAP';

function App() {
  return (
    <div>
      <SeguimientoSOAP />
    </div>
  );
}
```

## 🔧 Testing

### Probar Cliente SOAP

```bash
cd Backend
python soap/soap_client.py
```

Esto ejecutará pruebas automáticas de todas las operaciones SOAP.

### Probar Endpoints REST

```bash
# Verificar estado
curl http://localhost:5000/api/soap/status

# Obtener pedido
curl http://localhost:5000/api/soap/pedidos/1

# Listar pedidos de usuario
curl http://localhost:5000/api/soap/usuarios/1/pedidos
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Servicio SOAP no inicia**
   - Verificar que Python está instalado
   - Verificar dependencias de Python
   - Revisar configuración de base de datos

2. **Error de conexión a Oracle**
   - Verificar variables de entorno
   - Confirmar que Oracle está ejecutándose
   - Revisar permisos del usuario

3. **Puerto 8001 ocupado**
   - Cambiar puerto en `soap/soap_pedidos_service.py`
   - Actualizar URL en `soap/soap_adapter.js`

### Logs y Debugging

```bash
# Ver logs del servicio SOAP
tail -f soap_service.log

# Debug del adaptador Node.js
DEBUG=soap:* node server.js
```

## 📈 Monitoreo

### Health Check

```bash
# Estado del servicio
curl http://localhost:5000/api/soap/status

# WSDL disponible
curl http://localhost:8001?wsdl
```

### Métricas

El servicio registra automáticamente:
- Número de peticiones SOAP
- Tiempos de respuesta
- Errores de base de datos
- Estado de conexiones

## 🔒 Seguridad

- Validación de entrada en todos los endpoints
- Sanitización de datos SQL
- Manejo seguro de errores
- Timeouts configurables

## 📞 Soporte

Para problemas o preguntas:
1. Revisar los logs del servicio
2. Verificar configuración de base de datos
3. Probar endpoints individualmente
4. Consultar documentación de WSDL

---

*Sistema de Integración SOAP - Proyecto Sabor* 🍽️
