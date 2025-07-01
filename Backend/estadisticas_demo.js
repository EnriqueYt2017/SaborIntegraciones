// Datos de demostración para el dashboard de estadísticas
module.exports = {
  resumen: {
    ingresos_totales: 1250000,
    total_ventas: 156,
    total_usuarios: 89,
    total_productos: 45
  },
  ingresos_totales: 1250000,
  total_pedidos: 156,
  productos_mas_vendidos: [
    { nombre: "Hamburguesa Premium", total_vendido: 45, ingresos: 315000 },
    { nombre: "Pizza Margarita", total_vendido: 38, ingresos: 266000 },
    { nombre: "Pasta Carbonara", total_vendido: 32, ingresos: 224000 },
    { nombre: "Ensalada César", total_vendido: 28, ingresos: 196000 },
    { nombre: "Sándwich Club", total_vendido: 25, ingresos: 175000 }
  ],
  usuarios_activos: 67,
  pedidos_por_mes: [
    { mes: 7, cantidad_pedidos: 18, total_ingresos: 126000 },
    { mes: 8, cantidad_pedidos: 22, total_ingresos: 154000 },
    { mes: 9, cantidad_pedidos: 25, total_ingresos: 175000 },
    { mes: 10, cantidad_pedidos: 28, total_ingresos: 196000 },
    { mes: 11, cantidad_pedidos: 32, total_ingresos: 224000 },
    { mes: 12, cantidad_pedidos: 31, total_ingresos: 217000 }
  ],
  stock_bajo: [
    { nombre: "Tomate Cherry", stock: 5 },
    { nombre: "Queso Mozzarella", stock: 8 },
    { nombre: "Pan Integral", stock: 3 },
    { nombre: "Lechuga Fresca", stock: 7 }
  ],
  categorias_vendidas: [
    { categoria: "Hamburguesas", cantidad_vendida: 65 },
    { categoria: "Pizzas", cantidad_vendida: 52 },
    { categoria: "Pastas", cantidad_vendida: 45 },
    { categoria: "Ensaladas", cantidad_vendida: 38 },
    { categoria: "Bebidas", cantidad_vendida: 89 }
  ],
  productos_populares: [
    { descripcion: "Hamburguesa Premium", cantidad_compras: 45 },
    { descripcion: "Pizza Margarita", cantidad_compras: 38 },
    { descripcion: "Pasta Carbonara", cantidad_compras: 32 }
  ],
  suscripciones_activas: [
    { tipo_plan: "plan_entrenamiento", cantidad: 23 },
    { tipo_plan: "plan_nutricion", cantidad: 18 }
  ]
};
