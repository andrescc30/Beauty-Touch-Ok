# Beauty Touch Nails - Credenciales de Administrador

## 👤 Usuario Administrador Temporal

### Credenciales de Acceso
- **Teléfono:** +5219999999999
- **Contraseña:** admin123
- **Nombre:** Administrador Temporal
- **Tipo:** Contraseña temporal (requiere cambio)

### Acceso
**URL:** https://beauty-touch-app.preview.emergentagent.com/login/admin

## 🔐 Sistema de Contraseña Temporal

### Primera vez que ingresas:
1. Usa las credenciales temporales arriba
2. Verás una **advertencia amarilla** prominente: "⚠️ Estás usando una contraseña temporal. Por favor cámbiala por seguridad."
3. Click en "Cambiar Ahora" o en el botón "Cambiar Contraseña" en la esquina superior derecha

### Cambio de Contraseña:
1. **Contraseña Actual:** admin123 (temporal)
2. **Nueva Contraseña:** Tu contraseña personalizada (mínimo 6 caracteres)
3. **Confirmar:** Repetir la nueva contraseña

### Después del Cambio:
- ✅ La advertencia desaparece
- ✅ Tu cuenta queda personalizada
- ✅ En próximos logins usa tu nueva contraseña
- ✅ El sistema marca tu cuenta como segura

## 📱 Login de Administrador

### Características:
- **Autenticación:** Teléfono + Contraseña (NO email)
- **Validación:** Solo usuarios con role="admin" pueden acceder
- **Seguridad:** Sistema detecta contraseñas temporales
- **Cambio obligatorio:** Banner visible hasta cambiar contraseña

## 🖼️ Gestión de Imágenes de Servicios

### En el Panel de Administrador:

1. **Ver Servicios:**
   - Tab "Servicios" en el dashboard
   - Cada servicio muestra su imagen actual
   - Botón "Cambiar" en cada tarjeta de servicio

2. **Cambiar Imagen:**
   - Click en "Cambiar" sobre la imagen del servicio
   - Selecciona archivo de tu dispositivo
   - Formatos: JPG, PNG, WebP
   - La imagen se sube y muestra inmediatamente

3. **Crear Nuevo Servicio:**
   - Click en "Nuevo Servicio"
   - Llena el formulario (nombre, descripción, precio, duración)
   - **Después de crear:** Usa el botón "Cambiar" para subir imagen
   - Las imágenes se guardan en base64 en MongoDB

### Botón de Imagen:
- Ubicación: Esquina inferior derecha de cada tarjeta de servicio
- Icono: 📤 Upload
- Texto: "Cambiar" o "Subiendo..." durante el proceso
- Feedback: Toast de confirmación al completar

## 🔄 Flujo Completo de Administrador

### Primera Sesión:
1. Login con credenciales temporales
2. Dashboard se carga con advertencia amarilla
3. Cambiar contraseña inmediatamente
4. Gestionar servicios, citas, promociones

### Sesiones Posteriores:
1. Login con teléfono + tu contraseña personalizada
2. Sin advertencias
3. Acceso completo al panel

## 🛡️ Seguridad

### Validaciones Backend:
- Login solo con role="admin"
- Verificación de contraseña con bcrypt
- JWT tokens con expiración 7 días
- Flag is_temp_password en base de datos

### Validaciones Frontend:
- Campo de teléfono requerido (formato +52...)
- Contraseña mínimo 6 caracteres
- Confirmación de contraseña debe coincidir
- Advertencia persistente hasta cambio completado

## 📝 Notas Importantes

1. **Contraseña Temporal es de un solo uso inicial**
   - Después del primer login, DEBES cambiarla
   - El sistema te recordará constantemente

2. **Teléfono es el identificador único**
   - No uses email para admin
   - Formato internacional requerido (+código país)

3. **Las imágenes se guardan en base64**
   - No hay límite de tamaño (pero recomienda < 2MB)
   - Se almacenan directamente en MongoDB
   - Carga instantánea en el frontend

4. **Cada servicio puede tener una imagen**
   - Opcional pero recomendado
   - Mejora la experiencia del cliente
   - Se muestra en catálogo público

## 🚀 Accesos Rápidos

- **Login Admin:** https://beauty-touch-app.preview.emergentagent.com/login/admin
- **Panel Admin:** https://beauty-touch-app.preview.emergentagent.com/admin
- **Tel Temporal:** +5219999999999
- **Pass Temporal:** admin123
