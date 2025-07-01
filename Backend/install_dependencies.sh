#!/bin/bash

# Script de instalación para el proyecto Sabor Integraciones
# Instala dependencias tanto para Node.js como para Python

echo "🚀 Instalando dependencias del proyecto Sabor Integraciones..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio Backend."
    exit 1
fi

echo "📦 Instalando dependencias de Node.js..."

# Instalar dependencias de Node.js
npm install express oracledb cors dotenv
npm install bcrypt jsonwebtoken dotenv
npm install express cors transbank-sdk
npm install nodemailer
npm install pdfkit
npm install twilio
npm install multer
npm install passport passport-google-oauth20 express-session
npm install soap

echo "✅ Dependencias de Node.js instaladas."

echo "🐍 Instalando dependencias de Python..."

# Verificar si Python está instalado
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python no está instalado. Por favor instala Python 3.7 o superior."
    exit 1
fi

# Usar python3 si está disponible, sino python
PYTHON_CMD="python"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
fi

# Instalar dependencias de Python
$PYTHON_CMD -m pip install spyne
$PYTHON_CMD -m pip install zeep
$PYTHON_CMD -m pip install cx_Oracle
$PYTHON_CMD -m pip install python-dotenv
$PYTHON_CMD -m pip install lxml

echo "✅ Dependencias de Python instaladas."

echo ""
echo "🎉 ¡Instalación completada!"
echo ""
echo "📋 Instrucciones de uso:"
echo "1. Configurar variables de entorno en .env:"
echo "   - DB_USER=tu_usuario_oracle"
echo "   - DB_PASSWORD=tu_contraseña_oracle"
echo "   - DB_DSN=tu_dsn_oracle"
echo ""
echo "2. Iniciar el servidor backend:"
echo "   node server.js"
echo ""
echo "3. El servicio SOAP se iniciará automáticamente en el puerto 8001"
echo "4. Las rutas SOAP estarán disponibles en http://localhost:5000/api/soap/*"
echo ""
echo "🔗 Endpoints SOAP disponibles:"
echo "   - POST /api/soap/pedidos - Crear pedido"
echo "   - GET /api/soap/pedidos/:id - Obtener pedido"
echo "   - PUT /api/soap/pedidos/:id/estado - Actualizar estado"
echo "   - GET /api/soap/usuarios/:id/pedidos - Listar pedidos de usuario"
echo "   - DELETE /api/soap/pedidos/:id - Cancelar pedido"
echo "   - GET /api/soap/status - Estado del servicio"
echo ""
echo "📖 WSDL disponible en: http://localhost:8001?wsdl"
