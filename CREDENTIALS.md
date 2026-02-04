# Beauty Touch Nails - Credenciales y Configuración

## Credenciales de Acceso

### Usuario Administrador
- **Email:** admin@beautytouchnails.com
- **Contraseña:** admin123
- **Acceso:** Panel completo de administración

### Usuario Cliente de Prueba
Puedes crear nuevos usuarios desde el registro en la aplicación.

## Configuración de Base de Datos

La aplicación usa MongoDB con la siguiente configuración:
- **Base de datos:** beauty_touch_spa
- **Conexión:** localhost:27017

### Colecciones creadas:
- `users` - Usuarios (clientes y administradores)
- `services` - Servicios del spa
- `appointments` - Citas agendadas
- `promotions` - Promociones y descuentos

## Servicios Pre-configurados

La aplicación incluye 5 servicios iniciales:

1. **Manicure Premium** - $350 (60 min)
2. **Pedicure Spa** - $400 (75 min)
3. **Extensión de Pestañas** - $500 (90 min)
4. **Alaciado Brasileño** - $1,200 (180 min)
5. **Uñas Acrílicas** - $450 (90 min)

## Configuración de Twilio (Notificaciones SMS/WhatsApp)

### Estado Actual: NO CONFIGURADO

Las notificaciones SMS están implementadas pero requieren credenciales de Twilio.

### Para activar las notificaciones:

1. Crea una cuenta en [Twilio](https://www.twilio.com/)
2. Obtén tus credenciales:
   - Account SID
   - Auth Token
   - Número de teléfono Twilio

3. Actualiza el archivo `/app/backend/.env`:
```bash
TWILIO_ACCOUNT_SID="tu_account_sid"
TWILIO_AUTH_TOKEN="tu_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

4. Reinicia el backend:
```bash
sudo supervisorctl restart backend
```

### Notificaciones incluidas:
- Confirmación de cita al momento de reservar
- SMS al teléfono del cliente
- Formato: "Beauty Touch Nails: Tu cita de [servicio] ha sido agendada para el [fecha] a las [hora]. Por favor envía tu comprobante de pago."

**IMPORTANTE:** Sin las credenciales de Twilio, la aplicación funciona normalmente pero NO envía mensajes SMS. Los usuarios recibirán notificaciones visuales en la aplicación.

## URLs de Acceso

- **Aplicación:** https://beauty-touch-app.preview.emergentagent.com
- **API Backend:** https://beauty-touch-app.preview.emergentagent.com/api

## Flujos Principales

### Para Clientes:
1. Registro → Dashboard
2. Ver Servicios → Reservar Cita
3. Subir Comprobante de Pago
4. Ver estado de citas

### Para Administradores:
1. Login → Panel Admin
2. Gestionar Servicios (CRUD + imágenes)
3. Ver y actualizar citas
4. Crear/eliminar promociones
5. Ver estadísticas del negocio
