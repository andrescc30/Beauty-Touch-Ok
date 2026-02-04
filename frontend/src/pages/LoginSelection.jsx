import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldCheck, User } from 'lucide-react';

export default function LoginSelection() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" data-testid="login-selection-page">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
            <span className="text-3xl font-heading font-medium">Beauty Touch Nails</span>
          </Link>
          <h1 className="text-4xl font-heading font-medium mb-3" data-testid="selection-title">
            Bienvenido
          </h1>
          <p className="text-lg text-muted-foreground">
            Selecciona cómo deseas ingresar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 shadow-card hover:shadow-float transition-all service-card-hover" data-testid="client-login-card">
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-medium mb-3">Soy Cliente</h2>
              <p className="text-muted-foreground mb-6">
                Ingresa con tu número de teléfono para reservar citas y gestionar tus servicios
              </p>
              <Link to="/login/cliente">
                <Button className="w-full rounded-full btn-primary-hover h-12" data-testid="client-login-button">
                  Ingresar como Cliente
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Regístrate
                </Link>
              </p>
            </div>
          </Card>

          <Card className="p-8 shadow-card hover:shadow-float transition-all service-card-hover" data-testid="admin-login-card">
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-medium mb-3">Soy Administrador</h2>
              <p className="text-muted-foreground mb-6">
                Accede al panel de administración con tus credenciales de administrador
              </p>
              <Link to="/login/admin">
                <Button className="w-full rounded-full btn-primary-hover h-12" data-testid="admin-login-button">
                  Ingresar como Admin
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
