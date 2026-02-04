import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Gallery({ user, onLogout }) {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API}/gallery`);
      setGalleryItems(response.data);
    } catch (error) {
      console.error('Error cargando galería:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center min-h-screen">
          <p>Cargando galería...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={onLogout} />
      
      <section className="pt-32 pb-20 px-6" data-testid="gallery-page">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 fade-in">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-heading font-medium text-foreground mb-6" data-testid="gallery-title">
              Galería de Trabajos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="gallery-subtitle">
              Descubre la transformación y calidad de nuestros servicios
            </p>
          </div>

          {galleryItems.length === 0 ? (
            <Card className="p-12 text-center shadow-card" data-testid="no-gallery-message">
              <p className="text-muted-foreground">Pronto compartiremos nuestros trabajos más recientes</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {galleryItems.map((item) => (
                <Card key={item.id} className="overflow-hidden shadow-card hover:shadow-float transition-shadow" data-testid={`gallery-item-${item.id}`}>
                  <div className="p-6">
                    <h3 className="text-2xl font-heading font-medium mb-2" data-testid={`gallery-title-${item.id}`}>
                      {item.titulo}
                    </h3>
                    <p className="text-sm text-primary mb-4">{item.service?.nombre}</p>
                    <p className="text-muted-foreground mb-6">{item.descripcion}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2 text-center">Antes</p>
                        {item.imagen_antes && (
                          <img
                            src={item.imagen_antes}
                            alt="Antes"
                            className="w-full h-64 object-cover rounded-lg"
                            data-testid={`before-image-${item.id}`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2 text-center">Después</p>
                        {item.imagen_despues && (
                          <img
                            src={item.imagen_despues}
                            alt="Después"
                            className="w-full h-64 object-cover rounded-lg"
                            data-testid={`after-image-${item.id}`}
                          />
                        )}
                      </div>
                    </div>
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
