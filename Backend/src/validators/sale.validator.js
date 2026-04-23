const { z } = require('zod');

const createSaleSchema = z.object({
  body: z.object({
    clientId: z.number().int().positive('El ID del cliente debe ser un número positivo'),
    items: z.array(
      z.object({
        productId: z.number().int().positive('El ID del producto debe ser un número positivo'),
        quantity: z.number().positive('La cantidad debe ser mayor a cero')
      })
    ).min(1, 'Debe incluir al menos un ítem en la venta')
  })
});

const getSalesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number)
  }).optional()
});

module.exports = {
  createSaleSchema,
  getSalesSchema
};
