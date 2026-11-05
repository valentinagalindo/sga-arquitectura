import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import {
  AsignaturaItem,
  CalificacionRegistro,
  EventoAuditoria,
  Grupo,
  Notificacion,
  PeriodoAcademico,
  PlanEstudioItem,
  ProgramaAcademico,
  RolNombre,
  RutaApp,
  UsuarioSistema,
  calcularPromedioAcumulado,
  paginarLista,
  registrarIntentoLogin,
  tienePermisoRuta,
} from './domain/academicRules';
import {
  ASIGNATURAS_INICIALES,
  AUDITORIA_INICIAL,
  CALIFICACIONES_INICIALES,
  GRUPOS_INICIALES,
  HISTORIAL_CAMILA,
  NOTIFICACIONES_INICIALES,
  PERIODOS_INICIALES,
  PLANES_INICIALES,
  PROGRAMAS_INICIALES,
  USUARIOS_INICIALES,
} from './data/mockAcademicData';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { AdminViews } from './components/AdminViews';
import { CoordinatorViews } from './components/CoordinatorViews';
import { StudentViews, TeacherViews } from './components/RoleViews';
import { PaginationBar } from './components/PaginationBar';

interface ItemMenu {
  ruta: RutaApp;
  etiqueta: string;
}

const MENU_POR_ROL: Record<RolNombre, ItemMenu[]> = {
  [RolNombre.Administrador]: [
    { ruta: 'panel', etiqueta: 'Inicio' },
    { ruta: 'admin-usuarios', etiqueta: 'Usuarios y Perfiles' },
    { ruta: 'admin-auditoria', etiqueta: 'Auditoría' },
    { ruta: 'arquitectura', etiqueta: 'Arquitectura 4+1' },
  ],
  [RolNombre.CoordinadorAcademico]: [
    { ruta: 'panel', etiqueta: 'Inicio' },
    { ruta: 'coord-programas', etiqueta: 'Programas y Planes' },
    { ruta: 'coord-periodos-grupos', etiqueta: 'Periodos y Grupos' },
    { ruta: 'coord-reportes', etiqueta: 'Reportes' },
    { ruta: 'arquitectura', etiqueta: 'Arquitectura 4+1' },
  ],
  [RolNombre.Docente]: [
    { ruta: 'panel', etiqueta: 'Inicio' },
    { ruta: 'docente-grupos', etiqueta: 'Mis Grupos y Notas' },
    { ruta: 'arquitectura', etiqueta: 'Arquitectura 4+1' },
  ],
  [RolNombre.Estudiante]: [
    { ruta: 'panel', etiqueta: 'Inicio' },
    { ruta: 'est-matricula', etiqueta: 'Matrícula' },
    { ruta: 'est-horario', etiqueta: 'Mi Horario' },
    { ruta: 'est-notas', etiqueta: 'Notas y Certificado' },
    { ruta: 'arquitectura', etiqueta: 'Arquitectura 4+1' },
  ],
};

