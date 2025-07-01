from zeep import Client
from zeep.transports import Transport
import requests
from datetime import datetime
import json

class SOAPPedidosClient:
    """Cliente SOAP para consumir el servicio de pedidos"""
    
    def __init__(self, soap_url="http://localhost:8001?wsdl"):
        """
        Inicializar cliente SOAP
        
        Args:
            soap_url: URL del servicio SOAP (incluyendo ?wsdl)
        """
        self.soap_url = soap_url
        self.client = None
        self._connect()
    
    def _connect(self):
        """Conectar al servicio SOAP"""
        try:
            # Configurar transporte con timeout
            transport = Transport(timeout=30)
            self.client = Client(self.soap_url, transport=transport)
            print(f"Conectado al servicio SOAP: {self.soap_url}")
        except Exception as e:
            print(f"Error conectando al servicio SOAP: {e}")
            self.client = None
    
    def crear_pedido(self, id_usuario, direccion_entrega, telefono, email, metodo_pago, productos):
        """
        Crear un nuevo pedido a través del servicio SOAP
        
        Args:
            id_usuario: ID del usuario
            direccion_entrega: Dirección de entrega
            telefono: Teléfono de contacto
            email: Email de contacto
            metodo_pago: Método de pago
            productos: Lista de productos [{'id_producto': int, 'nombre': str, 'precio': float, 'cantidad': int}]
            
        Returns:
            dict: Respuesta del servicio SOAP
        """
        if not self.client:
            return {"exito": 0, "mensaje": "Cliente SOAP no conectado"}
        
        try:
            # Preparar productos para SOAP
            productos_soap = []
            for prod in productos:
                producto_soap = {
                    'id_producto': prod['id_producto'],
                    'nombre': prod['nombre'],
                    'precio': prod['precio'],
                    'cantidad': prod['cantidad'],
                    'subtotal': prod['precio'] * prod['cantidad']
                }
                productos_soap.append(producto_soap)
            
            # Llamar al servicio SOAP
            response = self.client.service.crear_pedido(
                id_usuario=id_usuario,
                direccion_entrega=direccion_entrega,
                telefono=telefono,
                email=email,
                metodo_pago=metodo_pago,
                productos=productos_soap
            )
            
            return {
                "exito": response.exito,
                "mensaje": response.mensaje,
                "id_pedido": response.id_pedido,
                "pedido": self._format_pedido(response.pedido) if response.pedido else None
            }
            
        except Exception as e:
            return {"exito": 0, "mensaje": f"Error al crear pedido: {str(e)}"}
    
    def obtener_pedido(self, id_pedido):
        """
        Obtener información de un pedido específico
        
        Args:
            id_pedido: ID del pedido
            
        Returns:
            dict: Información del pedido
        """
        if not self.client:
            return {"exito": 0, "mensaje": "Cliente SOAP no conectado"}
        
        try:
            response = self.client.service.obtener_pedido(id_pedido=id_pedido)
            
            return {
                "exito": response.exito,
                "mensaje": response.mensaje,
                "id_pedido": response.id_pedido,
                "pedido": self._format_pedido(response.pedido) if response.pedido else None
            }
            
        except Exception as e:
            return {"exito": 0, "mensaje": f"Error al obtener pedido: {str(e)}"}
    
    def actualizar_estado_pedido(self, id_pedido, nuevo_estado):
        """
        Actualizar el estado de un pedido
        
        Args:
            id_pedido: ID del pedido
            nuevo_estado: Nuevo estado del pedido
            
        Returns:
            dict: Respuesta del servicio
        """
        if not self.client:
            return {"exito": 0, "mensaje": "Cliente SOAP no conectado"}
        
        try:
            response = self.client.service.actualizar_estado_pedido(
                id_pedido=id_pedido,
                nuevo_estado=nuevo_estado
            )
            
            return {
                "exito": response.exito,
                "mensaje": response.mensaje,
                "id_pedido": response.id_pedido
            }
            
        except Exception as e:
            return {"exito": 0, "mensaje": f"Error al actualizar estado: {str(e)}"}
    
    def listar_pedidos_usuario(self, id_usuario):
        """
        Listar todos los pedidos de un usuario
        
        Args:
            id_usuario: ID del usuario
            
        Returns:
            list: Lista de pedidos del usuario
        """
        if not self.client:
            return []
        
        try:
            response = self.client.service.listar_pedidos_usuario(id_usuario=id_usuario)
            
            pedidos = []
            for pedido_soap in response:
                pedidos.append(self._format_pedido(pedido_soap))
            
            return pedidos
            
        except Exception as e:
            print(f"Error al listar pedidos: {str(e)}")
            return []
    
    def cancelar_pedido(self, id_pedido):
        """
        Cancelar un pedido
        
        Args:
            id_pedido: ID del pedido a cancelar
            
        Returns:
            dict: Respuesta del servicio
        """
        if not self.client:
            return {"exito": 0, "mensaje": "Cliente SOAP no conectado"}
        
        try:
            response = self.client.service.cancelar_pedido(id_pedido=id_pedido)
            
            return {
                "exito": response.exito,
                "mensaje": response.mensaje,
                "id_pedido": response.id_pedido
            }
            
        except Exception as e:
            return {"exito": 0, "mensaje": f"Error al cancelar pedido: {str(e)}"}
    
    def _format_pedido(self, pedido_soap):
        """
        Formatear un objeto pedido de SOAP a diccionario Python
        
        Args:
            pedido_soap: Objeto pedido del servicio SOAP
            
        Returns:
            dict: Pedido formateado
        """
        if not pedido_soap:
            return None
        
        productos = []
        if hasattr(pedido_soap, 'productos') and pedido_soap.productos:
            for prod in pedido_soap.productos:
                productos.append({
                    'id_producto': prod.id_producto,
                    'nombre': prod.nombre,
                    'precio': float(prod.precio),
                    'cantidad': prod.cantidad,
                    'subtotal': float(prod.subtotal)
                })
        
        return {
            'id_pedido': pedido_soap.id_pedido,
            'id_usuario': pedido_soap.id_usuario,
            'fecha_pedido': pedido_soap.fecha_pedido.isoformat() if pedido_soap.fecha_pedido else None,
            'estado': pedido_soap.estado,
            'total': float(pedido_soap.total),
            'direccion_entrega': pedido_soap.direccion_entrega,
            'telefono': pedido_soap.telefono,
            'email': pedido_soap.email,
            'productos': productos
        }
    
    def ping(self):
        """
        Verificar si el servicio SOAP está disponible
        
        Returns:
            bool: True si el servicio está disponible, False en caso contrario
        """
        try:
            # Intentar obtener el WSDL
            response = requests.get(self.soap_url, timeout=5)
            return response.status_code == 200
        except:
            return False


