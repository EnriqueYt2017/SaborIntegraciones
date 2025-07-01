const express = require('express');
const soap = require('soap');
const { spawn } = require('child_process');
const path = require('path');
const fetch = require('node-fetch');

class SOAPAdapter {
    constructor() {
        this.soapServiceUrl = 'http://localhost:8001/soap/pedidos/wsdl';
        this.soapClient = null;
        this.soapServerProcess = null;
        this.isServiceRunning = false;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 segundos
    }

    /**
     * Inicializar el adaptador SOAP
     */
    async initialize() {
        try {
            console.log('🔄 Inicializando adaptador SOAP...');
            
            // Intentar conectar al servicio SOAP existente primero
            const connected = await this.connectToSOAPService();
            
            if (!connected) {
                console.log('📡 Servicio SOAP no encontrado, intentando iniciarlo...');
                await this.startSOAPService();
                
                // Reintentar conexión después de iniciar el servicio
                for (let i = 0; i < this.maxRetries; i++) {
                    console.log(`🔄 Intento de conexión ${i + 1}/${this.maxRetries}...`);
                    await this.sleep(this.retryDelay);
                    
                    if (await this.connectToSOAPService()) {
                        break;
                    }
                }
            }
            
            if (this.isServiceRunning) {
                console.log('✅ SOAP Adapter inicializado correctamente');
                return true;
            } else {
                console.warn('⚠️  SOAP Adapter iniciado en modo limitado (sin servicio SOAP)');
                return false;
            }
        } catch (error) {
            console.error('❌ Error inicializando SOAP Adapter:', error.message);
            return false;
        }
    }

