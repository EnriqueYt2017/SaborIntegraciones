#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Servicio SOAP para gestión de pedidos usando Flask
Servicio simple basado en HTTP que puede procesar SOAP requests
"""

import logging
import oracledb
from datetime import datetime
import json
from flask import Flask, request, Response
import xml.etree.ElementTree as ET
from xml.dom import minidom
import sys
import os

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de la base de datos Oracle
DB_CONFIG = {
    'user': 'Base_Datos',
    'password': 'Base_Datos',
    'dsn': 'localhost:1521/XE'
}

app = Flask(__name__)

# Función para conectar a Oracle
def get_oracle_connection():
    try:
        return oracledb.connect(**DB_CONFIG)
    except Exception as e:
        logger.error(f"Error conectando a Oracle: {e}")
        raise

# Template de respuesta SOAP
SOAP_RESPONSE_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <{operation}Response xmlns="http://pedidos.sabor.com/">
            {content}
        </{operation}Response>
    </soap:Body>
</soap:Envelope>"""

SOAP_ERROR_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>Server</faultcode>
            <faultstring>{error}</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>"""

def create_soap_response(operation, content):
    """Crear respuesta SOAP"""
    return SOAP_RESPONSE_TEMPLATE.format(operation=operation, content=content)

def create_soap_error(error_message):
    """Crear respuesta de error SOAP"""
    return SOAP_ERROR_TEMPLATE.format(error=error_message)

def parse_soap_request(xml_content):
    """Parsear request SOAP para extraer operación y parámetros"""
    try:
        root = ET.fromstring(xml_content)
        
        # Encontrar el Body
        body = root.find('.//{http://schemas.xmlsoap.org/soap/envelope/}Body')
        if body is None:
            raise ValueError("No se encontró el Body en el SOAP request")
        
        # Encontrar la operación (primer elemento hijo del Body)
        operation_element = None
        for child in body:
            if child.tag.startswith('{'):
                # Extraer el nombre sin namespace
                operation_element = child
                break
        
        if operation_element is None:
            raise ValueError("No se encontró operación en el SOAP request")
        
        # Extraer nombre de la operación
        operation_name = operation_element.tag.split('}')[-1] if '}' in operation_element.tag else operation_element.tag
        
        # Extraer parámetros
        params = {}
        for param in operation_element:
            param_name = param.tag.split('}')[-1] if '}' in param.tag else param.tag
            params[param_name] = param.text
        
        return operation_name, params
        
    except Exception as e:
        logger.error(f"Error parseando SOAP request: {e}")
        raise

@app.route('/soap/pedidos', methods=['POST'])
def soap_pedidos():
    """Endpoint principal para el servicio SOAP de pedidos"""
    try:
        # Obtener contenido XML
        xml_content = request.get_data(as_text=True)
        logger.info(f"Recibido SOAP request: {xml_content[:200]}...")
        
        # Parsear request
        operation, params = parse_soap_request(xml_content)
        logger.info(f"Operación: {operation}, Parámetros: {params}")
        
        # Ejecutar operación correspondiente
        if operation == 'CrearPedido':
            result = crear_pedido_soap(params)
        elif operation == 'ObtenerPedido':
            result = obtener_pedido_soap(params)
        elif operation == 'ListarPedidos':
            result = listar_pedidos_soap(params)
        elif operation == 'ActualizarPedido':
            result = actualizar_pedido_soap(params)
        elif operation == 'EliminarPedido':
            result = eliminar_pedido_soap(params)
        else:
            raise ValueError(f"Operación no soportada: {operation}")
        
        # Crear respuesta SOAP
        response_xml = create_soap_response(operation, result)
        
        return Response(response_xml, content_type='text/xml; charset=utf-8')
        
    except Exception as e:
        logger.error(f"Error procesando SOAP request: {e}")
        error_response = create_soap_error(str(e))
        return Response(error_response, content_type='text/xml; charset=utf-8', status=500)

def crear_pedido_soap(params):
    """Crear un nuevo pedido"""
    try:
        usuario_id = params.get('usuario_id')
        total = params.get('total', '0')
        estado = params.get('estado', 'PENDIENTE')
        detalles = params.get('detalles', '[]')
        
        if not usuario_id:
            raise ValueError("usuario_id es requerido")
        
        conn = get_oracle_connection()
        cursor = conn.cursor()
        
        # Verificar que el usuario existe antes de crear el pedido
        cursor.execute("SELECT COUNT(*) FROM Usuarios WHERE rut = :rut", {'rut': int(usuario_id)})
        user_exists = cursor.fetchone()[0]
        
        if user_exists == 0:
            raise ValueError(f"Usuario con RUT {usuario_id} no existe en la base de datos")
        
        # Generar número de orden único
        import time
        numero_orden = f'soap-order-{int(time.time() * 1000)}'
        
        # Crear pedido usando la estructura real de la tabla
        pedido_id = cursor.var(int)
        cursor.execute("""
            INSERT INTO pedidos (id_pedido, numero_orden, rut, fecha_pedido, estado, total, observaciones)
            VALUES (PEDIDOS_SEQ.NEXTVAL, :numero_orden, :rut, SYSDATE, :estado, :total, :observaciones)
            RETURNING id_pedido INTO :pedido_id
        """, {
            'numero_orden': numero_orden,
            'rut': int(usuario_id),
            'estado': estado,
            'total': float(total),
            'observaciones': f'Pedido SOAP: {detalles}',
            'pedido_id': pedido_id
        })
        
        conn.commit()
        nuevo_pedido_id = pedido_id.getvalue()[0]
        
        logger.info(f"Pedido SOAP creado con ID: {nuevo_pedido_id}")
        
        return f"""
            <pedido_id>{nuevo_pedido_id}</pedido_id>
            <numero_orden>{numero_orden}</numero_orden>
            <success>true</success>
            <message>Pedido creado exitosamente</message>
        """
        
    except Exception as e:
        logger.error(f"Error creando pedido SOAP: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()

def obtener_pedido_soap(params):
    """Obtener un pedido por ID"""
    try:
        pedido_id = params.get('pedido_id')
        
        if not pedido_id:
            raise ValueError("pedido_id es requerido")
        
        conn = get_oracle_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id_pedido, numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones
            FROM pedidos
            WHERE id_pedido = :pedido_id
        """, {'pedido_id': int(pedido_id)})
        
        row = cursor.fetchone()
        
        if not row:
            raise ValueError(f"Pedido con ID {pedido_id} no encontrado")
        
        pedido = {
            'id_pedido': row[0],
            'numero_orden': row[1],
            'rut': row[2],
            'fecha_pedido': row[3].isoformat() if row[3] else None,
            'estado': row[4],
            'total': row[5],
            'direccion': row[6] or '',
            'observaciones': row[7] or ''
        }
        
        return f"""
            <pedido>
                <id_pedido>{pedido['id_pedido']}</id_pedido>
                <numero_orden>{pedido['numero_orden']}</numero_orden>
                <rut>{pedido['rut']}</rut>
                <fecha_pedido>{pedido['fecha_pedido']}</fecha_pedido>
                <estado>{pedido['estado']}</estado>
                <total>{pedido['total']}</total>
                <direccion>{pedido['direccion']}</direccion>
                <observaciones>{pedido['observaciones']}</observaciones>
            </pedido>
        """
        
    except Exception as e:
        logger.error(f"Error obteniendo pedido SOAP: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()

def listar_pedidos_soap(params):
    """Listar pedidos de un usuario"""
    try:
        usuario_id = params.get('usuario_id')
        
        if not usuario_id:
            raise ValueError("usuario_id es requerido")
        
        conn = get_oracle_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id_pedido, numero_orden, rut, fecha_pedido, estado, total, direccion, observaciones
            FROM pedidos
            WHERE rut = :usuario_id
            ORDER BY fecha_pedido DESC
        """, {'usuario_id': int(usuario_id)})
        
        rows = cursor.fetchall()
        
        pedidos_xml = ""
        for row in rows:
            pedidos_xml += f"""
                <pedido>
                    <id_pedido>{row[0]}</id_pedido>
                    <numero_orden>{row[1]}</numero_orden>
                    <rut>{row[2]}</rut>
                    <fecha_pedido>{row[3].isoformat() if row[3] else ''}</fecha_pedido>
                    <estado>{row[4]}</estado>
                    <total>{row[5]}</total>
                    <direccion>{row[6] or ''}</direccion>
                    <observaciones>{row[7] or ''}</observaciones>
                </pedido>
            """
        
        return f"""
            <pedidos>
                {pedidos_xml}
            </pedidos>
        """
        
    except Exception as e:
        logger.error(f"Error listando pedidos SOAP: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()

def actualizar_pedido_soap(params):
    """Actualizar un pedido"""
    try:
        pedido_id = params.get('pedido_id')
        estado = params.get('estado')
        total = params.get('total')
        
        if not pedido_id:
            raise ValueError("pedido_id es requerido")
        
        conn = get_oracle_connection()
        cursor = conn.cursor()
        
        # Construir query dinámicamente
        updates = []
        values = {'pedido_id': int(pedido_id)}
        
        if estado:
            updates.append("estado = :estado")
            values['estado'] = estado
        
        if total:
            updates.append("total = :total")
            values['total'] = float(total)
        
        if not updates:
            raise ValueError("No hay campos para actualizar")
        
        query = f"UPDATE pedidos SET {', '.join(updates)} WHERE id_pedido = :pedido_id"
        
        cursor.execute(query, values)
        conn.commit()
        
        if cursor.rowcount == 0:
            raise ValueError(f"Pedido con ID {pedido_id} no encontrado")
        
        return f"""
            <success>true</success>
            <message>Pedido actualizado exitosamente</message>
            <pedido_id>{pedido_id}</pedido_id>
        """
        
    except Exception as e:
        logger.error(f"Error actualizando pedido SOAP: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()

def eliminar_pedido_soap(params):
    """Eliminar un pedido"""
    try:
        pedido_id = params.get('pedido_id')
        
        if not pedido_id:
            raise ValueError("pedido_id es requerido")
        
        conn = get_oracle_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM pedidos WHERE id_pedido = :pedido_id", {'pedido_id': int(pedido_id)})
        conn.commit()
        
        if cursor.rowcount == 0:
            raise ValueError(f"Pedido con ID {pedido_id} no encontrado")
        
        return f"""
            <success>true</success>
            <message>Pedido eliminado exitosamente</message>
            <pedido_id>{pedido_id}</pedido_id>
        """
        
    except Exception as e:
        logger.error(f"Error eliminando pedido SOAP: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/soap/pedidos/wsdl', methods=['GET'])
def get_wsdl():
    """Endpoint para obtener el WSDL del servicio"""
    wsdl = """<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:tns="http://pedidos.sabor.com/"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema"
             targetNamespace="http://pedidos.sabor.com/">

    <types>
        <xsd:schema targetNamespace="http://pedidos.sabor.com/">
            <xsd:element name="CrearPedido">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="usuario_id" type="xsd:int"/>
                        <xsd:element name="total" type="xsd:decimal"/>
                        <xsd:element name="estado" type="xsd:string"/>
                        <xsd:element name="detalles" type="xsd:string"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            <xsd:element name="CrearPedidoResponse">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="pedido_id" type="xsd:int"/>
                        <xsd:element name="success" type="xsd:boolean"/>
                        <xsd:element name="message" type="xsd:string"/>
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
        </xsd:schema>
    </types>

    <message name="CrearPedidoRequest">
        <part name="parameters" element="tns:CrearPedido"/>
    </message>
    <message name="CrearPedidoResponse">
        <part name="parameters" element="tns:CrearPedidoResponse"/>
    </message>

    <portType name="PedidosPortType">
        <operation name="CrearPedido">
            <input message="tns:CrearPedidoRequest"/>
            <output message="tns:CrearPedidoResponse"/>
        </operation>
    </portType>

    <binding name="PedidosBinding" type="tns:PedidosPortType">
        <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
        <operation name="CrearPedido">
            <soap:operation soapAction="CrearPedido"/>
            <input>
                <soap:body use="literal"/>
            </input>
            <output>
                <soap:body use="literal"/>
            </output>
        </operation>
    </binding>

    <service name="PedidosService">
        <port name="PedidosPort" binding="tns:PedidosBinding">
            <soap:address location="http://localhost:8001/soap/pedidos"/>
        </port>
    </service>
</definitions>"""
    
    return Response(wsdl, content_type='text/xml; charset=utf-8')

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Probar conexión a la base de datos
        conn = get_oracle_connection()
        conn.close()
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now().isoformat()}, 500

@app.route('/test-users', methods=['GET'])
def get_test_users():
    """Get some valid user RUTs for testing"""
    try:
        conn = get_oracle_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT rut, primer_nombre FROM Usuarios WHERE ROWNUM <= 5")
        users = cursor.fetchall()
        conn.close()
        
        return {
            "users": [{"rut": user[0], "nombre": user[1]} for user in users],
            "message": "Use any of these RUTs for testing SOAP orders"
        }
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == '__main__':
    try:
        logger.info("Iniciando servicio SOAP de pedidos en puerto 8001...")
        app.run(host='0.0.0.0', port=8001, debug=True)
    except Exception as e:
        logger.error(f"Error iniciando servicio: {e}")
        sys.exit(1)
