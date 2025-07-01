#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script temporal para verificar la estructura de la tabla pedidos
"""

import oracledb

# Configuración de la base de datos Oracle
DB_CONFIG = {
    'user': 'Base_Datos',
    'password': 'Base_Datos',
    'dsn': 'localhost:1521/XE'
}

def get_table_structure():
    try:
        conn = oracledb.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Obtener estructura de la tabla pedidos
        cursor.execute("""
            SELECT column_name, data_type, nullable
            FROM all_tab_columns 
            WHERE table_name = 'PEDIDOS' 
            AND owner = 'BASE_DATOS'
            ORDER BY column_id
        """)
        
        columns = cursor.fetchall()
        
        print("Estructura de la tabla PEDIDOS:")
        print("-" * 50)
        for col in columns:
            print(f"Columna: {col[0]}, Tipo: {col[1]}, Nullable: {col[2]}")
        
        # También obtener algunos registros de ejemplo
        print("\n" + "=" * 50)
        print("Registros de ejemplo:")
        print("=" * 50)
        
        cursor.execute("SELECT * FROM pedidos WHERE ROWNUM <= 3")
        rows = cursor.fetchall()
        
        if rows:
            for i, row in enumerate(rows):
                print(f"Registro {i+1}: {row}")
        else:
            print("No hay registros en la tabla pedidos")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    get_table_structure()