    /**
     * Conectar al servicio SOAP (ahora como servicio HTTP)
     */
    async connectToSOAPService() {
        try {
            // Para el servicio Flask, verificamos el endpoint de health
            const healthUrl = 'http://localhost:8001/health';
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const healthData = await response.json();
                if (healthData.status === 'healthy') {
                    this.isServiceRunning = true;
                    console.log('🔗 Conectado al servicio SOAP Flask de pedidos');
                    return true;
                }
            }
            
            throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
            
        } catch (error) {
            console.log(`⚠️  No se pudo conectar al servicio SOAP: ${error.message}`);
            this.soapClient = null;
            this.isServiceRunning = false;
            return false;
        }
    }

    /**
     * Iniciar el servicio SOAP de Python
     */
    async startSOAPService() {
        return new Promise((resolve, reject) => {
            try {
                // Actualizar la ruta para apuntar a la carpeta soap
                const pythonScript = path.join(__dirname, 'soap_pedidos_service_flask.py');
                
                // Verificar si el archivo existe
                const fs = require('fs');
                if (!fs.existsSync(pythonScript)) {
                    console.error(`❌ No se encontró el archivo: ${pythonScript}`);
                    resolve(); // No rechazar, solo resolver sin servicio
                    return;
                }

                console.log(`🐍 Iniciando servicio SOAP de Python: ${pythonScript}`);
                
                // Iniciar el proceso de Python
                this.soapServerProcess = spawn('python', [pythonScript], {
                    detached: false,
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                this.soapServerProcess.stdout.on('data', (data) => {
                    const output = data.toString();
                    console.log(`📡 SOAP Service: ${output.trim()}`);
                });

                this.soapServerProcess.stderr.on('data', (data) => {
                    const error = data.toString();
                    console.error(`❌ SOAP Service Error: ${error.trim()}`);
                });

                this.soapServerProcess.on('close', (code) => {
                    console.log(`📡 SOAP Service terminado con código ${code}`);
                    this.isServiceRunning = false;
                    this.soapClient = null;
                });

                this.soapServerProcess.on('error', (error) => {
                    console.error(`❌ Error iniciando proceso Python: ${error.message}`);
                    this.isServiceRunning = false;
                });

                // Dar tiempo al servicio para iniciar
                setTimeout(() => {
                    resolve();
                }, 3000);

            } catch (error) {
                console.error(`❌ Error en startSOAPService: ${error.message}`);
                resolve(); // No rechazar, permitir que el servidor continue
            }
        });
    }

    /**
     * Crear un nuevo pedido usando SOAP
     */
    async crearPedido(pedidoData) {
        if (!this.isServiceRunning) {
            console.warn('⚠️  Servicio SOAP no disponible para crear pedido');
            return {
                success: false,
                message: 'Servicio SOAP no disponible',
                id_pedido: null
            };
        }

        try {
            const { id_usuario, direccion_entrega, telefono, email, metodo_pago, productos } = pedidoData;
            
            // Validar datos requeridos
            if (!id_usuario || !productos || !Array.isArray(productos) || productos.length === 0) {
                return {
                    success: false,
                    message: 'Datos de pedido incompletos o inválidos'
                };
            }
            
            // Calcular total
            const total = productos.reduce((sum, prod) => {
                return sum + (parseFloat(prod.precio || 0) * parseInt(prod.cantidad || 1));
            }, 0);

            console.log('🔄 Enviando pedido a SOAP Flask:', {
                usuario_id: parseInt(id_usuario),
                total: total,
                estado: 'PENDIENTE',
                detalles: JSON.stringify(productos)
            });

            // Crear SOAP request XML para Flask
            const soapXml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <CrearPedido xmlns="http://pedidos.sabor.com/">
            <usuario_id>${parseInt(id_usuario)}</usuario_id>
            <total>${total}</total>
            <estado>PENDIENTE</estado>
            <detalles>${JSON.stringify(productos)}</detalles>
        </CrearPedido>
    </soap:Body>
</soap:Envelope>`;

            const response = await fetch('http://localhost:8001/soap/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': 'CrearPedido'
                },
                body: soapXml
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('✅ Respuesta SOAP recibida:', responseText.substring(0, 200) + '...');

            // Parsear respuesta XML para extraer el ID del pedido
            const idMatch = responseText.match(/<pedido_id>(\d+)<\/pedido_id>/);
            const successMatch = responseText.match(/<success>(true|false)<\/success>/);
            
            if (idMatch && successMatch && successMatch[1] === 'true') {
                const pedidoId = parseInt(idMatch[1]);
                console.log(`✅ Pedido SOAP creado exitosamente con ID: ${pedidoId}`);
                
                return {
                    success: true,
                    message: 'Pedido creado exitosamente en SOAP',
                    id_pedido: pedidoId,
                    service: 'SOAP'
                };
            } else {
                throw new Error('Respuesta SOAP inválida o error en la creación');
            }

        } catch (error) {
            console.error('❌ Error en SOAP crear_pedido:', error.message);
            return {
                success: false,
                message: `Error creando pedido: ${error.message}`
            };
        }
    }

    /**
     * Obtener información de un pedido
     */
    async obtenerPedido(id_pedido) {
        if (!this.soapClient) {
            return {
                success: false,
                message: 'Servicio SOAP no disponible'
            };
        }

        try {
            if (!id_pedido || isNaN(parseInt(id_pedido))) {
                return {
                    success: false,
                    message: 'ID de pedido inválido'
                };
            }

            const result = await this.soapClient.obtener_pedidoAsync({
                id_pedido: parseInt(id_pedido)
            });

            if (result && result[0]) {
                return {
                    success: result[0].exito === 1,
                    message: result[0].mensaje || 'Operación completada',
                    pedido: result[0].pedido || null
                };
            } else {
                return {
                    success: false,
                    message: 'Respuesta SOAP inválida'
                };
            }

        } catch (error) {
            console.error('❌ Error en SOAP obtener_pedido:', error.message);
            return {
                success: false,
                message: `Error obteniendo pedido: ${error.message}`
            };
        }
    }

    /**
     * Actualizar estado de un pedido
     */
    async actualizarEstadoPedido(id_pedido, nuevo_estado) {
        if (!this.soapClient) {
            return {
                success: false,
                message: 'Servicio SOAP no disponible'
            };
        }

        try {
            if (!id_pedido || isNaN(parseInt(id_pedido))) {
                return {
                    success: false,
                    message: 'ID de pedido inválido'
                };
            }

            if (!nuevo_estado || typeof nuevo_estado !== 'string') {
                return {
                    success: false,
                    message: 'Estado inválido'
                };
            }

            const result = await this.soapClient.actualizar_estado_pedidoAsync({
                id_pedido: parseInt(id_pedido),
                nuevo_estado: nuevo_estado.toUpperCase()
            });

            if (result && result[0]) {
                return {
                    success: result[0].exito === 1,
                    message: result[0].mensaje || 'Estado actualizado'
                };
            } else {
                return {
                    success: false,
                    message: 'Respuesta SOAP inválida'
                };
            }

        } catch (error) {
            console.error('❌ Error en SOAP actualizar_estado_pedido:', error.message);
            return {
                success: false,
                message: `Error actualizando estado: ${error.message}`
            };
        }
    }

    /**
     * Listar pedidos de un usuario
     */
    async listarPedidosUsuario(id_usuario) {
        if (!this.soapClient) {
            console.warn('⚠️  Cliente SOAP no disponible para listar pedidos');
            return [];
        }

        try {
            if (!id_usuario || isNaN(parseInt(id_usuario))) {
                console.warn('⚠️  ID de usuario inválido para listar pedidos');
                return [];
            }

            const result = await this.soapClient.listar_pedidos_usuarioAsync({
                id_usuario: parseInt(id_usuario)
            });

            return result && result[0] ? result[0] : [];

        } catch (error) {
            console.error('❌ Error en SOAP listar_pedidos_usuario:', error.message);
            return [];
        }
    }

    /**
     * Cancelar un pedido
     */
    async cancelarPedido(id_pedido) {
        if (!this.soapClient) {
            return {
                success: false,
                message: 'Servicio SOAP no disponible'
            };
        }

        try {
            if (!id_pedido || isNaN(parseInt(id_pedido))) {
                return {
                    success: false,
                    message: 'ID de pedido inválido'
                };
            }

            const result = await this.soapClient.cancelar_pedidoAsync({
                id_pedido: parseInt(id_pedido)
            });

            if (result && result[0]) {
                return {
                    success: result[0].exito === 1,
                    message: result[0].mensaje || 'Pedido cancelado'
                };
            } else {
                return {
                    success: false,
                    message: 'Respuesta SOAP inválida'
                };
            }

        } catch (error) {
            console.error('❌ Error en SOAP cancelar_pedido:', error.message);
            return {
                success: false,
                message: `Error cancelando pedido: ${error.message}`
            };
        }
    }

    /**
     * Verificar si el servicio SOAP está disponible
     */
    async verificarServicio() {
        try {
            if (!this.isServiceRunning) {
                await this.connectToSOAPService();
            }
            return this.isServiceRunning;
        } catch (error) {
            console.error('❌ Error verificando servicio SOAP:', error.message);
            return false;
        }
    }

    /**
     * Método para re-verificar manualmente el estado del servicio SOAP
     */
    async recheckSOAPService() {
        console.log('[SOAP] Re-verificando estado del servicio SOAP...');
        
        try {
            // Resetear el estado
            this.isAvailable = false;
            this.isLimitedMode = true;
            
            // Intentar conectar nuevamente
            const connected = await this.connectToSOAPService();
            
            if (connected) {
                this.isAvailable = true;
                this.isLimitedMode = false;
                console.log('[SOAP] ✓ Servicio SOAP verificado exitosamente - Modo completo activado');
                return true;
            } else {
                console.log('[SOAP] ✗ Servicio SOAP aún no disponible - Permanece en modo limitado');
                return false;
            }
            
        } catch (error) {
            console.error('[SOAP] Error en re-verificación:', error.message);
            this.isAvailable = false;
            this.isLimitedMode = true;
            return false;
        }
    }

    /**
     * Detener el servicio SOAP
     */
    async detenerServicio() {
        try {
            if (this.soapServerProcess) {
                console.log('🛑 Deteniendo servicio SOAP...');
                this.soapServerProcess.kill('SIGTERM');
                
                // Esperar un poco antes de forzar cierre
                setTimeout(() => {
                    if (this.soapServerProcess && !this.soapServerProcess.killed) {
                        console.log('🔨 Forzando cierre del servicio SOAP...');
                        this.soapServerProcess.kill('SIGKILL');
                    }
                }, 5000);
                
                this.soapServerProcess = null;
                this.isServiceRunning = false;
                this.soapClient = null;
                console.log('✅ Servicio SOAP detenido');
            }
        } catch (error) {
            console.error('❌ Error deteniendo servicio SOAP:', error.message);
        }
    }

    /**
     * Función auxiliar para pausar ejecución
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Crear rutas Express para el adaptador SOAP
function createSOAPRoutes(app, soapAdapter) {
    
    // Ruta para crear pedido
    app.post('/api/soap/pedidos', async (req, res) => {
        try {
            const result = await soapAdapter.crearPedido(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    // Ruta para obtener pedido
    app.get('/api/soap/pedidos/:id', async (req, res) => {
        try {
            const result = await soapAdapter.obtenerPedido(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    // Ruta para actualizar estado de pedido
    app.put('/api/soap/pedidos/:id/estado', async (req, res) => {
        try {
            const { nuevo_estado } = req.body;
            const result = await soapAdapter.actualizarEstadoPedido(req.params.id, nuevo_estado);
            res.json(result);
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    // Ruta para listar pedidos de usuario
    app.get('/api/soap/usuarios/:id/pedidos', async (req, res) => {
        try {
            const pedidos = await soapAdapter.listarPedidosUsuario(req.params.id);
            res.json({ success: true, pedidos });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    // Ruta para cancelar pedido
    app.delete('/api/soap/pedidos/:id', async (req, res) => {
        try {
            const result = await soapAdapter.cancelarPedido(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    // Ruta para verificar estado del servicio SOAP
    app.get('/api/soap/status', async (req, res) => {
        try {
            const isRunning = await soapAdapter.verificarServicio();
            res.json({ 
                success: true, 
                service_running: isRunning,
                message: isRunning ? 'Servicio SOAP disponible' : 'Servicio SOAP no disponible'
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    // Ruta para re-verificar y reconectar al servicio SOAP
    app.post('/api/soap/reconnect', async (req, res) => {
        try {
            console.log('📡 Solicitando re-verificación del servicio SOAP...');
            const reconnected = await soapAdapter.recheckSOAPService();
            
            res.json({ 
                success: true, 
                reconnected: reconnected,
                isAvailable: soapAdapter.isAvailable,
                isLimitedMode: soapAdapter.isLimitedMode,
                message: reconnected ? 
                    'Servicio SOAP reconectado exitosamente' : 
                    'Servicio SOAP aún no disponible'
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    console.log('📋 Rutas SOAP configuradas:');
    console.log('   POST   /api/soap/pedidos - Crear pedido');
    console.log('   GET    /api/soap/pedidos/:id - Obtener pedido');
    console.log('   PUT    /api/soap/pedidos/:id/estado - Actualizar estado');
    console.log('   GET    /api/soap/usuarios/:id/pedidos - Listar pedidos de usuario');
    console.log('   DELETE /api/soap/pedidos/:id - Cancelar pedido');
    console.log('   GET    /api/soap/status - Estado del servicio');
    console.log('   POST   /api/soap/reconnect - Re-verificar conexión SOAP');
}

module.exports = {
    SOAPAdapter,
    createSOAPRoutes
};
