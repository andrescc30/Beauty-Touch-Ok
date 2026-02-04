#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://beauty-touch-app.preview.emergentagent.com/api"

def test_appointment_creation():
    print("Testing appointment creation...")
    
    # 1. Register a client
    print("1. Registering client...")
    register_data = {
        "email": f"test_simple_{datetime.now().strftime('%H%M%S')}@test.com",
        "password": "testpass123",
        "nombre": "Simple Test User",
        "telefono": "+521234567890",
        "role": "cliente"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data, timeout=10)
        if response.status_code != 200:
            print(f"Registration failed: {response.status_code}")
            return False
        
        token = response.json()["token"]
        print("✅ Registration successful")
        
        # 2. Get services
        print("2. Getting services...")
        services_response = requests.get(f"{BASE_URL}/services", timeout=10)
        if services_response.status_code != 200:
            print(f"Services fetch failed: {services_response.status_code}")
            return False
        
        services = services_response.json()
        if not services:
            print("No services found")
            return False
        
        service_id = services[0]["id"]
        print(f"✅ Found service: {service_id}")
        
        # 3. Create appointment
        print("3. Creating appointment...")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        appointment_data = {
            "service_id": service_id,
            "fecha": tomorrow,
            "hora": "16:00"
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        appointment_response = requests.post(
            f"{BASE_URL}/appointments", 
            json=appointment_data, 
            headers=headers, 
            timeout=10
        )
        
        print(f"Appointment response status: {appointment_response.status_code}")
        if appointment_response.status_code == 200:
            appointment = appointment_response.json()
            print(f"✅ Appointment created: {appointment['id']}")
            return True
        else:
            print(f"❌ Appointment creation failed: {appointment_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_appointment_creation()
    print(f"Test {'PASSED' if success else 'FAILED'}")