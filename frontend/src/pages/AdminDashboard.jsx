import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart3, Calendar, Package, Tag, Plus, Edit, Trash2, Upload, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({});
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [serviceForm, setServiceForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion: ''
  });
  const [promotionForm, setPromotionForm] = useState({
    codigo: '',
    descuento_porcentaje: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [editingService, setEditingService] = useState(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingServiceId, setUploadingServiceId] = useState(null);
  const [showTempPasswordWarning, setShowTempPasswordWarning] = useState(false);

  useEffect(() => {
    fetchData();
    // Check if user has temp password
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.is_temp_password) {
      setShowTempPasswordWarning(true);
    }
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statsRes, servicesRes, appointmentsRes, promotionsRes] = await Promise.all([
        axios.get(`${API}/stats`, { headers }),
        axios.get(`${API}/services`),
        axios.get(`${API}/appointments`, { headers }),
        axios.get(`${API}/promotions`)
      ]);

      setStats(statsRes.data);
      setServices(servicesRes.data);
      setAppointments(appointmentsRes.data);
      setPromotions(promotionsRes.data);
    } catch (error) {
      toast.error('Error cargando datos');
    }
  };

  const handleCreateService = async () => {
    if (!serviceForm.nombre || !serviceForm.precio || !serviceForm.duracion) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/services`, serviceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Servicio creado exitosamente');
      setServiceForm({ nombre: '', descripcion: '', precio: '', duracion: '' });
      setIsServiceDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al crear servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/services/${editingService}`, serviceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Servicio actualizado');
      setEditingService(null);
      setServiceForm({ nombre: '', descripcion: '', precio: '', duracion: '' });
      setIsServiceDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Servicio eliminado');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar servicio');
    }
  };

  const handleImageUpload = async (serviceId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingServiceId(serviceId);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/services/${serviceId}/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Imagen subida exitosamente');
      fetchData();
    } catch (error) {
      toast.error('Error al subir imagen');
    } finally {
      setUploadingServiceId(null);
    }
  };

  const handleCreatePromotion = async () => {
    if (!promotionForm.codigo || !promotionForm.descuento_porcentaje) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/promotions`, promotionForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Promoción creada exitosamente');
      setPromotionForm({ codigo: '', descuento_porcentaje: '', descripcion: '', fecha_inicio: '', fecha_fin: '' });
      setIsPromotionDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al crear promoción');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!confirm('¿Eliminar esta promoción?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/promotions/${promotionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Promoción eliminada');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar promoción');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/auth/change-password`,
        {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('Contraseña actualizada exitosamente');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setIsPasswordDialogOpen(false);
      setShowTempPasswordWarning(false);
      
      // Update user in localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      userData.is_temp_password = false;
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al cambiar contraseña');
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('estado', newStatus);
      
      await axios.put(`${API}/appointments/${appointmentId}/status`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Estado actualizado');
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  const openEditDialog = (service) => {
    setEditingService(service.id);
    setServiceForm({
      nombre: service.nombre,
      descripcion: service.descripcion,
      precio: service.precio.toString(),
      duracion: service.duracion.toString()
    });
    setIsServiceDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={onLogout} />
      
      <section className="pt-32 pb-20 px-6" data-testid="admin-dashboard">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 fade-in">
            <h1 className="text-5xl md:text-6xl font-heading font-medium text-foreground mb-4" data-testid="admin-title">
              Panel de Administración
            </h1>
            <p className="text-lg text-muted-foreground">
              Gestiona servicios, citas y promociones
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto" data-testid="admin-tabs">
              <TabsTrigger value="stats" className="gap-2" data-testid="tab-stats">
                <BarChart3 className="w-4 h-4" />
                Estadísticas
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2" data-testid="tab-services">
                <Package className="w-4 h-4" />
                Servicios
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-2" data-testid="tab-appointments">
                <Calendar className="w-4 h-4" />
                Citas
              </TabsTrigger>
              <TabsTrigger value="promotions" className="gap-2" data-testid="tab-promotions">
                <Tag className="w-4 h-4" />
                Promociones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-cards">
                <Card className="p-6 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Total Citas</span>
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-heading font-medium" data-testid="stat-total-appointments">{stats.total_citas || 0}</p>
                </Card>
                <Card className="p-6 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Pendientes</span>
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-heading font-medium" data-testid="stat-pending-appointments">{stats.citas_pendientes || 0}</p>
                </Card>
                <Card className="p-6 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Confirmadas</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-heading font-medium" data-testid="stat-confirmed-appointments">{stats.citas_confirmadas || 0}</p>
                </Card>
                <Card className="p-6 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Servicios Activos</span>
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-heading font-medium" data-testid="stat-active-services">{stats.servicios_activos || 0}</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-heading font-medium">Gestión de Servicios</h2>
                <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 rounded-full btn-primary-hover" onClick={() => {
                      setEditingService(null);
                      setServiceForm({ nombre: '', descripcion: '', precio: '', duracion: '' });
                    }} data-testid="create-service-button">
                      <Plus className="w-4 h-4" />
                      Nuevo Servicio
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="service-dialog">
                    <DialogHeader>
                      <DialogTitle>{editingService ? 'Editar Servicio' : 'Crear Servicio'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre del Servicio</Label>
                        <Input
                          value={serviceForm.nombre}
                          onChange={(e) => setServiceForm({ ...serviceForm, nombre: e.target.value })}
                          placeholder="Ej: Manicure Premium"
                          data-testid="service-name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={serviceForm.descripcion}
                          onChange={(e) => setServiceForm({ ...serviceForm, descripcion: e.target.value })}
                          placeholder="Describe el servicio..."
                          data-testid="service-description-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Precio ($)</Label>
                          <Input
                            type="number"
                            value={serviceForm.precio}
                            onChange={(e) => setServiceForm({ ...serviceForm, precio: e.target.value })}
                            placeholder="0.00"
                            data-testid="service-price-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duración (min)</Label>
                          <Input
                            type="number"
                            value={serviceForm.duracion}
                            onChange={(e) => setServiceForm({ ...serviceForm, duracion: e.target.value })}
                            placeholder="60"
                            data-testid="service-duration-input"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={editingService ? handleUpdateService : handleCreateService}
                        disabled={loading}
                        className="w-full rounded-full btn-primary-hover"
                        data-testid="save-service-button"
                      >
                        {loading ? 'Guardando...' : editingService ? 'Actualizar' : 'Crear Servicio'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="overflow-hidden shadow-card hover:shadow-float transition-shadow" data-testid={`service-admin-card-${service.id}`}>
                    <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                      {service.imagen_url ? (
                        <img src={service.imagen_url} alt={service.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Sin imagen
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleImageUpload(service.id, e.target.files[0])}
                        accept="image/*"
                        className="hidden"
                        data-testid={`image-input-${service.id}`}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-2 right-2 gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingServiceId === service.id}
                        data-testid={`upload-image-button-${service.id}`}
                      >
                        <Upload className="w-3 h-3" />
                        {uploadingServiceId === service.id ? 'Subiendo...' : 'Cambiar'}
                      </Button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-heading font-medium mb-2" data-testid={`service-admin-name-${service.id}`}>{service.nombre}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{service.descripcion}</p>
                      <div className="flex items-center justify-between mb-4 text-sm">
                        <span className="text-muted-foreground">{service.duracion} min</span>
                        <span className="text-primary font-medium text-lg" data-testid={`service-admin-price-${service.id}`}>${service.precio}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => openEditDialog(service)}
                          data-testid={`edit-service-button-${service.id}`}
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-2"
                          onClick={() => handleDeleteService(service.id)}
                          data-testid={`delete-service-button-${service.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-6">
              <h2 className="text-2xl font-heading font-medium">Gestión de Citas</h2>
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <Card key={apt.id} className="p-6 shadow-card" data-testid={`appointment-admin-card-${apt.id}`}>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-heading font-medium mb-1" data-testid={`appointment-admin-service-${apt.id}`}>
                              {apt.service?.nombre}
                            </h3>
                            <p className="text-muted-foreground text-sm" data-testid={`appointment-admin-user-${apt.id}`}>
                              Cliente: {apt.user?.nombre} ({apt.user?.email})
                            </p>
                            <p className="text-muted-foreground text-sm" data-testid={`appointment-admin-phone-${apt.id}`}>
                              Teléfono: {apt.user?.telefono}
                            </p>
                          </div>
                          <Badge variant={apt.estado === 'confirmada' ? 'default' : 'outline'} className={apt.estado === 'confirmada' ? 'bg-green-500' : ''}>
                            {apt.estado}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{formatDate(apt.fecha)}</p>
                        
                        {apt.comprobante_pago && (
                          <div className="mb-3 p-3 bg-secondary rounded-lg">
                            <p className="text-sm font-medium mb-2">Comprobante de pago:</p>
                            <img src={apt.comprobante_pago} alt="Comprobante" className="max-w-xs rounded border" data-testid={`proof-image-${apt.id}`} />
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Select
                            value={apt.estado}
                            onValueChange={(value) => handleUpdateAppointmentStatus(apt.id, value)}
                          >
                            <SelectTrigger className="w-48" data-testid={`status-select-${apt.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="confirmada">Confirmada</SelectItem>
                              <SelectItem value="cancelada">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {appointments.length === 0 && (
                  <Card className="p-12 text-center" data-testid="no-appointments-admin">
                    <p className="text-muted-foreground">No hay citas registradas</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="promotions" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-heading font-medium">Gestión de Promociones</h2>
                <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 rounded-full btn-primary-hover" data-testid="create-promotion-button">
                      <Plus className="w-4 h-4" />
                      Nueva Promoción
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="promotion-dialog">
                    <DialogHeader>
                      <DialogTitle>Crear Promoción</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Código de Promoción</Label>
                        <Input
                          value={promotionForm.codigo}
                          onChange={(e) => setPromotionForm({ ...promotionForm, codigo: e.target.value })}
                          placeholder="DESCUENTO20"
                          data-testid="promotion-code-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descuento (%)</Label>
                        <Input
                          type="number"
                          value={promotionForm.descuento_porcentaje}
                          onChange={(e) => setPromotionForm({ ...promotionForm, descuento_porcentaje: e.target.value })}
                          placeholder="20"
                          data-testid="promotion-discount-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={promotionForm.descripcion}
                          onChange={(e) => setPromotionForm({ ...promotionForm, descripcion: e.target.value })}
                          placeholder="Describe la promoción..."
                          data-testid="promotion-description-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha Inicio</Label>
                          <Input
                            type="date"
                            value={promotionForm.fecha_inicio}
                            onChange={(e) => setPromotionForm({ ...promotionForm, fecha_inicio: e.target.value })}
                            data-testid="promotion-start-date-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha Fin</Label>
                          <Input
                            type="date"
                            value={promotionForm.fecha_fin}
                            onChange={(e) => setPromotionForm({ ...promotionForm, fecha_fin: e.target.value })}
                            data-testid="promotion-end-date-input"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleCreatePromotion}
                        disabled={loading}
                        className="w-full rounded-full btn-primary-hover"
                        data-testid="save-promotion-button"
                      >
                        {loading ? 'Creando...' : 'Crear Promoción'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {promotions.map((promo) => (
                  <Card key={promo.id} className="p-6 shadow-card" data-testid={`promotion-card-${promo.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-heading font-medium mb-1" data-testid={`promotion-code-${promo.id}`}>
                          {promo.codigo}
                        </h3>
                        <Badge variant="secondary" className="mb-2">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {promo.descuento_porcentaje}% OFF
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePromotion(promo.id)}
                        data-testid={`delete-promotion-button-${promo.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground mb-3">{promo.descripcion}</p>
                    <div className="text-sm text-muted-foreground">
                      <p>Válido desde: {formatDate(promo.fecha_inicio)}</p>
                      <p>Hasta: {formatDate(promo.fecha_fin)}</p>
                    </div>
                  </Card>
                ))}
                {promotions.length === 0 && (
                  <Card className="p-12 text-center col-span-2" data-testid="no-promotions">
                    <p className="text-muted-foreground">No hay promociones activas</p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