def test_soap_client():
    """Función de prueba para el cliente SOAP"""
    client = SOAPPedidosClient()
    
    if not client.ping():
        print("❌ Servicio SOAP no disponible")
        return
    
    print("✅ Servicio SOAP disponible")
    
    # Datos de prueba
    productos_test = [
        {
            'id_producto': 1,
            'nombre': 'Producto Test 1',
            'precio': 15.99,
            'cantidad': 2
        },
        {
            'id_producto': 2,
            'nombre': 'Producto Test 2',
            'precio': 25.50,
            'cantidad': 1
        }
    ]
    
    # Probar crear pedido
    print("\n🔄 Probando crear pedido...")
    resultado = client.crear_pedido(
        id_usuario=1,
        direccion_entrega="Calle Test 123",
        telefono="+56912345678",
        email="test@test.com",
        metodo_pago="WEBPAY",
        productos=productos_test
    )
    
    if resultado['exito']:
        print(f"✅ Pedido creado exitosamente. ID: {resultado['id_pedido']}")
        
        # Probar obtener pedido
        print("\n🔄 Probando obtener pedido...")
        pedido = client.obtener_pedido(resultado['id_pedido'])
        if pedido['exito']:
            print("✅ Pedido obtenido exitosamente")
            print(f"   Estado: {pedido['pedido']['estado']}")
            print(f"   Total: ${pedido['pedido']['total']}")
        else:
            print(f"❌ Error al obtener pedido: {pedido['mensaje']}")
        
        # Probar actualizar estado
        print("\n🔄 Probando actualizar estado...")
        actualizacion = client.actualizar_estado_pedido(resultado['id_pedido'], "CONFIRMADO")
        if actualizacion['exito']:
            print("✅ Estado actualizado exitosamente")
        else:
            print(f"❌ Error al actualizar estado: {actualizacion['mensaje']}")
            
    else:
        print(f"❌ Error al crear pedido: {resultado['mensaje']}")
    
    # Probar listar pedidos
    print("\n🔄 Probando listar pedidos de usuario...")
    pedidos = client.listar_pedidos_usuario(1)
    print(f"✅ Encontrados {len(pedidos)} pedidos para el usuario")


if __name__ == '__main__':
    test_soap_client()
