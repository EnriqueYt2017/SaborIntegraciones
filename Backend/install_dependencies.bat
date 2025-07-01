@echo off
REM Script de instalación para el proyecto Sabor Integraciones (Windows)
REM Instala dependencias tanto para Node.js como para Python

echo 🚀 Instalando dependencias del proyecto Sabor Integraciones...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: No se encontró package.json. Asegúrate de estar en el directorio Backend.
    pause
    exit /b 1
)

echo 📦 Instalando dependencias de Node.js...

REM Instalar dependencias de Node.js
call npm install express oracledb cors dotenv
call npm install bcrypt jsonwebtoken dotenv
call npm install express cors transbank-sdk
call npm install nodemailer
call npm install pdfkit
call npm install twilio
call npm install multer
call npm install passport passport-google-oauth20 express-session
call npm install soap

echo ✅ Dependencias de Node.js instaladas.

echo 🐍 Instalando dependencias de Python...

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python no está instalado. Por favor instala Python 3.7 o superior.
    pause
    exit /b 1
)

REM Instalar dependencias de Python
python -m pip install spyne
python -m pip install zeep
python -m pip install cx_Oracle
python -m pip install python-dotenv
python -m pip install lxml

echo ✅ Dependencias de Python instaladas.

echo.
echo 🎉 ¡Instalación completada!
echo.
echo 📋 Instrucciones de uso:
echo 1. Configurar variables de entorno en .env:
echo    - DB_USER=tu_usuario_oracle
echo    - DB_PASSWORD=tu_contraseña_oracle
echo    - DB_DSN=tu_dsn_oracle
echo.
echo 2. Iniciar el servidor backend:
echo    node server.js
echo.
echo 3. El servicio SOAP se iniciará automáticamente en el puerto 8001
echo 4. Las rutas SOAP estarán disponibles en http://localhost:5000/api/soap/*
echo.
echo 🔗 Endpoints SOAP disponibles:
echo    - POST /api/soap/pedidos - Crear pedido
echo    - GET /api/soap/pedidos/:id - Obtener pedido
echo    - PUT /api/soap/pedidos/:id/estado - Actualizar estado
echo    - GET /api/soap/usuarios/:id/pedidos - Listar pedidos de usuario
echo    - DELETE /api/soap/pedidos/:id - Cancelar pedido
echo    - GET /api/soap/status - Estado del servicio
echo.
echo 📖 WSDL disponible en: http://localhost:8001?wsdl
echo.
pause