function leerRutaHash(): RutaApp {
  if (typeof window === 'undefined') return 'panel';
  const raw = window.location.hash.replace(/^#\/?/, '').trim() as RutaApp;
  const rutasValidas: RutaApp[] = [
    'panel',
    'admin-usuarios',
    'admin-auditoria',
    'coord-programas',
    'coord-periodos-grupos',
    'coord-reportes',
    'docente-grupos',
    'est-matricula',
    'est-horario',
    'est-notas',
    'arquitectura',
  ];
  return rutasValidas.includes(raw) ? raw : 'panel';
}

export default function App() {
  const paramsUrl =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const autostart = paramsUrl?.get('autostart') === '1';

  // Estado central de entidades del sistema
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(USUARIOS_INICIALES);
  const [programas, setProgramas] = useState<ProgramaAcademico[]>(PROGRAMAS_INICIALES);
  const [planes, setPlanes] = useState<PlanEstudioItem[]>(PLANES_INICIALES);
  const [asignaturas, setAsignaturas] = useState<AsignaturaItem[]>(ASIGNATURAS_INICIALES);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>(PERIODOS_INICIALES);
  const [grupos, setGrupos] = useState<Grupo[]>(GRUPOS_INICIALES);
  const [gruposMatriculadosIds, setGruposMatriculadosIds] = useState<string[]>(['grp-01']);
  const [calificaciones, setCalificaciones] =
    useState<CalificacionRegistro[]>(CALIFICACIONES_INICIALES);
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>(AUDITORIA_INICIAL);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(NOTIFICACIONES_INICIALES);

  // Sesión autenticada (el rol depende EXCLUSIVAMENTE de la cuenta con la que se inicia sesión)
  const [usuarioActivoId, setUsuarioActivoId] = useState<string | null>(
    autostart ? 'usr-est-01' : null
  );
  const usuarioActivo = usuarios.find((u) => u.id === usuarioActivoId) || null;

  // Formulario de Login y Recuperación
  const [correoLogin, setCorreoLogin] = useState<string>('camila.rios@siga.edu.co');
  const [claveLogin, setClaveLogin] = useState<string>('Siga2026!');
  const [aceptaHabeasData, setAceptaHabeasData] = useState<boolean>(true);
  const [mensajeLogin, setMensajeLogin] = useState<{
    tipo: 'error' | 'exito';
    texto: string;
  } | null>(null);
  const [modoRecuperacion, setModoRecuperacion] = useState<boolean>(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState<string>('');

  // Enrutamiento con verificación de acceso 403
  const [rutaActual, setRutaActual] = useState<RutaApp>(leerRutaHash);
  const [mostrarCambioClave, setMostrarCambioClave] = useState<boolean>(false);
  const [nuevaClave, setNuevaClave] = useState<string>('');
  const [feedbackOperacion, setFeedbackOperacion] = useState<{
    tipo: 'exito' | 'error';
    titulo: string;
    detalles: string[];
  } | null>(null);

  // Paginación tabla notificaciones en Panel de Inicio (RF-11)
  const [busqNotif, setBusqNotif] = useState('');
  const [paginaNotif, setPaginaNotif] = useState(1);

  const registrarEventoAuditoriaConActor = (
    correoActor: string,
    rolActor: RolNombre,
    modulo: EventoAuditoria['modulo'],
    accion: string,
    registroAfectado: string,
    detalle: string
  ) => {
    const nuevo: EventoAuditoria = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fechaISO: new Date().toISOString(),
      usuario: correoActor,
      rol: rolActor,
      modulo,
      accion,
      registroAfectado,
      detalle,
    };
    setAuditoria((prev) => [nuevo, ...prev]);
  };

  const registrarAuditoriaActual = (
    modulo: EventoAuditoria['modulo'],
    accion: string,
    registroAfectado: string,
    detalle: string
  ) => {
    if (!usuarioActivo) return;
    registrarEventoAuditoriaConActor(
      usuarioActivo.correo,
      usuarioActivo.rol,
      modulo,
      accion,
      registroAfectado,
      detalle
    );
  };

  const navegarARuta = (nuevaRuta: RutaApp) => {
    setFeedbackOperacion(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#/${nuevaRuta}`);
    }
    setRutaActual(nuevaRuta);
    if (usuarioActivo && !tienePermisoRuta(usuarioActivo.rol, nuevaRuta)) {
      registrarEventoAuditoriaConActor(
        usuarioActivo.correo,
        usuarioActivo.rol,
        'Seguridad',
        'ACCESO_DENEGADO_403',
        `Ruta:/#/${nuevaRuta}`,
        `Intento de acceso sin privilegios desde el rol ${usuarioActivo.rol}.`
      );
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      const r = leerRutaHash();
      setRutaActual(r);
      if (usuarioActivo && !tienePermisoRuta(usuarioActivo.rol, r)) {
        registrarEventoAuditoriaConActor(
          usuarioActivo.correo,
          usuarioActivo.rol,
          'Seguridad',
          'ACCESO_DENEGADO_403',
          `Ruta:/#/${r}`,
          `Intento de navegación directa por URL desde el rol ${usuarioActivo.rol}.`
        );
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [usuarioActivo]);

  const agregarNotificacion = (
    usuarioDestinoId: string,
    tipo: Notificacion['tipo'],
    mensaje: string
  ) => {
    setNotificaciones((prev) => [
      {
        id: `not-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        usuarioDestinoId,
        tipo,
        mensaje,
        fechaISO: new Date().toISOString(),
        leida: false,
      },
      ...prev,
    ]);
  };

  const notificarFeedback = (tipo: 'exito' | 'error', titulo: string, detalles: string[]) => {
    setFeedbackOperacion({ tipo, titulo, detalles });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeLogin(null);

    const correo = correoLogin.trim().toLowerCase();
    if (!correo || !claveLogin) {
      setMensajeLogin({
        tipo: 'error',
        texto: 'Ingrese su correo electrónico institucional y su contraseña.',
      });
      return;
    }

    if (!aceptaHabeasData) {
      setMensajeLogin({
        tipo: 'error',
        texto:
          'Para ingresar al sistema debe autorizar el tratamiento de datos personales conforme a la Ley 1581 de 2012.',
      });
      return;
    }

    const cuenta = usuarios.find((u) => u.correo.toLowerCase() === correo);
    if (!cuenta) {
      setMensajeLogin({
        tipo: 'error',
        texto: 'Las credenciales suministradas no corresponden a una cuenta registrada.',
      });
      return;
    }

    if (!cuenta.activo) {
      registrarEventoAuditoriaConActor(
        cuenta.correo,
        cuenta.rol,
        'Seguridad',
        'LOGIN_RECHAZADO_INACTIVO',
        `Usuario:${cuenta.id}`,
        'Intento de inicio de sesión en cuenta desactivada.'
      );
      setMensajeLogin({
        tipo: 'error',
        texto: 'Esta cuenta institucional se encuentra desactivada. Contacte al Administrador.',
      });
      return;
    }

    if (cuenta.bloqueado) {
      registrarEventoAuditoriaConActor(
        cuenta.correo,
        cuenta.rol,
        'Seguridad',
        'LOGIN_RECHAZADO_BLOQUEO',
        `Usuario:${cuenta.id}`,
        'Intento de acceso sobre cuenta bloqueada por intentos fallidos.'
      );
      setMensajeLogin({
        tipo: 'error',
        texto:
          'Cuenta bloqueada por seguridad tras superar el límite de intentos fallidos (RF-13). Solicite desbloqueo al Administrador.',
      });
      return;
    }

    const claveValida = claveLogin === 'Siga2026!';
    const estadoSeg = registrarIntentoLogin(
      { intentosFallidos: cuenta.intentosFallidos, bloqueado: cuenta.bloqueado },
      claveValida,
      5
    );

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === cuenta.id
          ? { ...u, intentosFallidos: estadoSeg.intentosFallidos, bloqueado: estadoSeg.bloqueado }
          : u
      )
    );

    if (!claveValida) {
      registrarEventoAuditoriaConActor(
        cuenta.correo,
        cuenta.rol,
        'Seguridad',
        estadoSeg.bloqueado ? 'BLOQUEO_AUTOMATICO_INTENTOS' : 'LOGIN_FALLIDO',
        `Usuario:${cuenta.id}`,
        `Intento fallido ${estadoSeg.intentosFallidos} de 5.`
      );
      setMensajeLogin({
        tipo: 'error',
        texto: estadoSeg.bloqueado
          ? 'La cuenta ha sido bloqueada preventivamente al alcanzar 5 intentos fallidos consecutivos.'
          : `Contraseña incorrecta. Intento registrado (${estadoSeg.intentosFallidos} de 5).`,
      });
      return;
    }

    registrarEventoAuditoriaConActor(
      cuenta.correo,
      cuenta.rol,
      'Seguridad',
      'LOGIN_EXITOSO',
      `Usuario:${cuenta.id} (${cuenta.rol})`,
      'Autenticación satisfactoria y verificación de consentimiento Ley 1581/2012.'
    );

    setUsuarioActivoId(cuenta.id);
    navegarARuta('panel');
  };

  const handleCerrarSesion = () => {
    if (usuarioActivo) {
      registrarAuditoriaActual(
        'Seguridad',
        'LOGOUT_USUARIO',
        `Usuario:${usuarioActivo.id}`,
        'Cierre explícito de sesión institucional.'
      );
    }
    setUsuarioActivoId(null);
    setFeedbackOperacion(null);
    setMostrarCambioClave(false);
    if (typeof window !== 'undefined') {
      window.location.hash = '#/panel';
    }
  };

  // ==================== PANTALLA DE INICIO DE SESIÓN ====================
  if (!usuarioActivo) {
    return (
      <div className="min-h-screen bg-[#EEF2FF] text-[#1E1B4B] flex flex-col">
        <header className="bg-[#1E1B4B] text-white border-b border-indigo-900">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
            <span className="font-display font-bold text-base tracking-tight whitespace-nowrap shrink-0">
              SIGA · PROTOTIPO
            </span>
            <span className="hidden md:inline text-xs text-indigo-200 truncate">
              Sistema Integrado de Gestión Académica Universitaria · WCAG 2.2 AA
            </span>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href="/analisis-arquitectura-sga.pdf"
                download="analisis-arquitectura-sga.pdf"
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
              >
                Descargar Análisis PDF (8 Partes)
              </a>
              <a
                href="/inventario-arquitectura-sga.md"
                download="inventario-arquitectura-sga.md"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
              >
                Descargar Inventario (.md)
              </a>
              <a
                href="/prototipo-siga.html"
                download="prototipo-siga.html"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
              >
                Descargar HTML Único
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold text-[#4338CA]">
              PORTAL ACADÉMICO INSTITUCIONAL · PROTOTIPO
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1B4B] leading-tight">
              Gestión Curricular, Matrícula y Registro Académico
            </h1>
            <p className="text-sm text-[#1E1B4B]/85 leading-relaxed max-w-2xl">
              El perfil de acceso, menú de navegación y permisos sobre los módulos dependen exclusivamente de la cuenta institucional autenticada. Seleccione una credencial de prueba para cargarla en el formulario de acceso.
            </p>

            <div className="bg-white border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#1E1B4B]">
                  Informe de Análisis Claro en PDF (Partes 1 a 8 Completas)
                </div>
                <p className="text-xs text-[#1E1B4B]/80 mt-0.5">
                  Incluye síntesis ejecutiva, matrices de los 39 requisitos, catálogos, diagramas 4+1, pruebas, riesgos y fuentes.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/analisis-arquitectura-sga.pdf"
                  download="analisis-arquitectura-sga.pdf"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg whitespace-nowrap"
                >
                  Descargar PDF
                </a>
                <a
                  href="/informe-analisis-sga.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 text-xs font-semibold text-[#1E1B4B] bg-[#EEF2FF] hover:bg-indigo-100 border border-indigo-200 rounded-lg whitespace-nowrap"
                >
                  Ver Informe Web
                </a>
              </div>
            </div>

            <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1E1B4B]">
                  Directorio de Credenciales de Prueba
                </h2>
                <span className="text-xs font-mono-tabular text-[#4338CA] font-semibold">
                  Clave: Siga2026!
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  usuarios.find((u) => u.id === 'usr-admin-01')!,
                  usuarios.find((u) => u.id === 'usr-coord-01')!,
                  usuarios.find((u) => u.id === 'usr-doc-01')!,
                  usuarios.find((u) => u.id === 'usr-doc-02')!,
                  usuarios.find((u) => u.id === 'usr-est-01')!,
                ]
                  .filter(Boolean)
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCorreoLogin(c.correo);
                        setClaveLogin('Siga2026!');
                        setModoRecuperacion(false);
                        setMensajeLogin(null);
                      }}
                      className={`text-left p-3 rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-[#4338CA] ${
                        correoLogin === c.correo
                          ? 'border-[#4338CA] bg-[#EEF2FF]'
                          : 'border-indigo-100 bg-white hover:bg-indigo-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#1E1B4B]">
                        <span>{c.rol}</span>
                        <span className="font-mono-tabular text-[11px] text-[#4338CA]">
                          {c.bloqueado ? 'Bloqueado' : c.codigoInstitucional}
                        </span>
                      </div>
                      <div className="text-xs text-[#1E1B4B]/90 mt-0.5 truncate">
                        {c.nombreCompleto}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-slate-600 truncate">
                        {c.correo}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </section>

          <section className="lg:col-span-5 bg-white border border-indigo-200 rounded-xl p-6 shadow-sm">
            {!modoRecuperacion ? (
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div>
                  <span className="text-xs font-semibold text-[#6D28D9]">
                    Autenticación Institucional · PROTOTIPO
                  </span>
                  <h2 className="text-xl font-bold text-[#1E1B4B] mt-0.5">Iniciar Sesión</h2>
                </div>

                {mensajeLogin && (
                  <div
                    role="alert"
                    className={`p-3 rounded-lg text-xs border ${
                      mensajeLogin.tipo === 'error'
                        ? 'bg-red-50 border-red-300 text-red-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    {mensajeLogin.texto}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="login-correo"
                    className="block text-xs font-semibold text-[#1E1B4B] mb-1"
                  >
                    Correo institucional
                  </label>
                  <input
                    id="login-correo"
                    type="email"
                    required
                    value={correoLogin}
                    onChange={(e) => setCorreoLogin(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-indigo-300 rounded-lg text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-clave" className="text-xs font-semibold text-[#1E1B4B]">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setModoRecuperacion(true);
                        setMensajeLogin(null);
                      }}
                      className="text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      Recuperar contraseña
                    </button>
                  </div>
                  <input
                    id="login-clave"
                    type="password"
                    required
                    value={claveLogin}
                    onChange={(e) => setClaveLogin(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-indigo-300 rounded-lg text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="login-ley1581"
                    type="checkbox"
                    checked={aceptaHabeasData}
                    onChange={(e) => setAceptaHabeasData(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-indigo-400 text-[#4338CA]"
                  />
                  <label htmlFor="login-ley1581" className="text-xs text-[#1E1B4B]/90 leading-snug">
                    Autorizo de manera previa, expresa e informada el tratamiento de datos personales para fines académicos y administrativos conforme a la{' '}
                    <strong>Ley 1581 de 2012</strong>.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]"
                >
                  Ingresar al portal
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!correoRecuperacion.trim().includes('@')) {
                    setMensajeLogin({
                      tipo: 'error',
                      texto: 'Ingrese un correo electrónico institucional válido.',
                    });
                    return;
                  }
                  registrarEventoAuditoriaConActor(
                    correoRecuperacion.trim().toLowerCase(),
                    RolNombre.Estudiante,
                    'Seguridad',
                    'SOLICITUD_RECUPERACION_CLAVE',
                    `Correo:${correoRecuperacion.trim().toLowerCase()}`,
                    'Generación de enlace de restablecimiento con vigencia de 15 minutos.'
                  );
                  setMensajeLogin({
                    tipo: 'exito',
                    texto: `Se envió un enlace de restablecimiento con vigencia de 15 minutos a ${correoRecuperacion.trim()}.`,
                  });
                  setModoRecuperacion(false);
                  setCorreoRecuperacion('');
                }}
                className="space-y-4"
                noValidate
              >
                <div>
                  <span className="text-xs font-semibold text-[#6D28D9]">
                    Seguridad de Cuentas · RF-13
                  </span>
                  <h2 className="text-xl font-bold text-[#1E1B4B] mt-0.5">
                    Restablecimiento de Contraseña
                  </h2>
                </div>
                <div>
                  <label
                    htmlFor="rec-correo"
                    className="block text-xs font-semibold text-[#1E1B4B] mb-1"
                  >
                    Correo institucional registrado
                  </label>
                  <input
                    id="rec-correo"
                    type="email"
                    value={correoRecuperacion}
                    onChange={(e) => setCorreoRecuperacion(e.target.value)}
                    placeholder="usuario@siga.edu.co"
                    className="w-full px-3.5 py-2.5 text-sm border border-indigo-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-[#4338CA] rounded-lg"
                  >
                    Enviar instrucciones
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoRecuperacion(false)}
                    className="py-2.5 px-4 text-xs font-semibold bg-[#EEF2FF] text-[#1E1B4B] rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </section>
        </main>
      </div>
    );
  }

  // ==================== SESIÓN AUTENTICADA (SIN SELECTOR DE CAMBIO DE ROL) ====================
  const menuRol = MENU_POR_ROL[usuarioActivo.rol];
  const accesoPermitido = tienePermisoRuta(usuarioActivo.rol, rutaActual);
  const periodoPrincipal = periodos.find((p) => p.codigo === '2026-2') || periodos[0];

  const misNotificaciones = notificaciones.filter((n) => {
    const pertenece =
      usuarioActivo.rol === RolNombre.Administrador || n.usuarioDestinoId === usuarioActivo.id;
    const matchTxt =
      !busqNotif.trim() ||
      n.mensaje.toLowerCase().includes(busqNotif.toLowerCase()) ||
      n.tipo.toLowerCase().includes(busqNotif.toLowerCase());
    return pertenece && matchTxt;
  });
  const pagNotif = paginarLista(misNotificaciones, paginaNotif, 4);

  return (
    <div className="min-h-screen bg-[#EEF2FF] text-[#1E1B4B] flex flex-col">
      {/* Top Bar de 3 zonas con menú exclusivo del rol autenticado */}
      <header className="bg-[#1E1B4B] text-white border-b border-indigo-900 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <a
            href="#/panel"
            onClick={(e) => {
              e.preventDefault();
              navegarARuta('panel');
            }}
            className="font-display font-bold text-base tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
          >
            SIGA · PROTOTIPO
          </a>

          <nav
            aria-label="Navegación del rol"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {menuRol.map((item) => (
              <button
                key={item.ruta}
                type="button"
                onClick={() => navegarARuta(item.ruta)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-2 focus-visible:outline-white ${
                  rutaActual === item.ruta
                    ? 'border-[#7C3AED] text-white font-semibold'
                    : 'border-transparent text-indigo-200 hover:text-white'
                }`}
              >
                {item.etiqueta}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleCerrarSesion}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#6D28D9] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Cinta de identidad autenticada (sin selector de cambio de rol) */}
      <div className="bg-white border-b border-indigo-200/80 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-[#1E1B4B]">
            <span className="font-semibold text-[#6D28D9]">PROTOTIPO</span>
            <span aria-hidden="true">·</span>
            <span>
              Usuario: <strong>{usuarioActivo.nombreCompleto}</strong> ({usuarioActivo.codigoInstitucional})
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Rol de sesión: <strong>{usuarioActivo.rol}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Periodo {periodoPrincipal.codigo}: <strong>{periodoPrincipal.estado}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/analisis-arquitectura-sga.pdf"
              download="analisis-arquitectura-sga.pdf"
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md whitespace-nowrap"
            >
              Descargar Análisis (.pdf)
            </a>
            <a
              href="/inventario-arquitectura-sga.md"
              download="inventario-arquitectura-sga.md"
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md whitespace-nowrap"
            >
              Descargar Inventario (.md)
            </a>
            <button
              type="button"
              onClick={() => setMostrarCambioClave(!mostrarCambioClave)}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#4338CA] hover:bg-indigo-50 rounded-md border border-indigo-200 whitespace-nowrap"
            >
              Cambiar contraseña
            </button>
          </div>
        </div>

        {/* Menú móvil exclusivo del rol */}
        <nav
          aria-label="Navegación móvil"
          className="md:hidden px-6 pb-3 flex flex-wrap items-center gap-1.5"
        >
          {menuRol.map((item) => (
            <button
              key={item.ruta}
              type="button"
              onClick={() => navegarARuta(item.ruta)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 ${
                rutaActual === item.ruta
                  ? 'bg-[#4338CA] text-white'
                  : 'bg-[#EEF2FF] text-[#1E1B4B]'
              }`}
            >
              {item.etiqueta}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {mostrarCambioClave && (
          <section className="bg-white border border-indigo-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 print:hidden">
            <div className="flex-1 max-w-md">
              <label htmlFor="nueva-clave-usr" className="block text-xs font-bold mb-1">
                Actualizar contraseña de {usuarioActivo.correo}
              </label>
              <input
                id="nueva-clave-usr"
                type="password"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (nuevaClave.length < 8) {
                    notificarFeedback('error', 'Contraseña demasiado corta', [
                      'La nueva contraseña debe tener un mínimo de 8 caracteres.',
                    ]);
                    return;
                  }
                  registrarAuditoriaActual(
                    'Seguridad',
                    'CAMBIO_CONTRASENA',
                    `Usuario:${usuarioActivo.id}`,
                    'Actualización de credencial personal con hash Argon2id.'
                  );
                  setNuevaClave('');
                  setMostrarCambioClave(false);
                  notificarFeedback('exito', 'Contraseña actualizada', [
                    'El evento quedó registrado en la bitácora de auditoría.',
                  ]);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4338CA] rounded-lg"
              >
                Guardar contraseña
              </button>
              <button
                type="button"
                onClick={() => setMostrarCambioClave(false)}
                className="px-3 py-2 text-xs font-semibold bg-[#EEF2FF] rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        {feedbackOperacion && (
          <div
            role="status"
            aria-live="polite"
            className={`p-4 rounded-xl border flex items-start justify-between gap-4 print:hidden ${
              feedbackOperacion.tipo === 'exito'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-red-50 border-red-300 text-red-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {feedbackOperacion.tipo === 'exito' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div>
                <h2 className="text-sm font-bold">{feedbackOperacion.titulo}</h2>
                <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
                  {feedbackOperacion.detalles.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackOperacion(null)}
              className="text-xs font-semibold underline shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* ==================== PANTALLA ACCESO DENEGADO (403) SI LA RUTA NO CORRESPONDE AL ROL ==================== */}
        {!accesoPermitido ? (
          <section
            role="alert"
            className="bg-white border border-red-300 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1B4B]">Acceso denegado (403)</h1>
            <p className="text-sm text-[#1E1B4B]/85">
              Su cuenta actual con rol <strong>{usuarioActivo.rol}</strong> no cuenta con autorización para acceder a la ruta solicitada (<code className="font-mono-tabular">/#/{rutaActual}</code>). Este intento ha sido registrado en el módulo de <strong>Auditoría</strong>.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navegarARuta('panel')}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg"
              >
                Volver a mi panel de inicio
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* PANEL DE INICIO DIFERENCIADO SEGÚN EL ROL (RF-20) */}
            {rutaActual === 'panel' && (
              <div className="space-y-6">
                <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-[#6D28D9]">
                        Panel Institucional · Perfil {usuarioActivo.rol}
                      </span>
                      <h1 className="text-2xl font-bold text-[#1E1B4B] mt-0.5">
                        Bienvenido, {usuarioActivo.nombreCompleto}
                      </h1>
                      <p className="text-xs text-[#1E1B4B]/80 mt-0.5">
                        Correo: <span className="font-mono-tabular">{usuarioActivo.correo}</span> · Código:{' '}
                        <span className="font-mono-tabular">{usuarioActivo.codigoInstitucional}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {menuRol
                        .filter((m) => m.ruta !== 'panel' && m.ruta !== 'arquitectura')
                        .map((item) => (
                          <button
                            key={item.ruta}
                            type="button"
                            onClick={() => navegarARuta(item.ruta)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg"
                          >
                            {item.etiqueta}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Indicadores específicos del rol autenticado */}
                  {usuarioActivo.rol === RolNombre.Administrador && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-indigo-100">
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Usuarios Registrados</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">{usuarios.length}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Cuentas Bloqueadas</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {usuarios.filter((u) => u.bloqueado).length}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Cuentas Activas</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {usuarios.filter((u) => u.activo).length}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Eventos en Auditoría</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {auditoria.length}
                        </div>
                      </div>
                    </div>
                  )}

                  {usuarioActivo.rol === RolNombre.CoordinadorAcademico && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-indigo-100">
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Programas / Planes</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {programas.length} / {planes.length}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Asignaturas Activas</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {asignaturas.length}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Grupos Ofertados</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {grupos.length}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Estado {periodoPrincipal.codigo}</span>
                        <div className="text-lg font-bold mt-1 text-[#4338CA]">
                          {periodoPrincipal.estado}
                        </div>
                      </div>
                    </div>
                  )}

                  {usuarioActivo.rol === RolNombre.Docente && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-indigo-100">
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Mis Grupos Asignados</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {grupos.filter((g) => g.docenteId === usuarioActivo.id).length}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Notas en Borrador (Mis Grupos)</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {
                            calificaciones.filter(
                              (c) =>
                                grupos.some(
                                  (g) => g.id === c.grupoId && g.docenteId === usuarioActivo.id
                                ) && c.estado === 'borrador'
                            ).length
                          }
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Notas Publicadas (Mis Grupos)</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {
                            calificaciones.filter(
                              (c) =>
                                grupos.some(
                                  (g) => g.id === c.grupoId && g.docenteId === usuarioActivo.id
                                ) && c.estado === 'publicada'
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {usuarioActivo.rol === RolNombre.Estudiante && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-indigo-100">
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Estado Periodo {periodoPrincipal.codigo}</span>
                        <div className="text-lg font-bold mt-1 text-[#4338CA]">
                          {periodoPrincipal.estado}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Grupos Matriculados</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {gruposMatriculadosIds.length}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Promedio Acumulado (PGA)</span>
                        <div className="text-2xl font-bold font-mono-tabular mt-1">
                          {calcularPromedioAcumulado(HISTORIAL_CAMILA).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#EEF2FF]/70 border border-indigo-100">
                        <span className="text-xs text-slate-600">Prueba de Seguridad RBAC</span>
                        <button
                          type="button"
                          onClick={() => navegarARuta('admin-usuarios')}
                          className="mt-1.5 text-xs font-semibold text-[#2563EB] hover:underline block"
                        >
                          Probar ruta restringida (403)
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Tabla Paginada de Notificaciones (RF-11 y RF-17) */}
                <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-[#1E1B4B]">
                      Bandeja de Notificaciones Institucionales
                    </h2>
                    <input
                      type="search"
                      aria-label="Buscar notificaciones"
                      value={busqNotif}
                      onChange={(e) => {
                        setBusqNotif(e.target.value);
                        setPaginaNotif(1);
                      }}
                      placeholder="Filtrar notificaciones..."
                      className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
                    />
                  </div>
                  <div className="overflow-x-auto border border-indigo-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#EEF2FF] border-b border-indigo-200">
                          <th className="py-2.5 px-3 font-bold">Fecha</th>
                          <th className="py-2.5 px-3 font-bold">Categoría</th>
                          <th className="py-2.5 px-3 font-bold">Mensaje</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100">
                        {pagNotif.itemsPagina.map((n) => (
                          <tr key={n.id}>
                            <td className="py-2.5 px-3 font-mono-tabular whitespace-nowrap">
                              {n.fechaISO.slice(0, 16).replace('T', ' ')}
                            </td>
                            <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#4338CA]">
                              {n.tipo}
                            </td>
                            <td className="py-2.5 px-3">{n.mensaje}</td>
                          </tr>
                        ))}
                        {pagNotif.totalItems === 0 && (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-slate-600">
                              No registra notificaciones en su bandeja.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar
                    paginaActual={pagNotif.paginaSegura}
                    totalPaginas={pagNotif.totalPaginas}
                    totalItems={pagNotif.totalItems}
                    tamanoPagina={4}
                    onPageChange={setPaginaNotif}
                    etiquetaTabla="notificaciones"
                  />
                </section>
              </div>
            )}

            {/* VISTAS ADMINISTRADOR */}
            {(rutaActual === 'admin-usuarios' || rutaActual === 'admin-auditoria') && (
              <AdminViews
                modo={rutaActual === 'admin-usuarios' ? 'usuarios' : 'auditoria'}
                adminActivo={usuarioActivo}
                usuarios={usuarios}
                setUsuarios={setUsuarios}
                programas={programas}
                planes={planes}
                auditoria={auditoria}
                registrarAuditoria={registrarAuditoriaActual}
                notificarFeedback={notificarFeedback}
              />
            )}

            {/* VISTAS COORDINADOR ACADÉMICO */}
            {(rutaActual === 'coord-programas' ||
              rutaActual === 'coord-periodos-grupos' ||
              rutaActual === 'coord-reportes') && (
              <CoordinatorViews
                modo={
                  rutaActual === 'coord-programas'
                    ? 'programas'
                    : rutaActual === 'coord-periodos-grupos'
                    ? 'periodos-grupos'
                    : 'reportes'
                }
                programas={programas}
                setProgramas={setProgramas}
                planes={planes}
                setPlanes={setPlanes}
                asignaturas={asignaturas}
                setAsignaturas={setAsignaturas}
                periodos={periodos}
                setPeriodos={setPeriodos}
                grupos={grupos}
                setGrupos={setGrupos}
                docentes={usuarios.filter((u) => u.rol === RolNombre.Docente && u.activo)}
                calificaciones={calificaciones}
                registrarAuditoria={registrarAuditoriaActual}
                notificarFeedback={notificarFeedback}
              />
            )}

            {/* VISTA DOCENTE */}
            {rutaActual === 'docente-grupos' && (
              <TeacherViews
                docente={usuarioActivo}
                grupos={grupos}
                calificaciones={calificaciones}
                setCalificaciones={setCalificaciones}
                registrarAuditoria={registrarAuditoriaActual}
                agregarNotificacion={agregarNotificacion}
                notificarFeedback={notificarFeedback}
              />
            )}

            {/* VISTAS ESTUDIANTE */}
            {(rutaActual === 'est-matricula' ||
              rutaActual === 'est-horario' ||
              rutaActual === 'est-notas') && (
              <StudentViews
                modo={
                  rutaActual === 'est-matricula'
                    ? 'matricula'
                    : rutaActual === 'est-horario'
                    ? 'horario'
                    : 'notas'
                }
                estudiante={usuarioActivo}
                periodoActivo={periodoPrincipal}
                grupos={grupos}
                setGrupos={setGrupos}
                gruposMatriculadosIds={gruposMatriculadosIds}
                setGruposMatriculadosIds={setGruposMatriculadosIds}
                historialAprobado={HISTORIAL_CAMILA}
                calificaciones={calificaciones}
                registrarAuditoria={registrarAuditoriaActual}
                agregarNotificacion={agregarNotificacion}
                notificarFeedback={notificarFeedback}
              />
            )}

            {/* DOCUMENTACIÓN ARQUITECTÓNICA */}
            {rutaActual === 'arquitectura' && <ArchitectureViewer />}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-indigo-200/80 py-4 px-6 text-xs text-[#1E1B4B]/75 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SIGA · PROTOTIPO ACADÉMICO · Cumplimiento Ley 1581 de 2012 · Accesibilidad WCAG 2.2 AA
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/analisis-arquitectura-sga.pdf"
              download="analisis-arquitectura-sga.pdf"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Descargar Análisis PDF (Partes 1–8)
            </a>
            <a
              href="/inventario-arquitectura-sga.md"
              download="inventario-arquitectura-sga.md"
              className="inline-flex items-center gap-1.5 font-semibold text-[#2563EB] hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Descargar inventario (.md)
            </a>
            <a
              href="/prototipo-siga.html"
              download="prototipo-siga.html"
              className="inline-flex items-center gap-1.5 font-semibold text-[#4338CA] hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Descargar prototipo HTML
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
