import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Clock, Upload, CheckCircle, XCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClientDashboard({ user, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRefs = useRef({});
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      toast.error('Error cargando citas');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (appointmentId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/appointments/${appointmentId}/upload-proof`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      toast.success('Comprobante subido exitosamente');
      fetchAppointments();
    } catch (error) {
      toast.error('Error al subir el comprobante');
    }
  };

  const getStatusBadge = (estado) => {
    const variants = {
      pendiente: { variant: 'outline', className: 'border-yellow-500 text-yellow-700', icon: Clock },
      confirmada: { variant: 'default', className: 'bg-green-500 hover:bg-green-600', icon: CheckCircle },
      cancelada: { variant: 'destructive', className: '', icon: XCircle }
    };

    const config = variants[estado] || variants.pendiente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`${config.className} gap-1`} data-testid={`status-badge-${estado}`}>
        <Icon className="w-3 h-3" />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center min-h-screen">
          <p>Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={onLogout} />
      
      <section className="pt-32 pb-20 px-6" data-testid="client-dashboard">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 fade-in">
            <h1 className="text-5xl md:text-6xl font-heading font-medium text-foreground mb-4" data-testid="dashboard-title">
              Mis Citas
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="dashboard-subtitle">
              Gestiona tus reservaciones y sube tus comprobantes de pago
            </p>
          </div>

          {appointments.length === 0 ? (
            <Card className="p-12 text-center shadow-card" data-testid="no-appointments-card">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-heading mb-2">No tienes citas agendadas</h3>
              <p className="text-muted-foreground mb-6">¡Comienza reservando tu primer servicio!</p>
              <Button className="rounded-full btn-primary-hover" onClick={() => window.location.href = '/reservar'} data-testid="book-first-appointment-button">
                Reservar Ahora
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {appointments.map((apt) => (
                <Card key={apt.id} className="p-6 shadow-card hover:shadow-float transition-shadow" data-testid={`appointment-card-${apt.id}`}>
                  <div className="flex flex-col md:flex-row gap-6">
                    {apt.service?.imagen_url && (
                      <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={apt.service.imagen_url} 
                          alt={apt.service.nombre}
                          className="w-full h-full object-cover"
                          data-testid={`appointment-service-image-${apt.id}`}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-2xl font-heading font-medium mb-1" data-testid={`appointment-service-name-${apt.id}`}>
                            {apt.service?.nombre}
                          </h3>
                          <p className="text-muted-foreground flex items-center gap-2" data-testid={`appointment-date-${apt.id}`}>
                            <Calendar className="w-4 h-4" />
                            {formatDate(apt.fecha)}
                          </p>
                        </div>
                        {getStatusBadge(apt.estado)}
                      </div>
                      
                      <p className="text-muted-foreground mb-4" data-testid={`appointment-description-${apt.id}`}>
                        {apt.service?.descripcion}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {apt.service?.duracion} min
                        </span>
                        <span className="text-primary font-medium text-lg" data-testid={`appointment-price-${apt.id}`}>
                          ${apt.service?.precio}
                        </span>
                      </div>
                      
                      {apt.estado === 'pendiente' && !apt.comprobante_pago && (
                        <div className="mt-4 p-4 bg-secondary rounded-lg">
                          <p className="text-sm text-muted-foreground mb-3">
                            Sube tu comprobante de pago para confirmar tu cita
                          </p>
                          <input
                            type="file"
                            ref={(el) => (fileInputRefs.current[apt.id] = el)}
                            onChange={(e) => handleFileUpload(apt.id, e.target.files[0])}
                            accept="image/*,.pdf"
                            className="hidden"
                            data-testid={`file-input-${apt.id}`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRefs.current[apt.id]?.click()}
                            className="gap-2"
                            data-testid={`upload-proof-button-${apt.id}`}
                          >
                            <Upload className="w-4 h-4" />
                            Subir Comprobante
                          </Button>
                        </div>
                      )}
                      
                      {apt.comprobante_pago && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid={`proof-uploaded-${apt.id}`}>
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Comprobante recibido - En revisión
                          </p>
                        </div>
                      )}
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
