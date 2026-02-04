import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, DollarSign, Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Services({ user, onLogout }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const defaultImages = {
    'manicure': 'https://images.unsplash.com/photo-1762121903467-8cf5cc423ba5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwxfHxtYW5pY3VyZSUyMG5haWwlMjBhcnQlMjBlbGVnYW50JTIwY2xvc2UlMjB1cHxlbnwwfHx8fDE3NzAyMTk2NzJ8MA&ixlib=rb-4.1.0&q=85',
    'pedicure': 'https://images.unsplash.com/photo-1638859460750-181fcc7936a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwxfHxwZWRpY3VyZSUyMGZlZXQlMjB3YXRlciUyMHNwYXxlbnwwfHx8fDE3NzAyMTk3MTB8MA&ixlib=rb-4.1.0&q=85',
    'pestañas': 'https://images.unsplash.com/photo-1645017324547-0ae2822147b4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGV5ZWxhc2hlcyUyMGV4dGVuc2lvbnMlMjBiZWF1dHklMjBzYWxvbiUyMGNsb3NlJTIwdXB8ZW58MHx8fHwxNzcwMjE5Njc1fDA&ixlib=rb-4.1.0&q=85',
    'alaciado': 'https://images.unsplash.com/photo-1629397683830-9805395892e8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwzfHxoYWlyJTIwc3RyYWlnaHRlbmluZyUyMHNhbG9uJTIwdHJlYXRtZW50JTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3MDIxOTY5N3ww&ixlib=rb-4.1.0&q=85',
    'uñas': 'https://images.unsplash.com/photo-1762121903467-8cf5cc423ba5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwxfHxtYW5pY3VyZSUyMG5haWwlMjBhcnQlMjBlbGVnYW50JTIwY2xvc2UlMjB1cHxlbnwwfHx8fDE3NzAyMTk2NzJ8MA&ixlib=rb-4.1.0&q=85'
  };

  const getImageForService = (service) => {
    if (service.imagen_url) return service.imagen_url;
    const lowerName = service.nombre.toLowerCase();
    for (const key in defaultImages) {
      if (lowerName.includes(key)) return defaultImages[key];
    }
    return defaultImages['manicure'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center min-h-screen">
          <p>Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={onLogout} />
      
      <section className="pt-32 pb-20 px-6" data-testid="services-page">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 fade-in">
            <h1 className="text-5xl md:text-6xl font-heading font-medium text-foreground mb-6" data-testid="services-title">
              Nuestros Servicios
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="services-subtitle">
              Descubre nuestra amplia gama de servicios de belleza diseñados para realzar tu estilo natural
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card 
                key={service.id} 
                className="overflow-hidden border border-border/50 hover:border-primary/30 service-card-hover shadow-soft hover:shadow-card group"
                data-testid={`service-card-${service.id}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={getImageForService(service)} 
                    alt={service.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    data-testid={`service-image-${service.id}`}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-heading font-medium mb-2" data-testid={`service-name-${service.id}`}>
                    {service.nombre}
                  </h3>
                  <p className="text-muted-foreground mb-4" data-testid={`service-description-${service.id}`}>
                    {service.descripcion}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span data-testid={`service-duration-${service.id}`}>{service.duracion} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-medium text-lg">
                      <DollarSign className="w-5 h-5" />
                      <span data-testid={`service-price-${service.id}`}>{service.precio}</span>
                    </div>
                  </div>
                  {user && user.role === 'cliente' && (
                    <Link to="/reservar" state={{ selectedService: service }}>
                      <Button className="w-full rounded-full btn-primary-hover" data-testid={`service-book-button-${service.id}`}>
                        Reservar Ahora
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-12" data-testid="no-services-message">
              <p className="text-muted-foreground">No hay servicios disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
