# Beauty Touch Nails - Sistema de Login Actualizado

## 🎨 Nuevo Diseño
La aplicación ahora cuenta con un **fondo rosa pastel elegante** en todas las pantallas, creando una atmósfera cálida y acogedora perfecta para un spa de belleza.

## 🔐 Sistema de Login Dual

### Para Clientes
**URL:** `/login/cliente`

Los clientes ahora pueden ingresar **solo con su número de teléfono** - ¡No necesitan recordar contraseñas!

**Cómo funciona:**
1. Ir a la página de login y seleccionar "Soy Cliente"
2. Ingresar el número de teléfono (con código de país, ej: +52...)
3. ¡Listo! El sistema te da la bienvenida por tu nombre

**Clientes de prueba:**
- **Teléfono:** +5215512345678
- **Nombre:** Maria García

### Para Administradores
**URL:** `/login/admin`

Los administradores ingresan con email y contraseña para mayor seguridad.

**Credenciales Admin:**
- **Email:** admin@beautytouchnails.com
- **Contraseña:** admin123

## 🎯 Flujo de Login

### Página Principal de Login (`/login`)
1. Página de bienvenida con dos opciones:
   - **"Soy Cliente"** → Login con teléfono
   - **"Soy Administrador"** → Login tradicional

### Experiencia del Cliente
1. Click en "Soy Cliente"
2. Ingresar número de teléfono
3. Recibir mensaje de bienvenida personalizado: "¡Bienvenido [Nombre]!"
4. Ver saludo en navbar: "Hola, [Nombre]"
5. Acceso a dashboard para gestionar citas

### Experiencia del Administrador
1. Click en "Soy Administrador"
2. Ingresar email y contraseña
3. Acceso directo al panel de administración
4. Control total del sistema

## 📱 Registro de Nuevos Clientes

Los nuevos clientes pueden registrarse desde cualquier página de login:
- Link "¿No tienes cuenta? Regístrate aquí"
- Requieren: Nombre, Email, Teléfono, Contraseña
- Después del registro pueden usar login con teléfono

## 🎨 Características Visuales

- **Fondo rosa pastel** en todas las páginas
- **Iconos distintivos** para Cliente vs Administrador
- **Diseño de tarjetas** elegante con efectos hover
- **Mensajes de bienvenida** personalizados con nombre del usuario
- **Navbar actualizado** con saludo "Hola, [Nombre]"

## 🔒 Seguridad

- **Clientes:** Login simplificado con teléfono (solo para role="cliente")
- **Administradores:** Login seguro con email/password
- Tokens JWT para autenticación
- Validación de roles en backend

## 🚀 URLs Principales

- Página de selección: https://beauty-touch-app.preview.emergentagent.com/login
- Login cliente: https://beauty-touch-app.preview.emergentagent.com/login/cliente
- Login admin: https://beauty-touch-app.preview.emergentagent.com/login/admin
- Registro: https://beauty-touch-app.preview.emergentagent.com/register
