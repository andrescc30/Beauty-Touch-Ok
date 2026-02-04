import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, Award, Heart } from 'lucide-react';

export default function Landing({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={onLogout} />
      
      <section 
        className="relative pt-32 pb-20 px-6 min-h-screen flex items-center" 
        style={{
          backgroundImage: `linear-gradient(rgba(253, 252, 248, 0.85), rgba(249, 245, 242, 0.9)), url('https://images.unsplash.com/photo-1763873993447-1d0be71a96d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwc3BhJTIwaW50ZXJpb3IlMjBiZWlnZSUyMG1pbmltYWxpc3R8ZW58MHx8fHwxNzcwMjE5NjY4fDA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        data-testid="hero-section"
      >
        <div className="container mx-auto max-w-6xl text-center fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-medium text-foreground mb-6" data-testid="hero-title">
            Beauty Touch Nails
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="hero-subtitle">
            Donde la elegancia se encuentra con el cuidado personalizado. Descubre nuestros servicios de belleza premium.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/servicios" data-testid="hero-services-button">
              <Button className="rounded-full px-8 py-6 text-lg shadow-soft hover:shadow-float btn-primary-hover">
                Ver Servicios
              </Button>
            </Link>
            {!user && (
              <Link to="/register" data-testid="hero-register-button">
                <Button variant="outline" className="rounded-full px-8 py-6 text-lg border-2">
                  Registrarse
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-secondary" data-testid="features-section">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-heading font-medium text-center mb-16" data-testid="features-title">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-card rounded-xl shadow-soft" data-testid="feature-quality">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-heading mb-3">Calidad Premium</h3>
              <p className="text-muted-foreground">Productos de la más alta calidad para resultados excepcionales</p>
            </div>
            <div className="text-center p-8 bg-card rounded-xl shadow-soft" data-testid="feature-professionals">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-heading mb-3">Profesionales Expertos</h3>
              <p className="text-muted-foreground">Nuestro equipo está capacitado y certificado en las últimas técnicas</p>
            </div>
            <div className="text-center p-8 bg-card rounded-xl shadow-soft" data-testid="feature-attention">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-heading mb-3">Atención Personalizada</h3>
              <p className="text-muted-foreground">Cada cliente recibe un servicio único y adaptado a sus necesidades</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6" data-testid="cta-section">
        <div className="container mx-auto max-w-4xl text-center">
          <Clock className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-heading font-medium mb-6" data-testid="cta-title">
            Agenda tu cita hoy
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            No esperes más para lucir radiante. Reserva tu cita ahora y disfruta de nuestros servicios.
          </p>
          <Link to={user ? "/reservar" : "/register"} data-testid="cta-button">
            <Button className="rounded-full px-8 py-6 text-lg shadow-soft hover:shadow-float btn-primary-hover">
              {user ? 'Reservar Ahora' : 'Comenzar'}
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-secondary py-8 px-6" data-testid="footer">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Beauty Touch Nails. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
