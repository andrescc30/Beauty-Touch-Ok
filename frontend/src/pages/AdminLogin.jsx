import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Sparkles, ShieldCheck, Phone } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminLogin({ setUser }) {
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login-admin`, { telefono, password });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      if (response.data.user.is_temp_password) {
        toast.warning('Por favor cambia tu contraseña temporal');
      } else {
        toast.success('¡Bienvenido Administrador!');
      }
      
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" data-testid="admin-login-page">
      <Card className="w-full max-w-md p-8 shadow-card">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="text-2xl font-heading font-medium">Beauty Touch Nails</span>
          </Link>
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-medium mb-2" data-testid="admin-login-title">Panel de Administrador</h1>
          <p className="text-muted-foreground">Ingresa con tu teléfono y contraseña</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6" data-testid="admin-login-form">
          <div className="space-y-2">
            <Label htmlFor="telefono">Número de Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+52..."
                required
                className="h-12 pl-10"
                data-testid="admin-phone-input"
              />
            </div>
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
              data-testid="admin-password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full btn-primary-hover"
            disabled={loading}
            data-testid="admin-login-submit"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-secondary rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Credenciales temporales:</strong><br/>
            Tel: +5219999999999<br/>
            Contraseña: admin123
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary" data-testid="back-to-selection">
            ← Volver a selección
          </Link>
        </div>
      </Card>
    </div>
  );
}
