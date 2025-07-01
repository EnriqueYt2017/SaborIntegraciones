#!/usr/bin/env python3
import oracledb

conn = oracledb.connect(user='Base_Datos', password='Base_Datos', dsn='localhost:1521/XE')
cursor = conn.cursor()

# Verificar sequences
cursor.execute("SELECT sequence_name FROM all_sequences WHERE sequence_owner = 'BASE_DATOS'")
sequences = cursor.fetchall()
print('Sequences disponibles:')
for seq in sequences:
    print(f'  - {seq[0]}')

# Verificar triggers
cursor.execute("SELECT trigger_name, table_name FROM all_triggers WHERE owner = 'BASE_DATOS' AND table_name = 'PEDIDOS'")
triggers = cursor.fetchall()
print('\nTriggers en la tabla PEDIDOS:')
for trigger in triggers:
    print(f'  - {trigger[0]} en {trigger[1]}')

conn.close()
