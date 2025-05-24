import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Tipos de cambio para el historial de productos
enum ChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

async function main() {
  try {
    console.log('🌱 Iniciando seeder de historial de precios de productos...');
    
    // Obtener todos los productos activos
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        basePrice: true,
        sellerId: true,
      },
    });
    
    if (products.length === 0) {
      console.log('❌ No se encontraron productos para generar historial de precios.');
      return;
    }
    
    console.log(`📊 Generando historial de precios para ${products.length} productos...`);
    
    // Generar registros de historial de precio para los últimos 90 días
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 90);
    
    // Array para almacenar todos los registros que crearemos
    const historyRecords = [];
    
    for (const product of products) {
      console.log(`📝 Generando historial para producto: ${product.name}`);
      
      // Generar entre 5 y 15 cambios de precio para cada producto
      const numChanges = Math.floor(Math.random() * 10) + 5;
      
      // Precio inicial (entre 80% y 120% del precio actual)
      let currentPrice = product.basePrice * (0.8 + Math.random() * 0.4);
      
      for (let i = 0; i < numChanges; i++) {
        // Calcular fecha aleatoria dentro del período (más recientes tienen más probabilidad)
        const daysAgo = Math.floor(Math.random() * 90 * (1 - Math.sqrt(Math.random())));
        const changeDate = new Date(now);
        changeDate.setDate(now.getDate() - daysAgo);
        
        // Precio anterior
        const oldPrice = currentPrice;
        
        // Generar cambio de precio (entre -5% y +8%)
        const priceChange = (Math.random() * 0.13) - 0.05;
        currentPrice = oldPrice * (1 + priceChange);
        
        // Redondear precio a 2 decimales
        currentPrice = Math.round(currentPrice * 100) / 100;
        
        // Crear registro de historial
        historyRecords.push({
          id: randomUUID(),
          productId: product.id,
          userId: product.sellerId,
          changeType: ChangeType.UPDATE,
          changeField: 'basePrice',
          oldValue: oldPrice.toString(),
          newValue: currentPrice.toString(),
          timestamp: changeDate,
          additionalInfo: {
            reason: getReason(priceChange)
          }
        });
      }
      
      // Añadir el precio actual como último cambio
      historyRecords.push({
        id: randomUUID(),
        productId: product.id,
        userId: product.sellerId,
        changeType: ChangeType.UPDATE,
        changeField: 'basePrice',
        oldValue: currentPrice.toString(),
        newValue: product.basePrice.toString(),
        timestamp: new Date(now.getTime() - Math.random() * 24 * 3600 * 1000), // En las últimas 24 horas
        additionalInfo: {
          reason: getReason(product.basePrice > currentPrice ? 0.05 : -0.02)
        }
      });
    }
    
    // Crear todos los registros en una sola transacción
    const result = await prisma.productHistory.createMany({
      data: historyRecords,
      skipDuplicates: true,
    });
    
    console.log(`✅ Historial de precios generado: ${result.count} registros creados.`);
  } catch (error) {
    console.error('❌ Error al generar historial de precios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para generar una razón de cambio de precio basada en el porcentaje
function getReason(priceChange: number): string {
  const reasons = [
    // Razones para incremento de precio
    [
      'Aumento de demanda en el mercado',
      'Incremento en costos de producción',
      'Escasez por factores climáticos',
      'Ajuste estacional de precios',
      'Mejora en la calidad del producto'
    ],
    // Razones para reducción de precio
    [
      'Mayor oferta en el mercado',
      'Reducción de costos logísticos',
      'Excedente de producción',
      'Estrategia de competitividad',
      'Promoción temporal'
    ]
  ];
  
  // Seleccionar lista de razones según dirección del cambio
  const reasonsIndex = priceChange >= 0 ? 0 : 1;
  
  // Seleccionar razón aleatoria
  const randomIndex = Math.floor(Math.random() * reasons[reasonsIndex].length);
  return reasons[reasonsIndex][randomIndex];
}

// Ejecutar script
main()
  .then(() => console.log('✨ Seeder completado exitosamente.'))
  .catch(e => console.error('💥 Error en seeder:', e)); 