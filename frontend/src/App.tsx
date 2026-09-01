import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import UserList from './components/UserList';
import Home from './components/Home';
import DoctorList from './components/DoctorList';
import ProveedorList from './components/ProveedorList';
import PersonalList from './components/PersonalList';
import EspecialidadList from './components/EspecialidadList';
import ArancelList from './components/ArancelList';
import EgresoList from './components/EgresoList';
import LaboratorioList from './components/LaboratorioList';
import PrecioLaboratorioList from './components/PrecioLaboratorioList';
import TrabajosLaboratoriosList from './components/TrabajosLaboratoriosList';
import PagosLaboratoriosList from './components/PagosLaboratoriosList';
import SeguimientoTrabajoComponent from './components/SeguimientoTrabajo';
import PacienteList from './components/PacienteList';
import PacienteCreateView from './components/PacienteCreateView';
import RegistroPacienteView from './components/RegistroPacienteView';
import PacientePerfilView from './components/PacientePerfilView';
import CategoriaPacienteList from './components/CategoriaPacienteList';
import PersonalTipoList from './components/PersonalTipoList';
import PresupuestoForm from './components/PresupuestoForm';
import PagosList from './components/PagosList';
import ComisionTarjetaList from './components/ComisionTarjetaList';
import PagosPedidosList from './components/PagosPedidosList';
import GastosFijosList from './components/GastosFijosList';
import AgendaView from './components/AgendaView';
import CorreosList from './components/CorreosList';
import Configuration from './components/Configuration';
import ChatbotConfig from './components/ChatbotConfig';
import FormaPagoList from './components/FormaPagoList';
import GrupoInventarioList from './components/GrupoInventarioList';
import InventarioList from './components/InventarioList';
import VacacionesList from './components/VacacionesList';
import CalificacionList from './components/CalificacionList';
import PedidosList from './components/PedidosList';
import PacientesDeudores from './components/PacientesDeudores';
import PacientesPendientes from './components/PacientesPendientes';
import CubetasList from './components/CubetasList';
import { ChatProvider } from './context/ChatContext';
import { CorreosProvider } from './context/CorreosContext';
import DeudasLaboratorios from './components/DeudasLaboratorios';
import DeudasPedidos from './components/DeudasPedidos';
import PagosDoctoresList from './components/PagosDoctoresList';

import ProtectedRoute from './components/ProtectedRoute';
import HojaDiaria from './components/HojaDiaria';
import Utilidades from './components/Utilidades';
import Estadisticas from './components/Estadisticas';
import EstadisticasDoctores from './components/EstadisticasDoctores';
import EstadisticasEspecialidades from './components/EstadisticasEspecialidades';
import EstadisticasPacientesNuevos from './components/EstadisticasPacientesNuevos';
import EstadisticasProductos from './components/EstadisticasProductos';
import EstadisticasUtilidades from './components/EstadisticasUtilidades';
import RecetarioList from './components/RecetarioList';
import RecordatorioList from './components/RecordatorioList';
import ContactosList from './components/ContactosList';
import BackupManager from './components/BackupManager';
import MusicaTelevisionView from './components/MusicaTelevisionView';
import CambiarPassword from './components/CambiarPassword';
import OtrosView from './components/OtrosView';
import ReciboList from './components/ReciboList';
import MantenimientoConsultorioList from './components/MantenimientoConsultorioList';
import CasosClinicosList from './components/CasosClinicosList';
import DatosCentroDentalList from './components/DatosCentroDentalList';
import RecetasPredisenadasList from './components/RecetasPredisenadasList';
import ConsentimientosPlantillasList from './components/ConsentimientosPlantillasList';

