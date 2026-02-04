import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Booking({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(location.state?.selectedService?.id || '');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [occupiedHours, setOccupiedHours] = useState([]);
  const [loading, setLoading] = useState(false);

  // Horarios de atención según el día
  const getTimeSlotsForDate = (dateString) => {
    if (!dateString) return [];
    
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    // Domingo cerrado
    if (dayOfWeek === 0) {
      return [];
    }
    
    // Sábado: 10:00 am - 3:00 pm
    if (dayOfWeek === 6) {
      return ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
    }
    
    // Lunes a Viernes: 10:00 am - 7:00 pm
    return ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  };

  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService && fecha) {
      fetchAvailability();
      const slots = getTimeSlotsForDate(fecha);
      setAvailableSlots(slots);
      setHora(''); // Reset hora when date changes
    }
  }, [selectedService, fecha]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      toast.error('Error cargando servicios');
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${API}/availability`, {
        params: { service_id: selectedService, fecha }
      });
      setOccupiedHours(response.data.occupied_hours);
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !fecha || !hora) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/appointments`,
        {
          service_id: selectedService,
          fecha,
          hora
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Cita agendada exitosamente. Revisa tu teléfono para la confirmación.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al agendar la cita');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isDayClosed = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString + 'T00:00:00');
    return date.getDay() === 0; // Domingo
  };

  const getScheduleMessage = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) {
      return '❌ Cerrado los domingos';
    } else if (dayOfWeek === 6) {
      return '🕐 Sábado: 10:00 am - 3:00 pm';
    } else {
      return '🕐 Lunes a Viernes: 10:00 am - 7:00 pm';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={onLogout} />
      
      <section className="pt-32 pb-20 px-6" data-testid="booking-page">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12 fade-in">
            <h1 className="text-5xl md:text-6xl font-heading font-medium text-foreground mb-6" data-testid="booking-title">
              Reservar Cita
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="booking-subtitle">
              Selecciona el servicio, fecha y hora de tu preferencia
            </p>
          </div>

          <Card className="p-8 shadow-card" data-testid="booking-form-card">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="service">Servicio</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="h-12" data-testid="service-select">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id} data-testid={`service-option-${service.id}`}>
                        {service.nombre} - ${service.precio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="fecha"
                    type="date"
                    min={getTodayDate()}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="h-12 pl-10"
                    data-testid="date-input"
                  />
                </div>
                {fecha && (
                  <p className={`text-sm ${isDayClosed(fecha) ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {getScheduleMessage(fecha)}
                  </p>
                )}
              </div>

              {fecha && selectedService && !isDayClosed(fecha) && (
                <div className="space-y-2">
                  <Label>Hora Disponible</Label>
                  {availableSlots.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay horarios disponibles para esta fecha</p>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {availableSlots.map((time) => {
                        const isOccupied = occupiedHours.includes(time);
                        return (
                          <Button
                            key={time}
                            type="button"
                            variant={hora === time ? 'default' : 'outline'}
                            className={`h-12 ${
                              isOccupied ? 'opacity-50 cursor-not-allowed' : 'btn-primary-hover'
                            }`}
                            onClick={() => !isOccupied && setHora(time)}
                            disabled={isOccupied}
                            data-testid={`time-slot-${time}`}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            {time}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {fecha && isDayClosed(fecha) && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-center font-medium">
                    ❌ Cerrado los domingos. Por favor selecciona otro día.
                  </p>
                </div>
              )}

              <Button
                onClick={handleBooking}
                disabled={loading || !selectedService || !fecha || !hora}
                className="w-full h-12 rounded-full btn-primary-hover mt-8"
                data-testid="confirm-booking-button"
              >
                {loading ? 'Agendando...' : 'Confirmar Reserva'}
              </Button>
            </div>
          </Card>

          <div className="mt-8 p-6 bg-secondary rounded-xl" data-testid="booking-info">
            <h3 className="font-heading text-xl mb-3">Horarios de Atención:</h3>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li>🕐 <strong>Lunes a Viernes:</strong> 10:00 am - 7:00 pm</li>
              <li>🕐 <strong>Sábados:</strong> 10:00 am - 3:00 pm</li>
              <li>❌ <strong>Domingos:</strong> Cerrado</li>
            </ul>
            <h3 className="font-heading text-xl mb-3">Importante:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Recibirás confirmación por WhatsApp al agendar</li>
              <li>• Te enviaremos un recordatorio 24h antes de tu cita</li>
              <li>• Deberás subir tu comprobante de pago desde tu panel</li>
              <li>• Tu cita será confirmada una vez validemos el pago</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
