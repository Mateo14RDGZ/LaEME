# LA EME · E-commerce

Sitio y tienda de **LA EME**, cerveza artesanal independiente de Uruguay.
*QUE HABLE LO QUE HACEMOS.*

## Stack y decisiones

| Área | Elección | Por qué |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript estricto | Rutas del servidor, route handlers para la API de pagos, deploy simple en Vercel. |
| Estilos | Tailwind CSS 4 con tokens en `src/app/globals.css` | Paleta y tipografía centralizadas. |
| Base de datos | PostgreSQL 16 + Prisma 7 (adaptador `pg`) | Transacciones y `SELECT … FOR UPDATE` para stock sin sobreventa. |
| Pagos | Mercado Pago Checkout Pro, detrás de la interfaz `PaymentProvider` | Otro proveedor se agrega sin tocar pedidos ni stock. |
| Validación | Zod 4 en cliente **y** servidor | El servidor nunca confía en precios ni totales enviados. |

Los precios se guardan como **enteros en pesos uruguayos (UYU)**. No hay floats en dinero.

## Arquitectura

```
src/
  app/                 Páginas (App Router) y route handlers (API)
    api/cart/quote     Cotiza el carrito con precios y stock reales
    api/checkout/      Opciones de envío + creación del pedido y del pago
    api/webhooks/mercadopago   Notificaciones de pago (firma verificada)
    api/cron/expire-orders     Libera reservas vencidas (requiere CRON_SECRET)
  domain/              Reglas de negocio puras y transaccionales
    cart.ts            Cotización y bloqueo de productos no comprables
    shipping.ts        Opciones y zonas de envío, costo desde el servidor
    inventory.ts       Reservas y bloqueo de filas de producto
    orders.ts          reserveOrder / applyProviderPayment / expireStaleOrders
    order-status.ts    Qué hace cada estado de pago (funciones puras)
    validation.ts      Esquemas Zod del carrito y del checkout
  lib/payments/        Contrato de proveedor + implementación de Mercado Pago
  data/                Lecturas para páginas y catálogo semilla
  components/          UI: marca, catálogo, carrito, checkout, layout
prisma/
  schema.prisma        Modelo de datos
  migrations/          Migraciones (incluye CHECK constraints)
  seed.ts              Siembra catálogo, envíos y ajustes (idempotente)
```

### Flujo de compra

1. El carrito vive en `localStorage` **solo como comodidad**: guarda slugs y cantidades, nunca precios.
2. `/api/cart/quote` devuelve precios y disponibilidad recalculados desde la base.
3. `POST /api/checkout`, en una sola transacción:
   - bloquea las filas de los productos (`FOR UPDATE`, en orden estable);
   - verifica estado `AVAILABLE`, precio > 0 y stock disponible = stock − reservas vigentes;
   - resuelve el envío desde la configuración (habilitado y que cubra el departamento);
   - crea cliente (si no existe), pedido en `PENDING_PAYMENT` con **snapshot** de nombre y precio, y reserva por `ORDER_RESERVATION_MINUTES`.
4. Fuera de la transacción crea la preferencia en Mercado Pago con `external_reference = orderId` y devuelve `init_point`. Si falla, el pedido pasa a `CANCELLED` y se libera la reserva.
5. El cliente va a Mercado Pago. Vuelve a `/pedido/<token>`, que muestra **el estado guardado en la base**, no los parámetros de la URL.
6. El webhook confirma el pago (ver abajo). Recién ahí el pedido pasa a `PAID` y se descuenta el stock.

### Reglas de stock

