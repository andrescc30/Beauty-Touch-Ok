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
twilio_client = None
if twilio_account_sid and twilio_auth_token:
    twilio_client = Client(twilio_account_sid, twilio_auth_token)

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    telefono: str
    role: str = "cliente"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: str
    precio: float
    duracion: int
    imagen_url: Optional[str] = None
    activo: bool = True
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
    if twilio_client and twilio_phone:
        try:
            twilio_client.messages.create(
                body=message,
                from_=twilio_phone,
                to=phone
            )
        except Exception as e:
            logging.error(f"Error enviando SMS: {str(e)}")

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

@api_router.get("/services")
async def get_services():
    services = await db.services.find({"activo": True}, {"_id": 0}).to_list(100)
    return services

@api_router.post("/services")
async def create_service(service: ServiceCreate, user = Depends(get_admin_user)):
    service_dict = Service(**service.model_dump()).model_dump()
    service_dict["created_at"] = service_dict["created_at"].isoformat()
    await db.services.insert_one(service_dict)
    # Return without _id field
    service_dict.pop("_id", None)
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appointments.insert_one(apt_dict)
    
    user_data = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    service = await db.services.find_one({"id": appointment.service_id}, {"_id": 0})
    
    if user_data and service:
        message = f"Beauty Touch Nails: Tu cita de {service['nombre']} ha sido agendada para el {appointment.fecha} a las {appointment.hora}. Por favor envía tu comprobante de pago."
        send_sms_notification(user_data["telefono"], message)
    
    # Return without _id field
    apt_dict.pop("_id", None)
    return apt_dict

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
    # Return without _id field
    promo_dict.pop("_id", None)
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client_db.close()
