from spyne import Application, rpc, ServiceBase, Integer, Unicode, ComplexModel, Array, Decimal, DateTime
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
from wsgiref.simple_server import make_server
import cx_Oracle
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos Oracle
DB_CONFIG = {
    'user': os.getenv('DB_USER', 'ADMIN'),
    'password': os.getenv('DB_PASSWORD', 'Saborcito123'),
    'dsn': os.getenv('DB_DSN', 'localhost:1521/XE')
}

# Modelos de datos para SOAP
class Producto(ComplexModel):
    id_producto = Integer
    nombre = Unicode
    precio = Decimal
    cantidad = Integer
    subtotal = Decimal

class Pedido(ComplexModel):
    id_pedido = Integer
    id_usuario = Integer
    fecha_pedido = DateTime
    estado = Unicode
    total = Decimal
    direccion_entrega = Unicode
    telefono = Unicode
    email = Unicode
    productos = Array(Producto)

class RespuestaPedido(ComplexModel):
    exito = Integer  # 1 para éxito, 0 para error
    mensaje = Unicode
    id_pedido = Integer
    pedido = Pedido

class ServicioPedidos(ServiceBase):
    """Servicio SOAP para gestión de pedidos"""
    
    def _get_db_connection(self):
        """Obtener conexión a la base de datos Oracle"""
        try:
            connection = cx_Oracle.connect(
                user=DB_CONFIG['user'],
                password=DB_CONFIG['password'],
                dsn=DB_CONFIG['dsn']
            )
            return connection
        except Exception as e:
            print(f"Error conectando a la base de datos: {e}")
            return None
    
    @rpc(Integer, Unicode, Unicode, Unicode, Unicode, Array(Producto), _returns=RespuestaPedido)
    def crear_pedido(ctx, self, id_usuario, direccion_entrega, telefono, email, metodo_pago, productos):
        """
        Crear un nuevo pedido
        
        Args:
            id_usuario: ID del usuario
            direccion_entrega: Dirección de entrega
            telefono: Teléfono de contacto
            email: Email de contacto
            metodo_pago: Método de pago
            productos: Lista de productos
            
        Returns:
            RespuestaPedido: Respuesta con el resultado de la operación
        """
        connection = self._get_db_connection()
        if not connection:
            return RespuestaPedido(
                exito=0,
                mensaje="Error de conexión a la base de datos",
                id_pedido=None,
                pedido=None
            )
        
        try:
            cursor = connection.cursor()
            
            # Calcular total del pedido
            total = sum(float(p.precio) * int(p.cantidad) for p in productos)
            
            # Obtener el siguiente ID de pedido
            cursor.execute("SELECT seq_pedidos.NEXTVAL FROM dual")
            id_pedido = cursor.fetchone()[0]
            
            # Insertar pedido principal
            fecha_actual = datetime.now()
            
            insert_pedido_sql = """
                INSERT INTO pedidos (
                    id_pedido, id_usuario, fecha_pedido, estado, total,
                    direccion_entrega, telefono, email, metodo_pago
                ) VALUES (
                    :id_pedido, :id_usuario, :fecha_pedido, :estado, :total,
                    :direccion_entrega, :telefono, :email, :metodo_pago
                )
            """
            
            cursor.execute(insert_pedido_sql, {
                'id_pedido': id_pedido,
                'id_usuario': id_usuario,
                'fecha_pedido': fecha_actual,
                'estado': 'PENDIENTE',
                'total': total,
                'direccion_entrega': direccion_entrega,
                'telefono': telefono,
                'email': email,
                'metodo_pago': metodo_pago
            })
            
            # Insertar detalles del pedido
            for producto in productos:
                # Verificar stock disponible
                cursor.execute(
                    "SELECT stock FROM productos WHERE id_producto = :id",
                    {'id': producto.id_producto}
                )
                result = cursor.fetchone()
                
                if not result:
                    connection.rollback()
                    return RespuestaPedido(
                        exito=0,
                        mensaje=f"Producto {producto.id_producto} no encontrado",
                        id_pedido=None,
                        pedido=None
                    )
                
                stock_disponible = result[0]
                if stock_disponible < producto.cantidad:
                    connection.rollback()
                    return RespuestaPedido(
                        exito=0,
                        mensaje=f"Stock insuficiente para producto {producto.nombre}. Disponible: {stock_disponible}",
                        id_pedido=None,
                        pedido=None
                    )
                
                # Insertar detalle del pedido
                insert_detalle_sql = """
                    INSERT INTO detalle_pedidos (
                        id_pedido, id_producto, cantidad, precio_unitario, subtotal
                    ) VALUES (
                        :id_pedido, :id_producto, :cantidad, :precio_unitario, :subtotal
                    )
                """
                
                cursor.execute(insert_detalle_sql, {
                    'id_pedido': id_pedido,
                    'id_producto': producto.id_producto,
                    'cantidad': producto.cantidad,
                    'precio_unitario': producto.precio,
                    'subtotal': float(producto.precio) * int(producto.cantidad)
                })
                
                # Actualizar stock
                cursor.execute(
                    "UPDATE productos SET stock = stock - :cantidad WHERE id_producto = :id",
                    {'cantidad': producto.cantidad, 'id': producto.id_producto}
                )
            
            connection.commit()
            
            # Crear objeto pedido para respuesta
            pedido_respuesta = Pedido(
                id_pedido=id_pedido,
                id_usuario=id_usuario,
                fecha_pedido=fecha_actual,
                estado='PENDIENTE',
                total=total,
                direccion_entrega=direccion_entrega,
                telefono=telefono,
                email=email,
                productos=productos
            )
            
            return RespuestaPedido(
                exito=1,
                mensaje="Pedido creado exitosamente",
                id_pedido=id_pedido,
                pedido=pedido_respuesta
            )
            
        except Exception as e:
            if connection:
                connection.rollback()
            return RespuestaPedido(
                exito=0,
                mensaje=f"Error al crear pedido: {str(e)}",
                id_pedido=None,
                pedido=None
            )
        finally:
            if connection:
                cursor.close()
                connection.close()
    
    @rpc(Integer, _returns=RespuestaPedido)
    def obtener_pedido(ctx, self, id_pedido):
        """
        Obtener información de un pedido específico
        
        Args:
            id_pedido: ID del pedido
            
        Returns:
            RespuestaPedido: Información del pedido
        """
        connection = self._get_db_connection()
        if not connection:
            return RespuestaPedido(
                exito=0,
                mensaje="Error de conexión a la base de datos",
                id_pedido=None,
                pedido=None
            )
        
        try:
            cursor = connection.cursor()
            
            # Obtener información del pedido
            pedido_sql = """
                SELECT id_pedido, id_usuario, fecha_pedido, estado, total,
                       direccion_entrega, telefono, email
                FROM pedidos 
                WHERE id_pedido = :id_pedido
            """
            
            cursor.execute(pedido_sql, {'id_pedido': id_pedido})
            pedido_data = cursor.fetchone()
            
            if not pedido_data:
                return RespuestaPedido(
                    exito=0,
                    mensaje="Pedido no encontrado",
                    id_pedido=None,
                    pedido=None
                )
            
            # Obtener productos del pedido
            productos_sql = """
                SELECT p.id_producto, p.nombre, dp.precio_unitario, dp.cantidad, dp.subtotal
                FROM detalle_pedidos dp
                JOIN productos p ON dp.id_producto = p.id_producto
                WHERE dp.id_pedido = :id_pedido
            """
            
            cursor.execute(productos_sql, {'id_pedido': id_pedido})
            productos_data = cursor.fetchall()
            
            productos = []
            for prod_data in productos_data:
                producto = Producto(
                    id_producto=prod_data[0],
                    nombre=prod_data[1],
                    precio=prod_data[2],
                    cantidad=prod_data[3],
                    subtotal=prod_data[4]
                )
                productos.append(producto)
            
            # Crear objeto pedido
            pedido = Pedido(
                id_pedido=pedido_data[0],
                id_usuario=pedido_data[1],
                fecha_pedido=pedido_data[2],
                estado=pedido_data[3],
                total=pedido_data[4],
                direccion_entrega=pedido_data[5],
                telefono=pedido_data[6],
                email=pedido_data[7],
                productos=productos
            )
            
            return RespuestaPedido(
                exito=1,
                mensaje="Pedido encontrado",
                id_pedido=id_pedido,
                pedido=pedido
            )
            
        except Exception as e:
            return RespuestaPedido(
                exito=0,
                mensaje=f"Error al obtener pedido: {str(e)}",
                id_pedido=None,
                pedido=None
            )
        finally:
            if connection:
                cursor.close()
                connection.close()
    
    @rpc(Integer, _returns=Array(RespuestaPedido))
    def listar_pedidos_usuario(ctx, self, id_usuario):
        """
        Listar todos los pedidos de un usuario
        
        Args:
            id_usuario: ID del usuario
            
        Returns:
            Array[RespuestaPedido]: Lista de pedidos del usuario
        """
        connection = self._get_db_connection()
        if not connection:
            return [RespuestaPedido(
                exito=0,
                mensaje="Error de conexión a la base de datos",
                id_pedido=None,
                pedido=None
            )]
        
        try:
            cursor = connection.cursor()
            
            # Obtener pedidos del usuario
            pedidos_sql = """
                SELECT id_pedido, id_usuario, fecha_pedido, estado, total,
                       direccion_entrega, telefono, email
                FROM pedidos 
                WHERE id_usuario = :id_usuario
                ORDER BY fecha_pedido DESC
            """
            
            cursor.execute(pedidos_sql, {'id_usuario': id_usuario})
            pedidos_data = cursor.fetchall()
            
            respuestas = []
            
            for pedido_data in pedidos_data:
                # Obtener productos de cada pedido
                productos_sql = """
                    SELECT p.id_producto, p.nombre, dp.precio_unitario, dp.cantidad, dp.subtotal
                    FROM detalle_pedidos dp
                    JOIN productos p ON dp.id_producto = p.id_producto
                    WHERE dp.id_pedido = :id_pedido
                """
                
                cursor.execute(productos_sql, {'id_pedido': pedido_data[0]})
                productos_data = cursor.fetchall()
                
                productos = []
                for prod_data in productos_data:
                    producto = Producto(
                        id_producto=prod_data[0],
                        nombre=prod_data[1],
                        precio=prod_data[2],
                        cantidad=prod_data[3],
                        subtotal=prod_data[4]
                    )
                    productos.append(producto)
                
                # Crear objeto pedido
                pedido = Pedido(
                    id_pedido=pedido_data[0],
                    id_usuario=pedido_data[1],
                    fecha_pedido=pedido_data[2],
                    estado=pedido_data[3],
                    total=pedido_data[4],
                    direccion_entrega=pedido_data[5],
                    telefono=pedido_data[6],
                    email=pedido_data[7],
                    productos=productos
                )
                
                respuestas.append(RespuestaPedido(
                    exito=1,
                    mensaje="Pedido encontrado",
                    id_pedido=pedido_data[0],
                    pedido=pedido
                ))
            
            return respuestas
            
        except Exception as e:
            return [RespuestaPedido(
                exito=0,
                mensaje=f"Error al listar pedidos: {str(e)}",
                id_pedido=None,
                pedido=None
            )]
        finally:
            if connection:
                cursor.close()
                connection.close()
    
    @rpc(Integer, Unicode, _returns=RespuestaPedido)
    def actualizar_estado_pedido(ctx, self, id_pedido, nuevo_estado):
        """
        Actualizar el estado de un pedido
        
        Args:
            id_pedido: ID del pedido
            nuevo_estado: Nuevo estado del pedido
            
        Returns:
            RespuestaPedido: Resultado de la operación
        """
        connection = self._get_db_connection()
        if not connection:
            return RespuestaPedido(
                exito=0,
                mensaje="Error de conexión a la base de datos",
                id_pedido=None,
                pedido=None
            )
        
        try:
            cursor = connection.cursor()
            
            # Verificar que el pedido existe
            cursor.execute(
                "SELECT COUNT(*) FROM pedidos WHERE id_pedido = :id_pedido",
                {'id_pedido': id_pedido}
            )
            
            if cursor.fetchone()[0] == 0:
                return RespuestaPedido(
                    exito=0,
                    mensaje="Pedido no encontrado",
                    id_pedido=None,
                    pedido=None
                )
            
            # Actualizar estado
            cursor.execute(
                "UPDATE pedidos SET estado = :estado WHERE id_pedido = :id_pedido",
                {'estado': nuevo_estado, 'id_pedido': id_pedido}
            )
            
            connection.commit()
            
            return RespuestaPedido(
                exito=1,
                mensaje=f"Estado del pedido actualizado a {nuevo_estado}",
                id_pedido=id_pedido,
                pedido=None
            )
            
        except Exception as e:
            if connection:
                connection.rollback()
            return RespuestaPedido(
                exito=0,
                mensaje=f"Error al actualizar estado: {str(e)}",
                id_pedido=None,
                pedido=None
            )
        finally:
            if connection:
                cursor.close()
                connection.close()

# Configuración de la aplicación SOAP
application = Application(
    [ServicioPedidos],
    'soap.pedidos.service',
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11()
)

def create_soap_app():
    """Crear aplicación WSGI para SOAP"""
    return WsgiApplication(application)

def run_soap_server(host='localhost', port=8001):
    """Ejecutar servidor SOAP independiente"""
    wsgi_app = create_soap_app()
    server = make_server(host, port, wsgi_app)
    
    print(f"Servidor SOAP iniciado en http://{host}:{port}")
    print(f"WSDL disponible en: http://{host}:{port}?wsdl")
    print("Presiona Ctrl+C para detener el servidor...")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor SOAP detenido")

if __name__ == '__main__':
    run_soap_server()
