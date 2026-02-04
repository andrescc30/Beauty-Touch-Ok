import requests
import sys
import json
import base64
from datetime import datetime, timedelta
import uuid

class BeautyTouchAPITester:
    def __init__(self, base_url="https://beauty-touch-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.client_token = None
        self.test_user_id = None
        self.test_service_id = None
        self.test_appointment_id = None
        self.test_promotion_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            self.failed_tests.append({"name": name, "details": details})
            print(f"❌ {name} - FAILED: {details}")

    def make_request(self, method, endpoint, data=None, token=None, files=None):
        """Make HTTP request with proper error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if files:
            headers.pop('Content-Type', None)  # Let requests set it for multipart
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=headers, files=files, data=data, timeout=30)
                else:
                    response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == 'PUT':
                if files:
                    response = requests.put(url, headers=headers, files=files, data=data, timeout=30)
                else:
                    response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            return response
        except Exception as e:
            print(f"Request error: {str(e)}")
            return None

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n🔐 Testing Admin Login...")
        response = self.make_request('POST', 'auth/login', {
            'email': 'admin@beautytouchnails.com',
            'password': 'admin123'
        })
        
        if response and response.status_code == 200:
            data = response.json()
            if 'token' in data and data['user']['role'] == 'admin':
                self.admin_token = data['token']
                self.log_test("Admin Login", True)
                return True
            else:
                self.log_test("Admin Login", False, "Invalid response structure")
        else:
            self.log_test("Admin Login", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_client_registration(self):
        """Test client registration"""
        print("\n👤 Testing Client Registration...")
        test_email = f"test_client_{datetime.now().strftime('%H%M%S')}@test.com"
        
        response = self.make_request('POST', 'auth/register', {
            'email': test_email,
            'password': 'testpass123',
            'nombre': 'Test Client',
            'telefono': '+521234567890',
            'role': 'cliente'
        })
        
        if response and response.status_code == 200:
            data = response.json()
            if 'token' in data and data['user']['role'] == 'cliente':
                self.client_token = data['token']
                self.test_user_id = data['user']['id']
                self.log_test("Client Registration", True)
                return True
            else:
                self.log_test("Client Registration", False, "Invalid response structure")
        else:
            self.log_test("Client Registration", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_client_login(self):
        """Test client login after registration"""
        print("\n🔐 Testing Client Login...")
        # First register a client
        test_email = f"login_test_{datetime.now().strftime('%H%M%S')}@test.com"
        
        # Register
        reg_response = self.make_request('POST', 'auth/register', {
            'email': test_email,
            'password': 'testpass123',
            'nombre': 'Login Test Client',
            'telefono': '+521234567891',
            'role': 'cliente'
        })
        
        if not reg_response or reg_response.status_code != 200:
            self.log_test("Client Login (Registration Step)", False, "Failed to register test user")
            return False
        
        # Now test login
        login_response = self.make_request('POST', 'auth/login', {
            'email': test_email,
            'password': 'testpass123'
        })
        
        if login_response and login_response.status_code == 200:
            data = login_response.json()
            if 'token' in data and data['user']['role'] == 'cliente':
                self.log_test("Client Login", True)
                return True
            else:
                self.log_test("Client Login", False, "Invalid response structure")
        else:
            self.log_test("Client Login", False, f"Status: {login_response.status_code if login_response else 'No response'}")
        return False

    def test_get_services_public(self):
        """Test getting services without authentication (public)"""
        print("\n📋 Testing Public Services Catalog...")
        response = self.make_request('GET', 'services')
        
        if response and response.status_code == 200:
            services = response.json()
            if isinstance(services, list) and len(services) >= 5:
                # Store first service for booking tests
                if services:
                    self.test_service_id = services[0]['id']
                self.log_test("Public Services Catalog", True, f"Found {len(services)} services")
                return True
            else:
                self.log_test("Public Services Catalog", False, f"Expected at least 5 services, got {len(services) if isinstance(services, list) else 'invalid format'}")
        else:
            self.log_test("Public Services Catalog", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_create_appointment(self):
        """Test creating an appointment"""
        print("\n📅 Testing Appointment Creation...")
        if not self.client_token or not self.test_service_id:
            self.log_test("Appointment Creation", False, "Missing client token or service ID")
            return False
        
        # Create appointment for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        print(f"  Using service_id: {self.test_service_id}")
        print(f"  Using date: {tomorrow}")
        print(f"  Using client token: {self.client_token[:20]}...")
        
        response = self.make_request('POST', 'appointments', {
            'service_id': self.test_service_id,
            'fecha': tomorrow,
            'hora': '10:00'
        }, token=self.client_token)
        
        if response:
            print(f"  Response status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    self.test_appointment_id = data['id']
                    self.log_test("Appointment Creation", True)
                    return True
                else:
                    self.log_test("Appointment Creation", False, "No appointment ID in response")
            else:
                try:
                    error_detail = response.json()
                    self.log_test("Appointment Creation", False, f"Status: {response.status_code}, Detail: {error_detail}")
                except:
                    self.log_test("Appointment Creation", False, f"Status: {response.status_code}")
        else:
            self.log_test("Appointment Creation", False, "No response received")
        return False

    def test_double_booking_prevention(self):
        """Test that double booking is prevented"""
        print("\n🚫 Testing Double Booking Prevention...")
        if not self.client_token or not self.test_service_id:
            self.log_test("Double Booking Prevention", False, "Missing client token or service ID")
            return False
        
        # Try to book the same time slot again
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        response = self.make_request('POST', 'appointments', {
            'service_id': self.test_service_id,
            'fecha': tomorrow,
            'hora': '10:00'  # Same time as previous test
        }, token=self.client_token)
        
        # Should fail with 400 status
        if response and response.status_code == 400:
            self.log_test("Double Booking Prevention", True)
            return True
        else:
            self.log_test("Double Booking Prevention", False, f"Expected 400, got {response.status_code if response else 'No response'}")
        return False

    def test_get_client_appointments(self):
        """Test getting client appointments"""
        print("\n📋 Testing Client Appointments Retrieval...")
        if not self.client_token:
            self.log_test("Client Appointments Retrieval", False, "Missing client token")
            return False
        
        response = self.make_request('GET', 'appointments', token=self.client_token)
        
        if response and response.status_code == 200:
            appointments = response.json()
            if isinstance(appointments, list):
                self.log_test("Client Appointments Retrieval", True, f"Found {len(appointments)} appointments")
                return True
            else:
                self.log_test("Client Appointments Retrieval", False, "Invalid response format")
        else:
            self.log_test("Client Appointments Retrieval", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_upload_payment_proof(self):
        """Test uploading payment proof"""
        print("\n💳 Testing Payment Proof Upload...")
        if not self.client_token or not self.test_appointment_id:
            self.log_test("Payment Proof Upload", False, "Missing client token or appointment ID")
            return False
        
        # Create a dummy image file
        dummy_image = base64.b64decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A')
        
        files = {'file': ('test_receipt.jpg', dummy_image, 'image/jpeg')}
        
        response = self.make_request('POST', f'appointments/{self.test_appointment_id}/upload-proof', 
                                   files=files, token=self.client_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'message' in data:
                self.log_test("Payment Proof Upload", True)
                return True
            else:
                self.log_test("Payment Proof Upload", False, "Invalid response structure")
        else:
            self.log_test("Payment Proof Upload", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        print("\n📊 Testing Admin Statistics...")
        if not self.admin_token:
            self.log_test("Admin Statistics", False, "Missing admin token")
            return False
        
        response = self.make_request('GET', 'stats', token=self.admin_token)
        
        if response and response.status_code == 200:
            stats = response.json()
            required_fields = ['total_citas', 'citas_pendientes', 'citas_confirmadas', 'servicios_activos']
            if all(field in stats for field in required_fields):
                self.log_test("Admin Statistics", True)
                return True
            else:
                self.log_test("Admin Statistics", False, "Missing required fields in stats")
        else:
            self.log_test("Admin Statistics", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_admin_create_service(self):
        """Test admin service creation"""
        print("\n🛠️ Testing Admin Service Creation...")
        if not self.admin_token:
            self.log_test("Admin Service Creation", False, "Missing admin token")
            return False
        
        service_data = {
            'nombre': f'Test Service {datetime.now().strftime("%H%M%S")}',
            'descripcion': 'Test service description',
            'precio': 100.0,
            'duracion': 60
        }
        
        response = self.make_request('POST', 'services', service_data, token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'id' in data:
                self.log_test("Admin Service Creation", True)
                return True
            else:
                self.log_test("Admin Service Creation", False, "No service ID in response")
        else:
            self.log_test("Admin Service Creation", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_admin_get_all_appointments(self):
        """Test admin getting all appointments"""
        print("\n📋 Testing Admin All Appointments Retrieval...")
        if not self.admin_token:
            self.log_test("Admin All Appointments Retrieval", False, "Missing admin token")
            return False
        
        response = self.make_request('GET', 'appointments', token=self.admin_token)
        
        if response and response.status_code == 200:
            appointments = response.json()
            if isinstance(appointments, list):
                self.log_test("Admin All Appointments Retrieval", True, f"Found {len(appointments)} appointments")
                return True
            else:
                self.log_test("Admin All Appointments Retrieval", False, "Invalid response format")
        else:
            self.log_test("Admin All Appointments Retrieval", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_admin_update_appointment_status(self):
        """Test admin updating appointment status"""
        print("\n✏️ Testing Admin Appointment Status Update...")
        if not self.admin_token or not self.test_appointment_id:
            self.log_test("Admin Appointment Status Update", False, "Missing admin token or appointment ID")
            return False
        
        # Use form data as expected by the endpoint
        form_data = {'estado': 'confirmada'}
        
        response = self.make_request('PUT', f'appointments/{self.test_appointment_id}/status', 
                                   data=form_data, token=self.admin_token, files={})
        
        if response and response.status_code == 200:
            self.log_test("Admin Appointment Status Update", True)
            return True
        else:
            self.log_test("Admin Appointment Status Update", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_admin_create_promotion(self):
        """Test admin promotion creation"""
        print("\n🎯 Testing Admin Promotion Creation...")
        if not self.admin_token:
            self.log_test("Admin Promotion Creation", False, "Missing admin token")
            return False
        
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        promotion_data = {
            'codigo': f'TEST{datetime.now().strftime("%H%M%S")}',
            'descuento_porcentaje': 20.0,
            'descripcion': 'Test promotion',
            'fecha_inicio': start_date,
            'fecha_fin': end_date
        }
        
        response = self.make_request('POST', 'promotions', promotion_data, token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'id' in data:
                self.test_promotion_id = data['id']
                self.log_test("Admin Promotion Creation", True)
                return True
            else:
                self.log_test("Admin Promotion Creation", False, "No promotion ID in response")
        else:
            self.log_test("Admin Promotion Creation", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_get_promotions(self):
        """Test getting active promotions"""
        print("\n🎁 Testing Promotions Retrieval...")
        response = self.make_request('GET', 'promotions')
        
        if response and response.status_code == 200:
            promotions = response.json()
            if isinstance(promotions, list):
                self.log_test("Promotions Retrieval", True, f"Found {len(promotions)} promotions")
                return True
            else:
                self.log_test("Promotions Retrieval", False, "Invalid response format")
        else:
            self.log_test("Promotions Retrieval", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_availability_check(self):
        """Test availability checking"""
        print("\n🕐 Testing Availability Check...")
        if not self.test_service_id:
            self.log_test("Availability Check", False, "Missing service ID")
            return False
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        response = self.make_request('GET', 'availability', {
            'service_id': self.test_service_id,
            'fecha': tomorrow
        })
        
        if response and response.status_code == 200:
            data = response.json()
            if 'occupied_hours' in data and isinstance(data['occupied_hours'], list):
                self.log_test("Availability Check", True)
                return True
            else:
                self.log_test("Availability Check", False, "Invalid response structure")
        else:
            self.log_test("Availability Check", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Beauty Touch Nails API Testing...")
        print(f"Testing against: {self.base_url}")
        
        # Authentication tests
        self.test_admin_login()
        self.test_client_registration()
        self.test_client_login()
        
        # Public endpoints
        self.test_get_services_public()
        self.test_get_promotions()
        
        # Client functionality
        self.test_create_appointment()
        self.test_double_booking_prevention()
        self.test_get_client_appointments()
        self.test_upload_payment_proof()
        self.test_availability_check()
        
        # Admin functionality
        self.test_admin_stats()
        self.test_admin_create_service()
        self.test_admin_get_all_appointments()
        self.test_admin_update_appointment_status()
        self.test_admin_create_promotion()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BeautyTouchAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())