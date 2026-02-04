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

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      toast.success('¡Bienvenido!');
      
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" data-testid="login-page">
      <Card className="w-full max-w-md p-8 shadow-card">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="text-2xl font-heading font-medium">Beauty Touch Nails</span>
          </Link>
          <h1 className="text-3xl font-heading font-medium mb-2" data-testid="login-title">Iniciar Sesión</h1>
          <p className="text-muted-foreground">Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
              data-testid="login-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
              data-testid="login-password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full btn-primary-hover"
            disabled={loading}
            data-testid="login-submit-button"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-primary hover:underline" data-testid="login-register-link">
            Regístrate
          </Link>
        </p>
      </Card>
    </div>
  );
}