| Momento | Qué pasa con el stock |
| --- | --- |
| Abrir el checkout / crear el pedido | Se **reserva** (no se descuenta). Disponible = `stock − reservas vigentes`. |
| Pago aprobado (webhook verificado) | Se **descuenta** `stock` una sola vez, dentro de la misma transacción que cambia el estado a `PAID`. |
| Pago rechazado, cancelado o pago no iniciado | La reserva se **libera** (el pedido sale de la cuenta de reservas). |
| Reserva vencida sin pago | El cron pasa el pedido a `EXPIRED` y libera la reserva. |
| Pago aprobado tarde (pedido `EXPIRED`) | Se acepta **solo si** hay stock; si no, queda `NEEDS_REVIEW`. |
| Reembolso o contracargo | El pedido pasa a `REFUNDED`. **El stock no se repone solo**: el operador decide si la mercadería vuelve. |

### Estados de pedido

`PENDING_PAYMENT` → `PAID` · `PAYMENT_REJECTED` · `CANCELLED` · `EXPIRED` · `REFUNDED` · `NEEDS_REVIEW`

`NEEDS_REVIEW` se usa cuando el monto o la moneda no coinciden, cuando llega un segundo pago aprobado para el mismo pedido, o cuando el pago fue aprobado sin stock suficiente. Son casos para revisión manual.

### Idempotencia

- `Payment.providerPaymentId` es único: un webhook repetido no duplica registros.
- Cada transición usa `updateMany` con condición sobre el estado de origen: si el pedido ya cambió, la llamada no hace nada.
- El descuento de stock solo ocurre cuando el cambio a `PAID` tuvo efecto (`count === 1`).
- La creación de la preferencia envía `X-Idempotency-Key: order-<id>`.

## Desarrollo local

Requisitos: Node 22+, Docker (o PostgreSQL 16 local).

```bash
npm install
cp .env.example .env          # ajustar valores locales
docker compose up -d          # PostgreSQL en localhost:5432
npx prisma migrate deploy     # aplica migraciones
npm run db:seed               # carga catálogo, envíos y ajustes vacíos
npm run dev                   # http://localhost:3000
```

Otros comandos:

- `npm test`: pruebas unitarias de dominio (sin base de datos).
- `npx tsx --test src/domain/orders.integration.test.ts`: pruebas de integración contra PostgreSQL. **Crea y borra sus propios datos; usar solo la base de desarrollo.**
- `npm run lint`: TypeScript en modo estricto.
- `npm run build`: genera el cliente de Prisma y compila.

### Modo desarrollo sin Mercado Pago

Si `MERCADOPAGO_ACCESS_TOKEN` o `MERCADOPAGO_WEBHOOK_SECRET` no son valores reales, el sitio funciona, pero:

- el checkout muestra "Pagos no configurados" y **no crea pedidos**;
- `POST /api/checkout` responde 503;
- el webhook responde 503.

No hay botón de pago simulado: el sistema no finge pagos.

## Variables de entorno

Ver `.env.example`. Nunca se suben valores reales al repositorio.

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL. |
| `NEXT_PUBLIC_SITE_URL` | URL pública, sin barra final. Se usa en `back_urls`, `notification_url`, sitemap y Open Graph. |
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de Mercado Pago (`TEST-…` en pruebas, `APP_USR-…` en producción). **Solo servidor.** |
| `MERCADOPAGO_WEBHOOK_SECRET` | Firma secreta de la aplicación para verificar `x-signature`. **Solo servidor.** |
| `ORDER_RESERVATION_MINUTES` | Minutos que se reserva el stock mientras se paga (5 a 120). |
| `CRON_SECRET` | Token para `/api/cron/expire-orders`, enviado como `Authorization: Bearer …`. |

## Configurar Mercado Pago

