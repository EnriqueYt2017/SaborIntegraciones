import requests
import json
import time
from datetime import datetime

class TestIntegracionSOAP:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.soap_url = "http://localhost:8001"
        
    def print_separator(self, title):
        print("\n" + "="*60)
        print(f" {title}")
        print("="*60)
        
    def test_connection(self):
        """Probar conexión básica al servidor"""
        self.print_separator("PRUEBA 1: Conexión al Servidor")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code == 200:
                print("✅ Servidor principal: CONECTADO")
            else:
                print(f"⚠️  Servidor principal: {response.status_code}")
        except Exception as e:
            print(f"❌ Servidor principal: ERROR - {e}")
            
        try:
            response = requests.get(f"{self.soap_url}?wsdl", timeout=5)
            if response.status_code == 200:
                print("✅ Servicio SOAP: CONECTADO")
            else:
                print(f"⚠️  Servicio SOAP: {response.status_code}")
        except Exception as e:
            print(f"❌ Servicio SOAP: ERROR - {e}")
    
    def test_soap_status(self):
        """Probar estado del servicio SOAP"""
        self.print_separator("PRUEBA 2: Estado del Servicio SOAP")
        
        try:
            response = requests.get(f"{self.base_url}/api/soap/status")
            data = response.json()
            
            if data.get("success"):
                status = "ONLINE" if data.get("service_running") else "OFFLINE"
                print(f"✅ Estado SOAP: {status}")
                print(f"   Mensaje: {data.get('message')}")
            else:
                print(f"❌ Error: {data.get('message')}")
                
        except Exception as e:
            print(f"❌ Error verificando estado SOAP: {e}")
    
    def test_crear_pedido_soap(self):
        """Probar creación de pedido via SOAP"""
        self.print_separator("PRUEBA 3: Crear Pedido SOAP")
        
        pedido_test = {
            "id_usuario": 12345678,
            "direccion_entrega": "Calle de Prueba 123, Santiago",
            "telefono": "+56912345678",
            "email": "test@ejemplo.com",
            "metodo_pago": "WEBPAY",
            "productos": [
                {
                    "id_producto": 1,
                    "nombre": "Producto Test 1",
                    "precio": 15990,
                    "cantidad": 2
                },
                {
                    "id_producto": 2,
                    "nombre": "Producto Test 2",
                    "precio": 8990,
                    "cantidad": 1
                }
            ]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/soap/pedidos",
                json=pedido_test,
                headers={"Content-Type": "application/json"}
            )
            
            data = response.json()
            
            if data.get("success"):
                print("✅ Pedido SOAP creado exitosamente")
                print(f"   ID Pedido: {data.get('id_pedido')}")
                print(f"   Mensaje: {data.get('message')}")
                return data.get('id_pedido')
            else:
                print(f"❌ Error creando pedido: {data.get('message')}")
                return None
                
        except Exception as e:
            print(f"❌ Error en prueba de creación: {e}")
            return None
    
    def test_obtener_pedido_soap(self, id_pedido):
        """Probar obtención de pedido SOAP"""
        if not id_pedido:
            print("⚠️  Saltando prueba - No hay ID de pedido")
            return
            
        self.print_separator("PRUEBA 4: Obtener Pedido SOAP")
        
        try:
            response = requests.get(f"{self.base_url}/api/soap/pedidos/{id_pedido}")
            data = response.json()
            
            if data.get("success"):
                pedido = data.get("pedido")
                print("✅ Pedido obtenido exitosamente")
                print(f"   ID: {pedido.get('id_pedido')}")
                print(f"   Estado: {pedido.get('estado')}")
                print(f"   Total: ${pedido.get('total'):,.0f}")
                print(f"   Productos: {len(pedido.get('productos', []))}")
            else:
                print(f"❌ Error obteniendo pedido: {data.get('message')}")
                
        except Exception as e:
            print(f"❌ Error en prueba de obtención: {e}")
    
    def test_actualizar_estado_soap(self, id_pedido):
        """Probar actualización de estado SOAP"""
        if not id_pedido:
            print("⚠️  Saltando prueba - No hay ID de pedido")
            return
            
        self.print_separator("PRUEBA 5: Actualizar Estado SOAP")
        
        try:
            response = requests.put(
                f"{self.base_url}/api/soap/pedidos/{id_pedido}/estado",
                json={"nuevo_estado": "CONFIRMADO"},
                headers={"Content-Type": "application/json"}
            )
            
            data = response.json()
            
            if data.get("success"):
                print("✅ Estado actualizado exitosamente")
                print(f"   Mensaje: {data.get('message')}")
            else:
                print(f"❌ Error actualizando estado: {data.get('message')}")
                
        except Exception as e:
            print(f"❌ Error en prueba de actualización: {e}")
    
    def test_pedidos_unificados(self):
        """Probar vista unificada de pedidos"""
        self.print_separator("PRUEBA 6: Pedidos Unificados")
        
        usuario_test = 12345678
        
        try:
            response = requests.get(f"{self.base_url}/api/pedidos-unificados/{usuario_test}")
            data = response.json()
            
            if data.get("success"):
                print("✅ Pedidos unificados obtenidos exitosamente")
                print(f"   Total pedidos: {data.get('total_pedidos')}")
                print(f"   Tradicionales: {data.get('tradicionales')}")
                print(f"   SOAP: {data.get('soap')}")
                
                # Mostrar algunos pedidos
                pedidos = data.get('pedidos', [])[:3]  # Primeros 3
                for i, pedido in enumerate(pedidos, 1):
                    print(f"   Pedido {i}: {pedido.get('numero_orden')} ({pedido.get('tipo')}) - {pedido.get('estado')}")
            else:
                print(f"❌ Error obteniendo pedidos unificados: {data.get('message')}")
                
        except Exception as e:
            print(f"❌ Error en prueba de pedidos unificados: {e}")
    
    def test_sincronizacion(self):
        """Probar sincronización de pedidos"""
        self.print_separator("PRUEBA 7: Sincronización SOAP")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/sincronizar-pedidos-soap",
                headers={"Content-Type": "application/json"}
            )
            
            data = response.json()
            
            if data.get("success"):
                print("✅ Sincronización completada")
                print(f"   Sincronizados: {data.get('sincronizados')}")
                print(f"   Errores: {data.get('errores')}")
                
                if data.get('errores') > 0:
                    errores = data.get('detalles', {}).get('errores', [])[:3]
                    print("   Primeros errores:")
                    for error in errores:
                        print(f"     - {error.get('numero_orden')}: {error.get('error')}")
                        
            else:
                print(f"❌ Error en sincronización: {data.get('message')}")
                
        except Exception as e:
            print(f"❌ Error en prueba de sincronización: {e}")
    
    def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        print(f"🧪 INICIANDO PRUEBAS DE INTEGRACIÓN SOAP")
        print(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Pruebas básicas
        self.test_connection()
        self.test_soap_status()
        
        # Pruebas de funcionalidad SOAP
        id_pedido = self.test_crear_pedido_soap()
        
        if id_pedido:
            time.sleep(1)  # Esperar un poco entre pruebas
            self.test_obtener_pedido_soap(id_pedido)
            time.sleep(1)
            self.test_actualizar_estado_soap(id_pedido)
        
        # Pruebas de integración
        self.test_pedidos_unificados()
        self.test_sincronizacion()
        
        self.print_separator("PRUEBAS COMPLETADAS")
        print("📊 Revisa los resultados anteriores para verificar el estado del sistema")
        print("🔧 Si hay errores, verifica:")
        print("   - Que el servidor esté corriendo (node server.js)")
        print("   - Que la base de datos Oracle esté disponible")
        print("   - Que las dependencias Python estén instaladas")
        print("   - Que el puerto 8001 esté disponible para SOAP")

def main():
    tester = TestIntegracionSOAP()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
