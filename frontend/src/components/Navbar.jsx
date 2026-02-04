import { Link } from 'react-router-dom';
import { Sparkles, Calendar, User, LogOut, ShieldCheck, Camera, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-border/20" data-testid="main-navbar">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-heading font-medium text-foreground">Beauty Touch Nails</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/servicios" className="text-foreground hover:text-primary transition-colors" data-testid="nav-services-link">
              Servicios
            </Link>
            
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link to="/admin" data-testid="nav-admin-link">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Panel Admin
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/reservar" data-testid="nav-booking-link">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Reservar
                      </Button>
                    </Link>
                    <Link to="/dashboard" data-testid="nav-dashboard-link">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <User className="w-4 h-4" />
                        Mis Citas
                      </Button>
                    </Link>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLogout} 
                  className="gap-2" 
                  data-testid="nav-logout-button"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="nav-login-link">
                  <Button variant="ghost" size="sm">Ingresar</Button>
                </Link>
                <Link to="/register" data-testid="nav-register-link">
                  <Button className="rounded-full btn-primary-hover" size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