1. Crear una aplicación en el [Panel de desarrolladores de Mercado Pago](https://www.mercadopago.com.uy/developers/panel).
2. Copiar el **access token de prueba** (o de producción) a `MERCADOPAGO_ACCESS_TOKEN`.
3. En la sección **Webhooks** de la aplicación, copiar la **firma secreta** a `MERCADOPAGO_WEBHOOK_SECRET`.
4. Probar primero con credenciales de prueba y usuarios de prueba del panel.

### Verificación de firma

El webhook valida `x-signature` (`ts=…,v1=…`) con HMAC-SHA256 sobre el manifiesto:

```
id:<data.id en minúsculas>;request-id:<x-request-id>;ts:<ts>;
```

Después de verificar la firma, **el sistema vuelve a consultar el pago** en `GET /v1/payments/{id}` y usa esa respuesta. El cuerpo del webhook nunca decide el estado.

> ⚠️ **Pendiente de confirmar:** el formato exacto del manifiesto y los campos de la preferencia (`expires`, `expiration_date_to`, `auto_return`) deben contrastarse con la documentación oficial vigente de Mercado Pago antes de habilitar ventas reales. La búsqueda realizada durante el desarrollo confirmó `ts`, `v1` y el uso de la firma secreta, pero no devolvió la plantilla oficial del manifiesto.

### URLs de retorno y notificaciones

- `notification_url`: `${NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`. Debe ser **pública**. En desarrollo local usar un túnel (por ejemplo ngrok) y poner esa URL en `NEXT_PUBLIC_SITE_URL`.
- `back_urls`: `/pedido/<token>` para aprobado, pendiente y fallido. `auto_return: approved` exige URLs públicas con HTTPS.

## Configurar envíos

Las opciones se guardan en la tabla `ShippingOption`. Se siembran **deshabilitadas y con precio 0**: no se inventan tarifas.

```sql
-- Habilitar retiro sin costo
UPDATE "ShippingOption" SET enabled = true WHERE code = 'retiro';

-- Envío a Montevideo y Canelones por $ 150
UPDATE "ShippingOption"
SET enabled = true, "priceUyu" = 150, departments = ARRAY['Montevideo','Canelones']
WHERE code = 'envio';
```

- `departments` vacío significa "todo el país". Usarlo solo si el operador lo confirma.
- Si ninguna opción está habilitada, el checkout avisa y no acepta pedidos.
- Los costos se calculan en el servidor; el cliente solo elige el código.

## Catálogo, precios y stock

- La **fuente de contenido** es `src/data/catalog.seed.ts`. `npm run db:seed` actualiza textos y arte.
- **Precio, estado, stock y `ingredientsVerified`** los administra el operador en la base. El seed nunca los pisa.
- Estados: `DRAFT` (oculto), `COMING_SOON` (informativo), `AVAILABLE` (vendible si hay precio y stock), `SOLD_OUT`, `DISCONTINUED` (oculto).
- Un producto solo es comprable con `status = AVAILABLE`, `priceUyu > 0` y stock disponible.

Ejemplo para publicar Tropical Haze:

```sql
UPDATE "Product"
SET status = 'AVAILABLE', "priceUyu" = 290, stock = 24, "ingredientsVerified" = true
WHERE slug = 'tropical-haze';
```

Agregar una sexta cerveza: sumar un objeto a `productSeeds`, colocar su arte en `public/products/`, y correr `npm run db:seed`. No hace falta tocar páginas.

Cargar stock nuevo: `UPDATE "Product" SET stock = stock + N WHERE slug = '…';`

Ajustes del sitio (contacto y redes): filas en `SiteSetting`, claves `contact.email`, `contact.phone`, `contact.whatsapp`, `contact.address`, `social.instagram`, `social.facebook`. Vacías no se muestran.

## Expiración de reservas

Programar una llamada cada 5 minutos:

```bash
curl -X POST https://TU-DOMINIO/api/cron/expire-orders \
  -H "Authorization: Bearer $CRON_SECRET"
```

En Vercel, configurar un Cron Job con la misma cabecera. Sin esta tarea, un pedido vencido sigue como `PENDING_PAYMENT` hasta que el cálculo de reservas lo ignora por fecha: el stock disponible ya se libera igual, pero el estado no se actualiza.

## Despliegue en Vercel

1. Crear una base PostgreSQL gestionada (Neon, Supabase o similar) y tomar su `DATABASE_URL`.
2. Importar el repositorio en Vercel y cargar las variables de entorno de `.env.example` con valores reales.
3. Ejecutar migraciones contra la base de producción: `npx prisma migrate deploy` (con `DATABASE_URL` de producción).
4. Ejecutar el seed una vez: `npm run db:seed`.
5. Configurar el webhook de Mercado Pago apuntando a `https://TU-DOMINIO/api/webhooks/mercadopago`.
6. Configurar el Cron Job de expiración.
7. Verificar: `/`, `/cervezas`, una ficha, `/checkout` (debe mostrar el estado de configuración), `/robots.txt`, `/sitemap.xml`.

Los `dynamic = "force-dynamic"` de las páginas significan que el build no necesita la base; cada solicitud la consulta.

## Verificación realizada

Ejecutado en este entorno, con PostgreSQL 16 real:

- `tsc --noEmit` (estricto): sin errores.
- `npm run build`: compila y genera todas las rutas.
- Pruebas unitarias de dominio (17): cotización, stock limitado, envíos por zona, firma de webhook, transiciones de pago, validación de entrada.
- Pruebas de integración (5): reserva y bloqueo de sobreventa, descuento de stock idempotente, rechazo que libera, monto distinto a revisión, reserva vencida y pago tardío.
- Servidor de producción: rutas públicas responden, rutas inexistentes dan 404 real, API valida entrada, checkout sin configuración responde 503, checkout con Mercado Pago inaccesible responde 502 y cancela el pedido liberando reserva, webhook sin firma o con firma inválida responde 401, webhook con firma válida pero sin poder consultar el pago responde 500 (para reintento).
- Capturas en escritorio y móvil sin desborde horizontal.

**No verificado:** un pago real o de prueba de punta a punta con Mercado Pago. Eso requiere credenciales y una URL pública para el webhook.

## Checklist antes de vender

- [ ] Revisar con asesoría legal: edad mínima, venta de alcohol en Uruguay, etiquetado, impuestos, defensa del consumidor y protección de datos (Ley 18.331). Las páginas de **términos**, **privacidad** y **envíos** están marcadas como provisorias.
- [ ] Confirmar el formato del manifiesto del webhook y los parámetros de preferencia contra la documentación oficial vigente de Mercado Pago.
- [ ] Probar un pago aprobado, uno rechazado y uno pendiente con usuarios de prueba, incluyendo la llegada del webhook por URL pública.
- [ ] Definir zonas y costos de envío y habilitar las opciones.
- [ ] Verificar ingredientes, notas de cata y graduaciones con el equipo de producción.
- [ ] Reemplazar el emblema M aproximado por el vector oficial.
- [ ] Cargar precio y stock reales; no publicar `AVAILABLE` sin ellos.
- [ ] Cargar datos de contacto y redes reales en `SiteSetting` (hoy vacíos).
- [ ] Definir el proceso operativo para pedidos en `NEEDS_REVIEW` y para reembolsos (el stock no se repone automáticamente).
- [ ] Configurar monitoreo de errores y de la tarea de expiración.

## Limitaciones conocidas

- **Notificaciones por email**: no se envían. Los pedidos se confirman en la página del pedido; el contacto posterior es manual.
- **Sin panel de administración**: la gestión se hace por SQL o por el seed. Un panel es el siguiente paso natural.
- **Emblema M**: reconstrucción vectorial aproximada desde la imagen de referencia, no el archivo oficial.
- **Arte de producto**: se usan recortes de las etiquetas de referencia. La botella de la portada es un mockup, no una fotografía de producto.
- **Ingredientes y notas de cata**: provisorios y marcados como no verificados (no se muestran ingredientes sin verificar).
- **Fuentes**: Playfair Display, Oswald y Source Sans 3 (Google Fonts, licencia OFL). Se descargan en build.
- **Accesibilidad y SEO**: se cubrieron encabezados, foco visible, diálogo de edad con foco y contenido inerte, metadatos, Open Graph, sitemap y robots. No se hizo una auditoría WCAG formal.
- **Cliente de base de datos**: las migraciones son para PostgreSQL. No hay soporte para SQLite.
