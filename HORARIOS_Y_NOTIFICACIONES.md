# Beauty Touch Nails - Horarios y Notificaciones

## 📅 Horarios de Atención

### Lunes a Viernes
- **Horario:** 10:00 am - 7:00 pm
- **Slots disponibles:** 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00

### Sábados
- **Horario:** 10:00 am - 3:00 pm
- **Slots disponibles:** 10:00, 11:00, 12:00, 13:00, 14:00, 15:00

### Domingos
- **Estado:** ❌ CERRADO
- Los clientes no pueden agendar citas en domingo
- Se muestra mensaje de advertencia si intentan seleccionar domingo

## 📱 Sistema de Notificaciones por WhatsApp

### Notificación de Confirmación de Cita
Cuando un cliente agenda una cita, recibe automáticamente un mensaje por WhatsApp con:

```
🌸 *Beauty Touch Nails* 🌸

¡Hola [Nombre]!

✅ Tu cita ha sido agendada exitosamente:

📋 Servicio: [Nombre del servicio]
📅 Fecha: [Día de la semana], [Fecha]
🕐 Hora: [Hora]
💰 Precio: $[Precio]

📸 Por favor envía tu comprobante de pago desde tu panel de citas para confirmar tu reserva.

📍 Horarios de atención:
• Lun-Vie: 10:00 am - 7:00 pm
• Sábados: 10:00 am - 3:00 pm
• Domingos: Cerrado

Te enviaremos un recordatorio 24h antes de tu cita.

¡Gracias por confiar en nosotros! ✨
```

### Recordatorio 24 Horas Antes
El sistema revisa cada hora y envía recordatorios automáticos 24 horas antes de cada cita:

```
🌸 *Beauty Touch Nails* 🌸

¡Hola [Nombre]!

📅 Recordatorio de tu cita:
• Servicio: [Nombre del servicio]
• Fecha: [Fecha]
• Hora: [Hora]

Te esperamos mañana. Si tienes alguna duda, contáctanos.

¡Gracias por confiar en nosotros! ✨
```

## 🤖 Sistema Automatizado

### Scheduler de Recordatorios
- **Frecuencia:** Cada hora
- **Criterio:** Citas confirmadas o pendientes en las próximas 23-25 horas
- **Prevención de duplicados:** Marca las citas como "reminder_sent" después de enviar

### Preferencia de Notificaciones
- **Predeterminado:** WhatsApp
- **Fallback:** SMS (si WhatsApp no está disponible)

## ⚙️ Configuración de Twilio

### Variables de Entorno Requeridas
```bash
TWILIO_ACCOUNT_SID="tu_account_sid"
TWILIO_AUTH_TOKEN="tu_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"  # Para SMS
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"  # Para WhatsApp
```

### Twilio WhatsApp Sandbox
Por defecto, la aplicación está configurada para usar el Twilio Sandbox de WhatsApp:
- Número por defecto: `whatsapp:+14155238886`
- Para activar: Los clientes deben enviar un mensaje específico al sandbox
- Para producción: Solicitar un número de WhatsApp Business verificado

### Estado Actual
Las credenciales de Twilio **NO están configuradas** en el archivo `.env`, por lo que:
- ✅ El código está completamente implementado
- ✅ Los mensajes están formateados y listos
- ❌ Las notificaciones NO se envían hasta que se configuren las credenciales
- ✅ La aplicación funciona normalmente sin las credenciales

## 🎯 Validaciones Implementadas

### Frontend (React)
1. **Selector de fecha:** Muestra mensaje dinámico según el día seleccionado
2. **Horarios disponibles:** Se ajustan automáticamente según el día de la semana
3. **Domingos:** No muestra horarios, muestra mensaje de cerrado
4. **Feedback visual:** Iconos y colores para cada día

### Backend (FastAPI)
1. **Validación de horarios:** Aunque el frontend previene, el backend también valida
2. **Sistema de recordatorios:** Job scheduler con APScheduler
3. **Formato de mensajes:** Plantillas profesionales con emojis
4. **Manejo de errores:** Logs detallados para debugging

## 📊 Métricas del Sistema

### Recordatorios
- Se ejecutan cada hora
- Solo para citas en las próximas 23-25 horas
- Marca las citas para evitar duplicados
- Logs informativos de cada recordatorio enviado

### Notificaciones de Confirmación
- Inmediatas al agendar cita
- Incluyen toda la información relevante
- Formato profesional con estructura clara
- Recordatorio de horarios de atención

## 🔧 Mantenimiento

### Para Activar WhatsApp
1. Obtener credenciales de Twilio
2. Actualizar `/app/backend/.env` con las credenciales
3. Reiniciar el backend: `sudo supervisorctl restart backend`
4. Verificar logs: `tail -f /var/log/supervisor/backend.*.log`

### Para Probar Localmente
```bash
# Verificar que el scheduler esté corriendo
grep "Scheduler iniciado" /var/log/supervisor/backend.*.log

# Ver recordatorios enviados
grep "Recordatorio enviado" /var/log/supervisor/backend.*.log
```
