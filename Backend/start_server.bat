@echo off
echo 🚀 Iniciando Sistema Sabor con Integración SOAP...
echo.

REM Verificar que estemos en el directorio correcto
if not exist "server.js" (
    echo ❌ Error: No se encontró server.js. 
    echo Por favor ejecuta este script desde el directorio Backend.
    pause
    exit /b 1
)

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado.
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python no está instalado.
    echo Por favor instala Python desde https://python.org/
    pause
    exit /b 1
)

echo ✅ Verificaciones completadas
echo.

REM Verificar dependencias de Node.js
if not exist "node_modules" (
    echo 📦 Instalando dependencias de Node.js...
    call npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias de Node.js
        pause
        exit /b 1
    )
)

REM Verificar dependencias de Python
echo 🐍 Verificando dependencias de Python...
python -c "import spyne, zeep, cx_Oracle, dotenv, lxml" 2>nul
if errorlevel 1 (
    echo 📦 Instalando dependencias de Python...
    python -m pip install spyne zeep cx_Oracle python-dotenv lxml
    if errorlevel 1 (
        echo ❌ Error instalando dependencias de Python
        pause
        exit /b 1
    )
)

echo ✅ Todas las dependencias están instaladas
echo.

REM Verificar archivo de configuración
if not exist ".env" (
    echo 📝 Creando archivo de configuración .env...
    echo DB_USER=ADMIN > .env
    echo DB_PASSWORD=Saborcito123 >> .env
    echo DB_DSN=localhost:1521/XE >> .env
    echo.
    echo ⚠️  IMPORTANTE: Revisa y actualiza el archivo .env con tu configuración de base de datos
    echo.
)

echo 🔥 Iniciando servidor...
echo.
echo 📋 Información del sistema:
echo    - Servidor Principal: http://localhost:5000
echo    - Servicio SOAP: http://localhost:8001
echo    - WSDL: http://localhost:8001?wsdl
echo    - Frontend: http://localhost:5173 (si está corriendo)
echo.
echo 🔗 Nuevas rutas disponibles:
echo    - POST /api/sincronizar-pedidos-soap - Sincronizar pedidos existentes
echo    - POST /api/pedidos-soap - Crear pedidos directamente via SOAP
echo    - GET  /api/pedidos-unificados/:id - Ver pedidos tradicionales + SOAP
echo    - Todas las rutas SOAP en /api/soap/*
echo.
echo 🛑 Para detener el servidor presiona Ctrl+C
echo.

REM Iniciar el servidor
node server.js

pause
