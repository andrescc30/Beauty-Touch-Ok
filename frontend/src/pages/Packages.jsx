import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { Package2, Clock, DollarSign, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Packages({ user, onLogout }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error cargando paquetes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center min-h-screen">
          <p>Cargando paquetes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={onLogout} />
      
      <section className="pt-32 pb-20 px-6" data-testid="packages-page">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 fade-in">
            <Package2 className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-heading font-medium text-foreground mb-6" data-testid="packages-title">
              Paquetes y Combos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="packages-subtitle">
              Ahorra con nuestros paquetes especiales de servicios combinados
            </p>
          </div>

          {packages.length === 0 ? (
            <Card className="p-12 text-center shadow-card" data-testid="no-packages-message">
              <p className="text-muted-foreground">Pronto tendremos paquetes especiales disponibles</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden shadow-card hover:shadow-float transition-all service-card-hover" data-testid={`package-card-${pkg.id}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-heading font-medium" data-testid={`package-name-${pkg.id}`}>
                        {pkg.nombre}
                      </h3>
                      <Badge className="bg-green-500 hover:bg-green-600" data-testid={`package-discount-${pkg.id}`}>
                        -{pkg.descuento_porcentaje}%
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-6">{pkg.descripcion}</p>
                    
                    <div className="space-y-3 mb-6">
                      <p className="text-sm font-medium">Incluye:</p>
                      {pkg.services?.map((service) => (
                        <div key={service.id} className="flex items-center gap-2 text-sm" data-testid={`package-service-${pkg.id}-${service.id}`}>
                          <Check className="w-4 h-4 text-primary" />
                          <span>{service.nombre}</span>
                          <span className="text-muted-foreground ml-auto">{service.duracion} min</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4 mb-6">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>Precio individual:</span>
                        <span className="line-through" data-testid={`package-original-price-${pkg.id}`}>${pkg.precio_original}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Precio paquete:</span>
                        <span className="text-2xl font-heading font-medium text-primary" data-testid={`package-price-${pkg.id}`}>
                          ${pkg.precio_paquete}
                        </span>
                      </div>
                    </div>
                    
                    {user && user.role === 'cliente' && (
                      <Button className="w-full rounded-full btn-primary-hover" data-testid={`package-book-button-${pkg.id}`}>
                        Reservar Paquete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