import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <Router>
            <ChatProvider>
                <CorreosProvider>
                    <ThemeProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/registro-paciente" element={<RegistroPacienteView />} />
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Navigate to="/home" replace />} />
                                <Route element={<ProtectedRoute moduleId="home" />}>
                                    <Route path="/home" element={<Home />} />
                                </Route>

                                {/* Agenda */}
                                <Route element={<ProtectedRoute moduleId="agenda" />}>
                                    <Route path="/agenda" element={<AgendaView />} />
                                </Route>

                                {/* Configuración General */}
                                <Route element={<ProtectedRoute moduleId="configuracion" />}>
                                    <Route path="/configuration" element={<Configuration />} />
                                </Route>

                                {/* Submódulos de Configuración y Seguridad */}
                                <Route element={<ProtectedRoute moduleId="usuarios" />}>
                                    <Route path="/users" element={<UserList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="config-chatbot" />}>
                                    <Route path="/configuration/chatbot" element={<ChatbotConfig />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="backup" />}>
                                    <Route path="/backup" element={<BackupManager />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="casos-clinicos" />}>
                                    <Route path="/casos-clinicos" element={<CasosClinicosList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="datos-centro" />}>
                                    <Route path="/datos-centro" element={<DatosCentroDentalList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="recetas-predisenadas" />}>
                                    <Route path="/recetas-predisenadas" element={<RecetasPredisenadasList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="consentimientos-plantillas" />}>
                                    <Route path="/consentimientos-plantillas" element={<ConsentimientosPlantillasList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="personal_tipo" />}>
                                    <Route path="/personal-tipo" element={<PersonalTipoList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="config-categorias" />}>
                                    <Route path="/categoria-paciente" element={<CategoriaPacienteList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="config-comision" />}>
                                    <Route path="/comision-tarjeta" element={<ComisionTarjetaList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="config-forma-pago" />}>
                                    <Route path="/forma-pago" element={<FormaPagoList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="config-grupos" />}>
                                    <Route path="/grupo-inventario" element={<GrupoInventarioList />} />
                                </Route>
                                <Route path="/correos" element={<CorreosList />} />

                                {/* Doctores & Especialidades */}
                                <Route element={<ProtectedRoute moduleId="doctores" />}>
                                    <Route path="/doctors" element={<DoctorList />} />
                                    <Route path="/pagos-doctores" element={<PagosDoctoresList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="config-especialidad" />}>
                                    <Route path="/especialidad" element={<EspecialidadList />} />
                                </Route>

                                {/* Proveedores */}
                                <Route element={<ProtectedRoute moduleId="proveedores" />}>
                                    <Route path="/proveedores" element={<ProveedorList />} />
                                </Route>

                                {/* Personal */}
                                <Route element={<ProtectedRoute moduleId="personal" />}>
                                    <Route path="/personal" element={<PersonalList />} />
                                    <Route path="/vacaciones" element={<VacacionesList />} />
                                    <Route path="/calificacion" element={<CalificacionList />} />
                                </Route>

                                {/* Arancel */}
                                <Route element={<ProtectedRoute moduleId="aranceles" />}>
                                    <Route path="/arancel" element={<ArancelList />} />
                                </Route>

                                {/* Egresos & Gastos */}
                                <Route element={<ProtectedRoute moduleId="egresos" />}>
                                    <Route path="/egresos" element={<EgresoList />} />
                                </Route>
                                <Route element={<ProtectedRoute moduleId="gastos" />}>
                                    <Route path="/gastos-fijos" element={<GastosFijosList />} />
                                </Route>

                                {/* Laboratorios */}
                                <Route element={<ProtectedRoute moduleId="laboratorios" />}>
                                    <Route path="/laboratorios" element={<LaboratorioList />} />
                                    <Route path="/precios-laboratorios" element={<PrecioLaboratorioList />} />
                                    <Route path="/trabajos-laboratorios" element={<TrabajosLaboratoriosList />} />
                                    <Route path="/pagos-laboratorios" element={<PagosLaboratoriosList />} />
                                    <Route path="/pagos-laboratorios/deudas" element={<DeudasLaboratorios />} />
                                    <Route path="/pagos-laboratorios/nuevo" element={<Navigate to="/pagos-laboratorios" replace />} />
                                    <Route path="/trabajos-laboratorios/seguimiento/:workId" element={<SeguimientoTrabajoComponent />} />
                                    <Route path="/cubetas" element={<CubetasList />} />
                                </Route>

                                {/* Pacientes */}
                                <Route element={<ProtectedRoute moduleId="pacientes" />}>
                                    <Route path="/pacientes" element={<PacienteList />} />
                                    <Route path="/pacientes/create" element={<PacienteCreateView />} />
                                    <Route path="/pacientes/edit/:id" element={<PacienteCreateView />} />
                                    <Route path="/pacientes-pendientes" element={<PacientesPendientes />} />
                                    <Route path="/pacientes/:id" element={<PacientePerfilView />} />
                                    <Route path="/pacientes/:id/:tab" element={<PacientePerfilView />} />
                                    <Route path="/pacientes-deudores" element={<PacientesDeudores />} />
                                    <Route path="/recetario" element={<RecetarioList />} />
                                </Route>

                                {/* Pagos */}
                                <Route element={<ProtectedRoute moduleId="pagos" />}>
                                    <Route path="/pagos" element={<PagosList />} />
                                    <Route path="/pagos-pedidos" element={<PagosPedidosList />} />
                                </Route>

                                {/* Inventario */}
                                <Route element={<ProtectedRoute moduleId="inventario" />}>
                                    <Route path="/inventario" element={<InventarioList />} />
                                    <Route path="/pedidos" element={<PedidosList />} />
                                    <Route path="/pedidos/deudas" element={<DeudasPedidos />} />
                                </Route>

                                {/* Nuevos Módulos */}
                                <Route path="/hoja-diaria" element={<HojaDiaria />} />
                                <Route path="/utilidades" element={<Utilidades />} />
                                <Route path="/estadisticas" element={<Estadisticas />} />
                                <Route path="/estadisticas/doctores" element={<EstadisticasDoctores />} />
                                <Route path="/estadisticas/especialidades" element={<EstadisticasEspecialidades />} />
                                <Route path="/estadisticas/pacientes-nuevos" element={<EstadisticasPacientesNuevos />} />
                                <Route path="/estadisticas/productos" element={<EstadisticasProductos />} />
                                <Route path="/estadisticas/utilidades" element={<EstadisticasUtilidades />} />

                                {/* Recordatorios */}
                                <Route path="/recordatorio" element={<RecordatorioList />} />

                                {/* Contactos */}
                                <Route path="/contactos" element={<ContactosList />} />

                                {/* Música / Televisión */}
                                <Route path="/musica-television" element={<MusicaTelevisionView />} />

                                {/* Cambiar Contraseña */}
                                <Route path="/cambiar-password" element={<CambiarPassword />} />

                                {/* Otros Módulos (Recibos & Mantenimiento) */}
                                <Route path="/otros" element={<OtrosView />} />
                                <Route path="/otros/recibos" element={<ReciboList />} />
                                <Route path="/otros/mantenimiento" element={<MantenimientoConsultorioList />} />
                            </Route>

                        </Routes>
                    </ThemeProvider>
                </CorreosProvider>
            </ChatProvider>
        </Router>
    );
}

export default App;
