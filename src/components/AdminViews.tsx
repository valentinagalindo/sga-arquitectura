import React, { useState } from 'react';
import {
  EventoAuditoria,
  PlanEstudioItem,
  ProgramaAcademico,
  RolNombre,
  UsuarioSistema,
  paginarLista,
} from '../domain/academicRules';
import { PaginationBar } from './PaginationBar';
import { Lock, Plus, Search, ShieldAlert, Unlock, UserCheck, UserX } from 'lucide-react';

interface AdminViewsProps {
  modo: 'usuarios' | 'auditoria';
  adminActivo: UsuarioSistema;
  usuarios: UsuarioSistema[];
  setUsuarios: React.Dispatch<React.SetStateAction<UsuarioSistema[]>>;
  programas: ProgramaAcademico[];
  planes: PlanEstudioItem[];
  auditoria: EventoAuditoria[];
  registrarAuditoria: (
    modulo: EventoAuditoria['modulo'],
    accion: string,
    registroAfectado: string,
    detalle: string
  ) => void;
  notificarFeedback: (tipo: 'exito' | 'error', titulo: string, detalles: string[]) => void;
}

export const AdminViews: React.FC<AdminViewsProps> = ({
  modo,
  adminActivo,
  usuarios,
  setUsuarios,
  programas,
  planes,
  auditoria,
  registrarAuditoria,
  notificarFeedback,
}) => {
  // Estados tabla Usuarios (RF-11)
  const [busquedaUsr, setBusquedaUsr] = useState('');
  const [filtroRolUsr, setFiltroRolUsr] = useState<string>('TODOS');
  const [filtroEstadoUsr, setFiltroEstadoUsr] = useState<string>('TODOS');
  const [paginaUsr, setPaginaUsr] = useState(1);

  // Formulario Crear/Editar Usuario, Estudiante o Docente
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [correoForm, setCorreoForm] = useState('');
  const [nombreForm, setNombreForm] = useState('');
  const [documentoForm, setDocumentoForm] = useState('');
  const [rolForm, setRolForm] = useState<RolNombre>(RolNombre.Estudiante);
  const [codigoForm, setCodigoForm] = useState('');
  const [programaIdForm, setProgramaIdForm] = useState(programas[0]?.id || '');
  const [especialidadForm, setEspecialidadForm] = useState('');

  // Estados tabla Auditoría (RF-11 y filtro por usuario, acción y fecha)
  const [filtroAudUsuario, setFiltroAudUsuario] = useState('');
  const [filtroAudAccion, setFiltroAudAccion] = useState('TODAS');
  const [filtroAudFecha, setFiltroAudFecha] = useState('');
  const [paginaAud, setPaginaAud] = useState(1);

  const limpiarFormulario = () => {
    setEditandoId(null);
    setCorreoForm('');
    setNombreForm('');
    setDocumentoForm('');
    setRolForm(RolNombre.Estudiante);
    setCodigoForm('');
    setProgramaIdForm(programas[0]?.id || '');
    setEspecialidadForm('');
  };

  const iniciarEdicion = (u: UsuarioSistema) => {
    setEditandoId(u.id);
    setCorreoForm(u.correo);
    setNombreForm(u.nombreCompleto);
    setDocumentoForm(u.documento);
    setRolForm(u.rol);
    setCodigoForm(u.codigoInstitucional);
    setProgramaIdForm(u.programaId || programas[0]?.id || '');
    setEspecialidadForm(u.especialidad || '');
  };

  const handleGuardarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    const errores: string[] = [];
    const correoLimpio = correoForm.trim().toLowerCase();

    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      errores.push('Ingrese un correo electrónico institucional con formato válido.');
    }
    if (nombreForm.trim().length < 5) {
      errores.push('El nombre completo debe contener al menos 5 caracteres.');
    }
    if (!/^\d{6,12}$/.test(documentoForm.trim())) {
      errores.push('El documento de identidad debe contener entre 6 y 12 dígitos numéricos.');
    }
    if (codigoForm.trim().length < 4) {
      errores.push('El código institucional (Estudiante/Docente/Staff) es obligatorio.');
    }
    if (rolForm === RolNombre.Docente && especialidadForm.trim().length < 4) {
      errores.push('Para el perfil Docente debe indicar su área o especialidad académica.');
    }

    const correoDuplicado = usuarios.some(
      (u) => u.correo.toLowerCase() === correoLimpio && u.id !== editandoId
    );
    if (correoDuplicado) {
      errores.push(`Ya existe otra cuenta registrada con el correo ${correoLimpio}.`);
    }

    if (errores.length > 0) {
      notificarFeedback('error', 'Validación fallida en formulario de usuario', errores);
      return;
    }

    const planAsociado = planes.find((p) => p.programaId === programaIdForm)?.id;

    if (editandoId) {
      const previo = usuarios.find((u) => u.id === editandoId);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editandoId
            ? {
                ...u,
                correo: correoLimpio,
                nombreCompleto: nombreForm.trim(),
                documento: documentoForm.trim(),
                rol: rolForm,
                codigoInstitucional: codigoForm.trim(),
                programaId: rolForm === RolNombre.Estudiante ? programaIdForm : undefined,
                planId: rolForm === RolNombre.Estudiante ? planAsociado : undefined,
                especialidad: rolForm === RolNombre.Docente ? especialidadForm.trim() : undefined,
              }
            : u
        )
      );

      if (previo && previo.rol !== rolForm) {
        registrarAuditoria(
          'Seguridad',
          'CAMBIO_ROL_USUARIO',
          `Usuario:${editandoId} (${correoLimpio})`,
          `Rol modificado de "${previo.rol}" a "${rolForm}".`
        );
      } else {
        registrarAuditoria(
          'Seguridad',
          'EDICION_USUARIO',
          `Usuario:${editandoId} (${correoLimpio})`,
          `Actualización de datos básicos y ficha ${rolForm}.`
        );
      }
      notificarFeedback('exito', 'Registro de usuario actualizado', [
        `Se guardaron los cambios para ${nombreForm.trim()} (${rolForm}).`,
      ]);
      limpiarFormulario();
    } else {
      const nuevoId = `usr-${Date.now()}`;
      const nuevoUsuario: UsuarioSistema = {
        id: nuevoId,
        correo: correoLimpio,
        nombreCompleto: nombreForm.trim(),
        documento: documentoForm.trim(),
        rol: rolForm,
        activo: true,
        bloqueado: false,
        intentosFallidos: 0,
        codigoInstitucional: codigoForm.trim(),
        programaId: rolForm === RolNombre.Estudiante ? programaIdForm : undefined,
        planId: rolForm === RolNombre.Estudiante ? planAsociado : undefined,
        especialidad: rolForm === RolNombre.Docente ? especialidadForm.trim() : undefined,
      };
      setUsuarios((prev) => [nuevoUsuario, ...prev]);
      registrarAuditoria(
        'Seguridad',
        'CREACION_USUARIO',
        `Usuario:${nuevoId} (${correoLimpio})`,
        `Alta de cuenta con rol ${rolForm} y código ${codigoForm.trim()}.`
      );
      notificarFeedback('exito', 'Usuario creado exitosamente', [
        `Cuenta habilitada para ${nuevoUsuario.nombreCompleto} con rol ${nuevoUsuario.rol}.`,
      ]);
      limpiarFormulario();
    }
  };

  if (modo === 'usuarios') {
    const filtrados = usuarios.filter((u) => {
      const q = busquedaUsr.toLowerCase();
      const matchTexto =
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        u.codigoInstitucional.toLowerCase().includes(q) ||
        u.documento.includes(q);
      const matchRol = filtroRolUsr === 'TODOS' || u.rol === filtroRolUsr;
      const matchEstado =
        filtroEstadoUsr === 'TODOS' ||
        (filtroEstadoUsr === 'ACTIVO' && u.activo && !u.bloqueado) ||
        (filtroEstadoUsr === 'INACTIVO' && !u.activo) ||
        (filtroEstadoUsr === 'BLOQUEADO' && u.bloqueado);
      return matchTexto && matchRol && matchEstado;
    });

    const pag = paginarLista(filtrados, paginaUsr, 5);

    return (
      <div className="space-y-6">
        {/* Formulario Crear / Editar Usuario, Estudiante o Docente */}
        <section className="bg-white border border-indigo-200 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
            <div>
              <span className="text-xs font-semibold text-[#6D28D9]">
                Módulo Seguridad y Gestión Académica · Administración de Cuentas y Perfiles
              </span>
              <h1 className="text-xl font-bold text-[#1E1B4B] mt-0.5">
                {editandoId
                  ? 'Editar Usuario / Asignar Rol'
                  : 'Registrar Nuevo Usuario, Estudiante o Docente'}
              </h1>
            </div>
            {editandoId && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="px-3 py-1.5 text-xs font-semibold bg-[#EEF2FF] text-[#1E1B4B] rounded-lg"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={handleGuardarUsuario} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5" noValidate>
            <div>
              <label htmlFor="usr-nombre" className="block text-xs font-semibold mb-1">
                Nombre completo
              </label>
              <input
                id="usr-nombre"
                type="text"
                value={nombreForm}
                onChange={(e) => setNombreForm(e.target.value)}
                placeholder="Ej. Martín Vargas"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="usr-correo" className="block text-xs font-semibold mb-1">
                Correo institucional
              </label>
              <input
                id="usr-correo"
                type="email"
                value={correoForm}
                onChange={(e) => setCorreoForm(e.target.value)}
                placeholder="nombre.apellido@siga.edu.co"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="usr-doc" className="block text-xs font-semibold mb-1">
                Documento de identidad
              </label>
              <input
                id="usr-doc"
                type="text"
                value={documentoForm}
                onChange={(e) => setDocumentoForm(e.target.value)}
                placeholder="Solo números (6-12 dígitos)"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="usr-rol" className="block text-xs font-semibold mb-1">
                Rol asignado
              </label>
              <select
                id="usr-rol"
                value={rolForm}
                onChange={(e) => setRolForm(e.target.value as RolNombre)}
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              >
                <option value={RolNombre.Estudiante}>Estudiante</option>
                <option value={RolNombre.Docente}>Docente</option>
                <option value={RolNombre.CoordinadorAcademico}>Coordinador académico</option>
                <option value={RolNombre.Administrador}>Administrador</option>
              </select>
            </div>

            <div>
              <label htmlFor="usr-codigo" className="block text-xs font-semibold mb-1">
                Código institucional
              </label>
              <input
                id="usr-codigo"
                type="text"
                value={codigoForm}
                onChange={(e) => setCodigoForm(e.target.value)}
                placeholder="Ej. EST-2026201 o DOC-89012"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              />
            </div>

            {rolForm === RolNombre.Estudiante && (
              <div>
                <label htmlFor="usr-programa" className="block text-xs font-semibold mb-1">
                  Programa académico (Ficha Estudiante)
                </label>
                <select
                  id="usr-programa"
                  value={programaIdForm}
                  onChange={(e) => setProgramaIdForm(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
                >
                  {programas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.codigo})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {rolForm === RolNombre.Docente && (
              <div>
                <label htmlFor="usr-esp" className="block text-xs font-semibold mb-1">
                  Especialidad académica (Ficha Docente)
                </label>
                <input
                  id="usr-esp"
                  type="text"
                  value={especialidadForm}
                  onChange={(e) => setEspecialidadForm(e.target.value)}
                  placeholder="Ej. Ingeniería de Datos"
                  className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
                />
              </div>
            )}

            <div className="md:col-span-3 flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                {editandoId ? 'Guardar cambios de cuenta' : 'Crear cuenta y perfil'}
              </button>
            </div>
          </form>
        </section>

        {/* Directorio de Usuarios con Búsqueda, Filtros y Paginación (RF-11) */}
        <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#1E1B4B]">
              Directorio Institucional de Usuarios, Estudiantes y Docentes
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <label htmlFor="buscar-usuarios" className="sr-only">
                  Buscar usuarios
                </label>
                <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="buscar-usuarios"
                  type="search"
                  value={busquedaUsr}
                  onChange={(e) => {
                    setBusquedaUsr(e.target.value);
                    setPaginaUsr(1);
                  }}
                  placeholder="Nombre, correo, código..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
                />
              </div>
              <label htmlFor="filtro-rol-usr" className="sr-only">
                Filtrar por rol
              </label>
              <select
                id="filtro-rol-usr"
                value={filtroRolUsr}
                onChange={(e) => {
                  setFiltroRolUsr(e.target.value);
                  setPaginaUsr(1);
                }}
                className="px-2.5 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
              >
                <option value="TODOS">Todos los roles</option>
                <option value={RolNombre.Estudiante}>Estudiante</option>
                <option value={RolNombre.Docente}>Docente</option>
                <option value={RolNombre.CoordinadorAcademico}>Coordinador académico</option>
                <option value={RolNombre.Administrador}>Administrador</option>
              </select>
              <label htmlFor="filtro-estado-usr" className="sr-only">
                Filtrar por estado
              </label>
              <select
                id="filtro-estado-usr"
                value={filtroEstadoUsr}
                onChange={(e) => {
                  setFiltroEstadoUsr(e.target.value);
                  setPaginaUsr(1);
                }}
                className="px-2.5 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Desactivados</option>
                <option value="BLOQUEADO">Bloqueados</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-indigo-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EEF2FF] border-b border-indigo-200">
                  <th className="py-2.5 px-3 font-bold">Código / Usuario</th>
                  <th className="py-2.5 px-3 font-bold">Rol y Ficha</th>
                  <th className="py-2.5 px-3 font-bold">Estado</th>
                  <th className="py-2.5 px-3 font-bold text-right">Acciones Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {pag.itemsPagina.map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-50/40">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1E1B4B]">
                        <span className="font-mono-tabular text-[#4338CA]">{u.codigoInstitucional}</span> ·{' '}
                        {u.nombreCompleto}
                      </div>
                      <div className="font-mono-tabular text-slate-600">
                        {u.correo} · Doc: {u.documento}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold">{u.rol}</div>
                      {u.programaId && (
                        <div className="text-slate-600">
                          {programas.find((p) => p.id === u.programaId)?.nombre}
                        </div>
                      )}
                      {u.especialidad && <div className="text-slate-600">{u.especialidad}</div>}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      {!u.activo ? (
                        <span className="text-slate-600 inline-flex items-center gap-1">
                          <UserX className="w-3.5 h-3.5" aria-hidden="true" /> Desactivado
                        </span>
                      ) : u.bloqueado ? (
                        <span className="text-red-700 inline-flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Bloqueado ({u.intentosFallidos}/5)
                        </span>
                      ) : (
                        <span className="text-emerald-700 inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> Activo
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(u)}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#EEF2FF] hover:bg-indigo-200 text-[#1E1B4B] rounded"
                        >
                          Editar / Rol
                        </button>
                        {u.id !== adminActivo.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const nuevoBloq = !u.bloqueado;
                                setUsuarios((prev) =>
                                  prev.map((item) =>
                                    item.id === u.id
                                      ? {
                                          ...item,
                                          bloqueado: nuevoBloq,
                                          intentosFallidos: nuevoBloq ? 5 : 0,
                                        }
                                      : item
                                  )
                                );
                                registrarAuditoria(
                                  'Seguridad',
                                  nuevoBloq ? 'BLOQUEO_USUARIO' : 'DESBLOQUEO_USUARIO',
                                  `Usuario:${u.id} (${u.correo})`,
                                  nuevoBloq
                                    ? 'Bloqueo preventivo aplicado por Administrador.'
                                    : 'Desbloqueo de cuenta y reinicio de contador de intentos.'
                                );
                                notificarFeedback(
                                  'exito',
                                  nuevoBloq ? 'Cuenta bloqueada' : 'Cuenta desbloqueada',
                                  [`Se actualizó el estado de acceso de ${u.correo}.`]
                                );
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded"
                            >
                              {u.bloqueado ? (
                                <>
                                  <Unlock className="w-3 h-3" aria-hidden="true" /> Desbloquear
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3 h-3" aria-hidden="true" /> Bloquear
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nuevoActivo = !u.activo;
                                setUsuarios((prev) =>
                                  prev.map((item) =>
                                    item.id === u.id ? { ...item, activo: nuevoActivo } : item
                                  )
                                );
                                registrarAuditoria(
                                  'Seguridad',
                                  nuevoActivo ? 'ACTIVACION_USUARIO' : 'DESACTIVACION_USUARIO',
                                  `Usuario:${u.id} (${u.correo})`,
                                  `Estado activo cambiado a ${nuevoActivo}.`
                                );
                                notificarFeedback(
                                  'exito',
                                  nuevoActivo ? 'Usuario reactivado' : 'Usuario desactivado',
                                  [`Cuenta ${u.correo} actualizada.`]
                                );
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded"
                            >
                              {u.activo ? 'Desactivar' : 'Reactivar'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            paginaActual={pag.paginaSegura}
            totalPaginas={pag.totalPaginas}
            totalItems={pag.totalItems}
            tamanoPagina={5}
            onPageChange={setPaginaUsr}
            etiquetaTabla="usuarios del sistema"
          />
        </section>
      </div>
    );
  }

  // ==================== PANTALLA DE AUDITORÍA (FILTROS POR USUARIO, ACCIÓN Y FECHA + PAGINACIÓN) ====================
  const accionesUnicas = Array.from(new Set(auditoria.map((a) => a.accion))).sort();

  const auditoriaFiltrada = auditoria.filter((ev) => {
    const matchUsuario =
      !filtroAudUsuario.trim() ||
      ev.usuario.toLowerCase().includes(filtroAudUsuario.toLowerCase()) ||
      ev.registroAfectado.toLowerCase().includes(filtroAudUsuario.toLowerCase());
    const matchAccion = filtroAudAccion === 'TODAS' || ev.accion === filtroAudAccion;
    const matchFecha = !filtroAudFecha || ev.fechaISO.slice(0, 10) === filtroAudFecha;
    return matchUsuario && matchAccion && matchFecha;
  });

  const pagAud = paginarLista(auditoriaFiltrada, paginaAud, 6);

  return (
    <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
        <div>
          <span className="text-xs font-semibold text-[#6D28D9]">
            Módulo Auditoría · Registro Inmutable de Operaciones (RF-12)
          </span>
          <h1 className="text-xl font-bold text-[#1E1B4B] mt-0.5">
            Bitácora de Eventos de Seguridad y Negocio
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label htmlFor="aud-usuario" className="sr-only">
              Filtrar por usuario o registro afectado
            </label>
            <input
              id="aud-usuario"
              type="search"
              value={filtroAudUsuario}
              onChange={(e) => {
                setFiltroAudUsuario(e.target.value);
                setPaginaAud(1);
              }}
              placeholder="Usuario o registro afectado..."
              className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
            />
          </div>

          <div>
            <label htmlFor="aud-accion" className="sr-only">
              Filtrar por tipo de acción
            </label>
            <select
              id="aud-accion"
              value={filtroAudAccion}
              onChange={(e) => {
                setFiltroAudAccion(e.target.value);
                setPaginaAud(1);
              }}
              className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
            >
              <option value="TODAS">Todas las acciones</option>
              {accionesUnicas.map((ac) => (
                <option key={ac} value={ac}>
                  {ac}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aud-fecha" className="sr-only">
              Filtrar por fecha exacta
            </label>
            <input
              id="aud-fecha"
              type="date"
              value={filtroAudFecha}
              onChange={(e) => {
                setFiltroAudFecha(e.target.value);
                setPaginaAud(1);
              }}
              className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
            />
          </div>

          {(filtroAudUsuario || filtroAudAccion !== 'TODAS' || filtroAudFecha) && (
            <button
              type="button"
              onClick={() => {
                setFiltroAudUsuario('');
                setFiltroAudAccion('TODAS');
                setFiltroAudFecha('');
                setPaginaAud(1);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-[#EEF2FF] text-[#4338CA] rounded-lg"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-indigo-200 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#EEF2FF] border-b border-indigo-200">
              <th className="py-2.5 px-3 font-bold whitespace-nowrap">Fecha / Hora</th>
              <th className="py-2.5 px-3 font-bold">Usuario y Rol</th>
              <th className="py-2.5 px-3 font-bold">Acción</th>
              <th className="py-2.5 px-3 font-bold">Registro Afectado</th>
              <th className="py-2.5 px-3 font-bold">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-100">
            {pagAud.itemsPagina.map((ev) => (
              <tr key={ev.id} className="hover:bg-indigo-50/40">
                <td className="py-2.5 px-3 font-mono-tabular whitespace-nowrap">
                  {ev.fechaISO.slice(0, 19).replace('T', ' ')}
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-mono-tabular font-semibold">{ev.usuario}</div>
                  <div className="text-slate-600">{ev.rol}</div>
                </td>
                <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#4338CA]">
                  {ev.accion}
                </td>
                <td className="py-2.5 px-3 font-mono-tabular">{ev.registroAfectado}</td>
                <td className="py-2.5 px-3">{ev.detalle}</td>
              </tr>
            ))}
            {pagAud.totalItems === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-600">
                  No existen registros de auditoría para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        paginaActual={pagAud.paginaSegura}
        totalPaginas={pagAud.totalPaginas}
        totalItems={pagAud.totalItems}
        tamanoPagina={6}
        onPageChange={setPaginaAud}
        etiquetaTabla="eventos de auditoría"
      />
    </section>
  );
};
