import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Register({ setUser }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        ...formData,
        role: 'cliente'
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" data-testid="register-page">
      <Card className="w-full max-w-md p-8 shadow-card">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="text-2xl font-heading font-medium">Beauty Touch Nails</span>
          </Link>
          <h1 className="text-3xl font-heading font-medium mb-2" data-testid="register-title">Crear Cuenta</h1>
          <p className="text-muted-foreground">Regístrate para reservar tu cita</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6" data-testid="register-form">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="h-12"
              data-testid="register-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="h-12"
              data-testid="register-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono (con código de país, ej: +52...)</Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              placeholder="+52..."
              value={formData.telefono}
              onChange={handleChange}
              required
              className="h-12"
              data-testid="register-phone-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="h-12"
              data-testid="register-password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full btn-primary-hover"
            disabled={loading}
            data-testid="register-submit-button"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </Button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline" data-testid="register-login-link">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
