from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import bcrypt
import jwt
from twilio.rest import Client
import base64
from apscheduler.schedulers.asyncio import AsyncIOScheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client_db = AsyncIOMotorClient(mongo_url)
db = client_db[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"

twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
twilio_whatsapp = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')  # Twilio Sandbox por defecto
twilio_client = None
if twilio_account_sid and twilio_auth_token:
    twilio_client = Client(twilio_account_sid, twilio_auth_token)

scheduler = AsyncIOScheduler()

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    telefono: str
    role: str = "cliente"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PhoneLogin(BaseModel):
    telefono: str

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: str
    precio: float
    duracion: int
    imagen_url: Optional[str] = None
    activo: bool = True
    rating_promedio: float = 0.0
    total_reviews: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    nombre: str
    descripcion: str
    precio: float
    duracion: int
    imagen_url: Optional[str] = None

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_id: str
    fecha: datetime
    estado: str = "pendiente"
    comprobante_pago: Optional[str] = None
    reminder_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    service_id: str
    fecha: str
    hora: str

class Promotion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    codigo: str
    descuento_porcentaje: float
    descripcion: str
    fecha_inicio: datetime
    fecha_fin: datetime
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromotionCreate(BaseModel):
    codigo: str
    descuento_porcentaje: float
    descripcion: str
    fecha_inicio: str
    fecha_fin: str

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_id: str
    appointment_id: str
    rating: int
    comentario: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    service_id: str
    appointment_id: str
    rating: int
    comentario: str

class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_id: str
    titulo: str
    descripcion: str
    imagen_antes: str
    imagen_despues: str
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GalleryCreate(BaseModel):
    service_id: str
    titulo: str
    descripcion: str

class Package(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: str
    service_ids: List[str]
    precio_original: float
    precio_paquete: float
    descuento_porcentaje: float
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PackageCreate(BaseModel):
    nombre: str
    descripcion: str
    service_ids: List[str]
    precio_paquete: float

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_admin_user(user = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return user

def send_sms_notification(phone: str, message: str):
    """Envía notificación por SMS"""
    if twilio_client and twilio_phone:
        try:
            twilio_client.messages.create(
                body=message,
                from_=twilio_phone,
                to=phone
            )
            logging.info(f"SMS enviado a {phone}")
        except Exception as e:
            logging.error(f"Error enviando SMS: {str(e)}")

def send_whatsapp_notification(phone: str, message: str):
    """Envía notificación por WhatsApp"""
    if twilio_client and twilio_whatsapp:
        try:
            # El número del cliente debe tener el prefijo whatsapp:
            to_whatsapp = f"whatsapp:{phone}" if not phone.startswith('whatsapp:') else phone
            
            twilio_client.messages.create(
                body=message,
                from_=twilio_whatsapp,
                to=to_whatsapp
            )
            logging.info(f"WhatsApp enviado a {phone}")
        except Exception as e:
            logging.error(f"Error enviando WhatsApp: {str(e)}")

def send_notification(phone: str, message: str, prefer_whatsapp: bool = True):
    """Envía notificación por WhatsApp o SMS según disponibilidad"""
    if prefer_whatsapp:
        send_whatsapp_notification(phone, message)
    else:
        send_sms_notification(phone, message)

async def send_appointment_reminders():
    """Job que se ejecuta cada hora para enviar recordatorios de citas"""
    try:
        now = datetime.now(timezone.utc)
        
        # Buscar citas en las próximas 24 horas que no han recibido recordatorio
        appointments = await db.appointments.find({
            "estado": {"$in": ["confirmada", "pendiente"]},
            "reminder_sent": False
        }, {"_id": 0}).to_list(1000)
        
        reminders_sent = 0
        for apt in appointments:
            apt_time = datetime.fromisoformat(apt["fecha"])
            time_until = apt_time - now
            
            # Enviar recordatorio si la cita es en 23-25 horas
            if timedelta(hours=23) <= time_until <= timedelta(hours=25):
                user = await db.users.find_one({"id": apt["user_id"]}, {"_id": 0})
                service = await db.services.find_one({"id": apt["service_id"]}, {"_id": 0})
                
                if user and service:
                    fecha_formateada = apt_time.strftime("%d/%m/%Y")
                    hora_formateada = apt_time.strftime("%I:%M %p")
                    
                    message = f"""🌸 *Beauty Touch Nails* 🌸

¡Hola {user['nombre']}!

📅 Recordatorio de tu cita:
• Servicio: {service['nombre']}
• Fecha: {fecha_formateada}
• Hora: {hora_formateada}

Te esperamos mañana. Si tienes alguna duda, contáctanos.

¡Gracias por confiar en nosotros! ✨"""
                    
                    send_notification(user["telefono"], message, prefer_whatsapp=True)
                    
                    await db.appointments.update_one(
                        {"id": apt["id"]},
                        {"$set": {"reminder_sent": True}}
                    )
                    reminders_sent += 1
                    logging.info(f"Recordatorio enviado para cita {apt['id']} a {user['nombre']}")
        
        if reminders_sent > 0:
            logging.info(f"Total de recordatorios enviados: {reminders_sent}")
            
    except Exception as e:
        logging.error(f"Error en job de recordatorios: {str(e)}")

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "nombre": user_data.nombre,
        "telefono": user_data.telefono,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    token = create_token(user_dict["id"], user_dict["email"], user_dict["role"])
    
    return {
        "token": token,
        "user": {
            "id": user_dict["id"],
            "email": user_dict["email"],
            "nombre": user_dict["nombre"],
            "role": user_dict["role"]
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "nombre": user["nombre"],
            "role": user["role"]
        }
    }

@api_router.post("/auth/login-phone")
async def login_phone(credentials: PhoneLogin):
    user = await db.users.find_one({"telefono": credentials.telefono, "role": "cliente"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Número de teléfono no encontrado")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "nombre": user["nombre"],
            "telefono": user["telefono"],
            "role": user["role"]
        }
    }

@api_router.get("/services")
async def get_services():
    services = await db.services.find({"activo": True}, {"_id": 0}).to_list(100)
    
    for service in services:
        reviews = await db.reviews.find({"service_id": service["id"]}, {"_id": 0}).to_list(1000)
        if reviews:
            avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
            service["rating_promedio"] = round(avg_rating, 1)
            service["total_reviews"] = len(reviews)
        else:
            service["rating_promedio"] = 0
            service["total_reviews"] = 0
    
    return services

@api_router.post("/services")
async def create_service(service: ServiceCreate, user = Depends(get_admin_user)):
    service_dict = Service(**service.model_dump()).model_dump()
    service_dict["created_at"] = service_dict["created_at"].isoformat()
    await db.services.insert_one(service_dict)
    return service_dict

@api_router.put("/services/{service_id}")
async def update_service(service_id: str, service: ServiceCreate, user = Depends(get_admin_user)):
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": service.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"message": "Servicio actualizado"}

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, user = Depends(get_admin_user)):
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": {"activo": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"message": "Servicio eliminado"}

@api_router.post("/services/{service_id}/upload-image")
async def upload_service_image(service_id: str, file: UploadFile = File(...), user = Depends(get_admin_user)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    image_url = f"data:{file.content_type};base64,{base64_image}"
    
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": {"imagen_url": image_url}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    return {"imagen_url": image_url}

@api_router.get("/appointments")
async def get_appointments(user = Depends(get_current_user)):
    if user["role"] == "admin":
        appointments = await db.appointments.find({}, {"_id": 0}).to_list(1000)
    else:
        appointments = await db.appointments.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    
    for apt in appointments:
        service = await db.services.find_one({"id": apt["service_id"]}, {"_id": 0})
        apt["service"] = service
        
        if user["role"] == "admin":
            user_data = await db.users.find_one({"id": apt["user_id"]}, {"_id": 0, "password": 0})
            apt["user"] = user_data
        
        apt["can_review"] = (
            apt["estado"] == "confirmada" and 
            datetime.fromisoformat(apt["fecha"]) < datetime.now(timezone.utc) and
            not await db.reviews.find_one({"appointment_id": apt["id"]})
        )
    
    return appointments

@api_router.post("/appointments")
async def create_appointment(appointment: AppointmentCreate, user = Depends(get_current_user)):
    fecha_hora = datetime.fromisoformat(f"{appointment.fecha}T{appointment.hora}")
    
    existing = await db.appointments.find_one({
        "service_id": appointment.service_id,
        "fecha": fecha_hora.isoformat(),
        "estado": {"$ne": "cancelada"}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Esta hora ya está reservada")
    
    apt_dict = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "service_id": appointment.service_id,
        "fecha": fecha_hora.isoformat(),
        "estado": "pendiente",
        "reminder_sent": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Insertar en BD (esto modifica apt_dict agregando _id)
    await db.appointments.insert_one(apt_dict.copy())
    
    user_data = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    service = await db.services.find_one({"id": appointment.service_id}, {"_id": 0})
    
    if user_data and service:
        fecha_obj = datetime.fromisoformat(f"{appointment.fecha}T{appointment.hora}")
        fecha_formateada = fecha_obj.strftime("%d/%m/%Y")
        hora_formateada = fecha_obj.strftime("%I:%M %p")
        
        # Obtener día de la semana
        dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        dia_semana = dias[fecha_obj.weekday()]
        
        message = f"""🌸 *Beauty Touch Nails* 🌸

¡Hola {user_data['nombre']}!

✅ Tu cita ha sido agendada exitosamente:

📋 Servicio: {service['nombre']}
📅 Fecha: {dia_semana}, {fecha_formateada}
🕐 Hora: {hora_formateada}
💰 Precio: ${service['precio']}

📸 Por favor envía tu comprobante de pago desde tu panel de citas para confirmar tu reserva.

📍 Horarios de atención:
• Lun-Vie: 10:00 am - 7:00 pm
• Sábados: 10:00 am - 3:00 pm
• Domingos: Cerrado

Te enviaremos un recordatorio 24h antes de tu cita.

¡Gracias por confiar en nosotros! ✨"""
        
        send_notification(user_data["telefono"], message, prefer_whatsapp=True)
    
    # Retornar copia sin _id
    return {
        "id": apt_dict["id"],
        "user_id": apt_dict["user_id"],
        "service_id": apt_dict["service_id"],
        "fecha": apt_dict["fecha"],
        "estado": apt_dict["estado"],
        "reminder_sent": apt_dict["reminder_sent"],
        "created_at": apt_dict["created_at"]
    }

@api_router.post("/appointments/{appointment_id}/upload-proof")
async def upload_payment_proof(appointment_id: str, file: UploadFile = File(...), user = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id, "user_id": user["user_id"]}, {"_id": 0})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    contents = await file.read()
    base64_proof = base64.b64encode(contents).decode('utf-8')
    proof_url = f"data:{file.content_type};base64,{base64_proof}"
    
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"comprobante_pago": proof_url, "estado": "confirmada"}}
    )
    
    return {"message": "Comprobante subido exitosamente", "comprobante_url": proof_url}

@api_router.put("/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, estado: str = Form(...), user = Depends(get_admin_user)):
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"estado": estado}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    return {"message": "Estado actualizado"}

@api_router.get("/availability")
async def get_availability(service_id: str, fecha: str):
    fecha_dt = datetime.fromisoformat(fecha)
    appointments = await db.appointments.find({
        "service_id": service_id,
        "estado": {"$ne": "cancelada"}
    }, {"_id": 0}).to_list(1000)
    
    occupied_hours = []
    for apt in appointments:
        apt_date = datetime.fromisoformat(apt["fecha"])
        if apt_date.date() == fecha_dt.date():
            occupied_hours.append(apt_date.strftime("%H:%M"))
    
    return {"occupied_hours": occupied_hours}

@api_router.get("/promotions")
async def get_promotions():
    now = datetime.now(timezone.utc).isoformat()
    promotions = await db.promotions.find({
        "activo": True,
        "fecha_fin": {"$gte": now}
    }, {"_id": 0}).to_list(100)
    return promotions

@api_router.post("/promotions")
async def create_promotion(promotion: PromotionCreate, user = Depends(get_admin_user)):
    promo_dict = {
        "id": str(uuid.uuid4()),
        "codigo": promotion.codigo,
        "descuento_porcentaje": promotion.descuento_porcentaje,
        "descripcion": promotion.descripcion,
        "fecha_inicio": datetime.fromisoformat(promotion.fecha_inicio).isoformat(),
        "fecha_fin": datetime.fromisoformat(promotion.fecha_fin).isoformat(),
        "activo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.promotions.insert_one(promo_dict)
    return promo_dict

@api_router.delete("/promotions/{promotion_id}")
async def delete_promotion(promotion_id: str, user = Depends(get_admin_user)):
    result = await db.promotions.update_one(
        {"id": promotion_id},
        {"$set": {"activo": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    return {"message": "Promoción eliminada"}

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, user = Depends(get_current_user)):
    appointment = await db.appointments.find_one({
        "id": review.appointment_id,
        "user_id": user["user_id"],
        "estado": "confirmada"
    }, {"_id": 0})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada o no confirmada")
    
    existing = await db.reviews.find_one({"appointment_id": review.appointment_id})
    if existing:
        raise HTTPException(status_code=400, detail="Ya has dejado una reseña para esta cita")
    
    review_dict = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "service_id": review.service_id,
        "appointment_id": review.appointment_id,
        "rating": review.rating,
        "comentario": review.comentario,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_dict)
    return {"message": "Reseña creada exitosamente"}

@api_router.get("/reviews/{service_id}")
async def get_service_reviews(service_id: str):
    reviews = await db.reviews.find({"service_id": service_id}, {"_id": 0}).to_list(1000)
    
    for review in reviews:
        user = await db.users.find_one({"id": review["user_id"]}, {"_id": 0, "password": 0})
        review["user_nombre"] = user["nombre"] if user else "Usuario"
    
    return reviews

@api_router.get("/gallery")
async def get_gallery():
    gallery_items = await db.gallery.find({"activo": True}, {"_id": 0}).to_list(100)
    
    for item in gallery_items:
        service = await db.services.find_one({"id": item["service_id"]}, {"_id": 0})
        item["service"] = service
    
    return gallery_items

@api_router.post("/gallery")
async def create_gallery_item(gallery: GalleryCreate, user = Depends(get_admin_user)):
    gallery_dict = {
        "id": str(uuid.uuid4()),
        "service_id": gallery.service_id,
        "titulo": gallery.titulo,
        "descripcion": gallery.descripcion,
        "imagen_antes": "",
        "imagen_despues": "",
        "activo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gallery.insert_one(gallery_dict)
    return gallery_dict

@api_router.post("/gallery/{gallery_id}/upload-before")
async def upload_before_image(gallery_id: str, file: UploadFile = File(...), user = Depends(get_admin_user)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    image_url = f"data:{file.content_type};base64,{base64_image}"
    
    result = await db.gallery.update_one(
        {"id": gallery_id},
        {"$set": {"imagen_antes": image_url}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    return {"imagen_url": image_url}

@api_router.post("/gallery/{gallery_id}/upload-after")
async def upload_after_image(gallery_id: str, file: UploadFile = File(...), user = Depends(get_admin_user)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    image_url = f"data:{file.content_type};base64,{base64_image}"
    
    result = await db.gallery.update_one(
        {"id": gallery_id},
        {"$set": {"imagen_despues": image_url}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    return {"imagen_url": image_url}

@api_router.delete("/gallery/{gallery_id}")
async def delete_gallery_item(gallery_id: str, user = Depends(get_admin_user)):
    result = await db.gallery.update_one(
        {"id": gallery_id},
        {"$set": {"activo": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return {"message": "Item eliminado"}

@api_router.get("/packages")
async def get_packages():
    packages = await db.packages.find({"activo": True}, {"_id": 0}).to_list(100)
    
    for package in packages:
        services = []
        for service_id in package["service_ids"]:
            service = await db.services.find_one({"id": service_id}, {"_id": 0})
            if service:
                services.append(service)
        package["services"] = services
    
    return packages

@api_router.post("/packages")
async def create_package(package: PackageCreate, user = Depends(get_admin_user)):
    precio_original = 0
    
    for service_id in package.service_ids:
        service = await db.services.find_one({"id": service_id}, {"_id": 0})
        if service:
            precio_original += service["precio"]
    
    if precio_original == 0:
        raise HTTPException(status_code=400, detail="No se encontraron servicios válidos")
    
    descuento = ((precio_original - package.precio_paquete) / precio_original) * 100
    
    package_dict = {
        "id": str(uuid.uuid4()),
        "nombre": package.nombre,
        "descripcion": package.descripcion,
        "service_ids": list(package.service_ids),
        "precio_original": float(precio_original),
        "precio_paquete": float(package.precio_paquete),
        "descuento_porcentaje": round(descuento, 1),
        "activo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.packages.insert_one(package_dict.copy())
    
    return {
        "id": package_dict["id"],
        "nombre": package_dict["nombre"],
        "descripcion": package_dict["descripcion"],
        "service_ids": package_dict["service_ids"],
        "precio_original": package_dict["precio_original"],
        "precio_paquete": package_dict["precio_paquete"],
        "descuento_porcentaje": package_dict["descuento_porcentaje"],
        "activo": package_dict["activo"]
    }

@api_router.delete("/packages/{package_id}")
async def delete_package(package_id: str, user = Depends(get_admin_user)):
    result = await db.packages.update_one(
        {"id": package_id},
        {"$set": {"activo": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return {"message": "Paquete eliminado"}

@api_router.get("/stats")
async def get_stats(user = Depends(get_admin_user)):
    total_appointments = await db.appointments.count_documents({})
    pending_appointments = await db.appointments.count_documents({"estado": "pendiente"})
    confirmed_appointments = await db.appointments.count_documents({"estado": "confirmada"})
    total_services = await db.services.count_documents({"activo": True})
    
    return {
        "total_citas": total_appointments,
        "citas_pendientes": pending_appointments,
        "citas_confirmadas": confirmed_appointments,
        "servicios_activos": total_services
    }

@api_router.get("/stats/advanced")
async def get_advanced_stats(user = Depends(get_admin_user)):
    appointments = await db.appointments.find({"estado": "confirmada"}, {"_id": 0}).to_list(10000)
    services = await db.services.find({"activo": True}, {"_id": 0}).to_list(100)
    
    ingresos_por_mes = {}
    servicios_populares = {}
    ocupacion_semanal = {str(i): 0 for i in range(7)}
    
    for apt in appointments:
        service = await db.services.find_one({"id": apt["service_id"]}, {"_id": 0})
        if service:
            apt_date = datetime.fromisoformat(apt["fecha"])
            mes_key = apt_date.strftime("%Y-%m")
            
            ingresos_por_mes[mes_key] = ingresos_por_mes.get(mes_key, 0) + service["precio"]
            
            servicios_populares[service["nombre"]] = servicios_populares.get(service["nombre"], 0) + 1
            
            dia_semana = str(apt_date.weekday())
            ocupacion_semanal[dia_semana] = ocupacion_semanal.get(dia_semana, 0) + 1
    
    ingresos_chart = [{"mes": k, "ingresos": v} for k, v in sorted(ingresos_por_mes.items())]
    
    servicios_chart = [{"servicio": k, "cantidad": v} for k, v in sorted(servicios_populares.items(), key=lambda x: x[1], reverse=True)][:5]
    
    dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    ocupacion_chart = [{"dia": dias[int(k)], "citas": v} for k, v in sorted(ocupacion_semanal.items())]
    
    return {
        "ingresos_mensuales": ingresos_chart,
        "servicios_populares": servicios_chart,
        "ocupacion_semanal": ocupacion_chart
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    scheduler.add_job(send_appointment_reminders, 'interval', hours=1)
    scheduler.start()
    logger.info("Scheduler iniciado - Recordatorios de citas cada hora")

@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client_db.close()
