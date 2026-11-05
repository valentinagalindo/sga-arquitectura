import React, { useState } from 'react';
import {
  CalificacionRegistro,
  EstadoCalificacion,
  EventoAuditoria,
  Grupo,
  HistorialAsignatura,
  PeriodoAcademico,
  UsuarioSistema,
  calcularNotaDefinitiva,
  calcularPromedioAcumulado,
  formatearMinutosAHora,
  paginarLista,
  validarRangoCalificacion,
  validarSolicitudMatricula,
} from '../domain/academicRules';
import { PaginationBar } from './PaginationBar';
import { Download, FileText, Search } from 'lucide-react';

// ==================== VISTA DOCENTE: SOLO SUS GRUPOS Y LISTAS DE CLASE ====================
interface TeacherViewsProps {
  docente: UsuarioSistema;
  grupos: Grupo[];
  calificaciones: CalificacionRegistro[];
  setCalificaciones: React.Dispatch<React.SetStateAction<CalificacionRegistro[]>>;
  registrarAuditoria: (
    modulo: EventoAuditoria['modulo'],
    accion: string,
    registroAfectado: string,
    detalle: string
  ) => void;
  agregarNotificacion: (
    usuarioDestinoId: string,
    tipo: 'MATRICULA_CONFIRMADA' | 'NOTA_PUBLICADA' | 'SEGURIDAD',
    mensaje: string
  ) => void;
  notificarFeedback: (tipo: 'exito' | 'error', titulo: string, detalles: string[]) => void;
}

export const TeacherViews: React.FC<TeacherViewsProps> = ({
  docente,
  grupos,
  calificaciones,
  setCalificaciones,
  registrarAuditoria,
  agregarNotificacion,
  notificarFeedback,
}) => {
  // Estrictamente solo los grupos donde el docente autenticado es titular
  const misGrupos = grupos.filter((g) => g.docenteId === docente.id);
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState<string>(misGrupos[0]?.id || '');

  const [busquedaEst, setBusquedaEst] = useState('');
  const [filtroEstadoCal, setFiltroEstadoCal] = useState('TODOS');
  const [paginaCal, setPaginaCal] = useState(1);

  const grupoActual = misGrupos.find((g) => g.id === grupoSeleccionadoId) || misGrupos[0];

  const handleActualizarNota = (
    cal: CalificacionRegistro,
    campo: 'corte1' | 'corte2' | 'examenFinal',
    valorStr: string
  ) => {
    const grp = grupos.find((g) => g.id === cal.grupoId);
    if (!grp || grp.docenteId !== docente.id) {
      registrarAuditoria(
        'Calificaciones',
        'ACCESO_DENEGADO_403',
        `Grupo:${cal.grupoCodigo}`,
        'Intento bloqueado de edición de calificación sobre un grupo no asignado al docente.'
      );
      notificarFeedback('error', 'Acceso denegado (403)', [
        'No posee titularidad sobre el grupo solicitado.',
      ]);
      return;
    }

    const num = Number(valorStr);
    if (!validarRangoCalificacion(num)) return;

    setCalificaciones((prev) =>
      prev.map((item) =>
        item.id === cal.id && item.estado === EstadoCalificacion.Borrador
          ? { ...item, [campo]: num, actualizadoISO: new Date().toISOString() }
          : item
      )
    );
  };

  const handleGuardarOPublicar = (cal: CalificacionRegistro, nuevoEstado: EstadoCalificacion) => {
    const grp = grupos.find((g) => g.id === cal.grupoId);
    if (!grp || grp.docenteId !== docente.id) {
      registrarAuditoria(
        'Calificaciones',
        'ACCESO_DENEGADO_403',
        `Grupo:${cal.grupoCodigo}`,
        'Intento bloqueado sobre grupo ajeno.'
      );
      notificarFeedback('error', 'Acceso denegado (403)', [
        'Operación rechazada por falta de titularidad docente.',
      ]);
      return;
    }

    if (
      !validarRangoCalificacion(cal.corte1) ||
      !validarRangoCalificacion(cal.corte2) ||
      !validarRangoCalificacion(cal.examenFinal)
    ) {
      notificarFeedback('error', 'Calificación fuera de rango', [
        'Las notas deben encontrarse en el rango numérico de 0.0 a 5.0.',
      ]);
      return;
    }

    setCalificaciones((prev) =>
      prev.map((item) =>
        item.id === cal.id
          ? { ...item, estado: nuevoEstado, actualizadoISO: new Date().toISOString() }
          : item
      )
    );

    const def = calcularNotaDefinitiva(cal.corte1, cal.corte2, cal.examenFinal);
    registrarAuditoria(
      'Calificaciones',
      nuevoEstado === EstadoCalificacion.Publicada
        ? 'CALIFICACION_PUBLICADA'
        : 'CALIFICACION_BORRADOR',
      `Calificación:${cal.id} (${cal.estudianteCodigo} · ${cal.grupoCodigo})`,
      `Nota registrada (${def.toFixed(2)}) en estado ${nuevoEstado}.`
    );

    if (nuevoEstado === EstadoCalificacion.Publicada) {
      agregarNotificacion(
        cal.estudianteId,
        'NOTA_PUBLICADA',
        `Se ha publicado su calificación definitiva (${def.toFixed(2)}) en ${cal.asignaturaNombre} (${cal.grupoCodigo}).`
      );
    }

    notificarFeedback(
      'exito',
      nuevoEstado === EstadoCalificacion.Publicada
        ? 'Calificación publicada oficialmente'
        : 'Calificación guardada en borrador',
      [
        `Estudiante: ${cal.estudianteNombre} · Definitiva: ${def.toFixed(2)}.`,
        nuevoEstado === EstadoCalificacion.Publicada
          ? 'La nota ya es visible para el estudiante y se registró el evento de auditoría.'
          : 'El borrador puede seguir editándose antes del cierre evaluativo.',
      ]
    );
  };

  const listaClaseFiltrada = calificaciones.filter((c) => {
    if (!grupoActual || c.grupoId !== grupoActual.id) return false;
    const matchTxt =
      !busquedaEst.trim() ||
      c.estudianteNombre.toLowerCase().includes(busquedaEst.toLowerCase()) ||
      c.estudianteCodigo.toLowerCase().includes(busquedaEst.toLowerCase());
    const matchEst = filtroEstadoCal === 'TODOS' || c.estado === filtroEstadoCal;
    return matchTxt && matchEst;
  });

  const pagCal = paginarLista(listaClaseFiltrada, paginaCal, 5);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
          <div>
            <span className="text-xs font-semibold text-[#6D28D9]">
              Módulo Calificaciones · Carga Académica Asignada a {docente.nombreCompleto}
            </span>
            <h1 className="text-xl font-bold text-[#1E1B4B] mt-0.5">
              Mis Grupos Asignados y Planilla de Evaluación
            </h1>
            <p className="text-xs text-[#1E1B4B]/80 mt-0.5">
              Solo se listan los grupos bajo su titularidad académica ({misGrupos.length} grupos asignados).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {misGrupos.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setGrupoSeleccionadoId(g.id);
                  setPaginaCal(1);
                }}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  grupoActual?.id === g.id
                    ? 'bg-[#4338CA] text-white border-[#4338CA]'
                    : 'bg-white text-[#1E1B4B] border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                {g.codigoGrupo} · {g.asignatura.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros y búsqueda de la lista de clase (RF-11) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <label htmlFor="doc-buscar-est" className="sr-only">
              Buscar estudiante en lista de clase
            </label>
            <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="doc-buscar-est"
              type="search"
              value={busquedaEst}
              onChange={(e) => {
                setBusquedaEst(e.target.value);
                setPaginaCal(1);
              }}
              placeholder="Buscar por estudiante o código..."
              className="pl-8 pr-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
            />
          </div>

          <div>
            <label htmlFor="doc-filtro-estado" className="sr-only">
              Filtrar por estado de calificación
            </label>
            <select
              id="doc-filtro-estado"
              value={filtroEstadoCal}
              onChange={(e) => {
                setFiltroEstadoCal(e.target.value);
                setPaginaCal(1);
              }}
              className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
            >
              <option value="TODOS">Todos los estados</option>
              <option value={EstadoCalificacion.Borrador}>En borrador</option>
              <option value={EstadoCalificacion.Publicada}>Publicadas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-indigo-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#EEF2FF] border-b border-indigo-200">
                <th className="py-2.5 px-3 font-bold">Estudiante</th>
                <th className="py-2.5 px-3 font-bold text-right">Corte 1 (30%)</th>
                <th className="py-2.5 px-3 font-bold text-right">Corte 2 (30%)</th>
                <th className="py-2.5 px-3 font-bold text-right">Examen (40%)</th>
                <th className="py-2.5 px-3 font-bold text-right">Definitiva</th>
                <th className="py-2.5 px-3 font-bold">Estado</th>
                <th className="py-2.5 px-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              {pagCal.itemsPagina.map((cal) => {
                const def = calcularNotaDefinitiva(cal.corte1, cal.corte2, cal.examenFinal);
                const editable = cal.estado === EstadoCalificacion.Borrador;
                return (
                  <tr key={cal.id} className="hover:bg-indigo-50/40">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1E1B4B]">{cal.estudianteNombre}</div>
                      <div className="font-mono-tabular text-slate-600">{cal.estudianteCodigo}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">
                      {editable ? (
                        <input
                          aria-label={`Corte 1 de ${cal.estudianteNombre}`}
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={cal.corte1}
                          onChange={(e) => handleActualizarNota(cal, 'corte1', e.target.value)}
                          className="w-16 px-2 py-1 text-right border border-indigo-300 rounded bg-white"
                        />
                      ) : (
                        cal.corte1.toFixed(1)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">
                      {editable ? (
                        <input
                          aria-label={`Corte 2 de ${cal.estudianteNombre}`}
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={cal.corte2}
                          onChange={(e) => handleActualizarNota(cal, 'corte2', e.target.value)}
                          className="w-16 px-2 py-1 text-right border border-indigo-300 rounded bg-white"
                        />
                      ) : (
                        cal.corte2.toFixed(1)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">
                      {editable ? (
                        <input
                          aria-label={`Examen final de ${cal.estudianteNombre}`}
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={cal.examenFinal}
                          onChange={(e) => handleActualizarNota(cal, 'examenFinal', e.target.value)}
                          className="w-16 px-2 py-1 text-right border border-indigo-300 rounded bg-white"
                        />
                      ) : (
                        cal.examenFinal.toFixed(1)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-bold text-[#4338CA]">
                      {def.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      {editable ? (
                        <span className="text-amber-800">Borrador</span>
                      ) : (
                        <span className="text-emerald-800">Publicada</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {editable ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleGuardarOPublicar(cal, EstadoCalificacion.Borrador)}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#EEF2FF] hover:bg-indigo-200 text-[#1E1B4B] rounded"
                          >
                            Guardar borrador
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGuardarOPublicar(cal, EstadoCalificacion.Publicada)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded"
                          >
                            Publicar
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500">Publicada</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {pagCal.totalItems === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-600">
                    No hay estudiantes matriculados que coincidan con el filtro en este grupo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          paginaActual={pagCal.paginaSegura}
          totalPaginas={pagCal.totalPaginas}
          totalItems={pagCal.totalItems}
          tamanoPagina={5}
          onPageChange={setPaginaCal}
          etiquetaTabla="lista de clase"
        />
      </section>
    </div>
  );
};

// ==================== VISTAS ESTUDIANTE: MATRÍCULA, HORARIO Y NOTAS PUBLICADAS / CERTIFICADO ====================
interface StudentViewsProps {
  modo: 'matricula' | 'horario' | 'notas';
  estudiante: UsuarioSistema;
  periodoActivo: PeriodoAcademico;
  grupos: Grupo[];
  setGrupos: React.Dispatch<React.SetStateAction<Grupo[]>>;
  gruposMatriculadosIds: string[];
  setGruposMatriculadosIds: React.Dispatch<React.SetStateAction<string[]>>;
  historialAprobado: HistorialAsignatura[];
  calificaciones: CalificacionRegistro[];
  registrarAuditoria: (
    modulo: EventoAuditoria['modulo'],
    accion: string,
    registroAfectado: string,
    detalle: string
  ) => void;
  agregarNotificacion: (
    usuarioDestinoId: string,
    tipo: 'MATRICULA_CONFIRMADA' | 'NOTA_PUBLICADA' | 'SEGURIDAD',
    mensaje: string
  ) => void;
  notificarFeedback: (tipo: 'exito' | 'error', titulo: string, detalles: string[]) => void;
}

export const StudentViews: React.FC<StudentViewsProps> = ({
  modo,
  estudiante,
  periodoActivo,
  grupos,
  setGrupos,
  gruposMatriculadosIds,
  setGruposMatriculadosIds,
  historialAprobado,
  calificaciones,
  registrarAuditoria,
  agregarNotificacion,
  notificarFeedback,
}) => {
  const [busqMat, setBusqMat] = useState('');
  const [filtroCupoMat, setFiltroCupoMat] = useState('TODOS');
  const [paginaMat, setPaginaMat] = useState(1);

  const [busqHor, setBusqHor] = useState('');
  const [filtroDiaHor, setFiltroDiaHor] = useState('TODOS');
  const [paginaHor, setPaginaHor] = useState(1);

  const [busqNotas, setBusqNotas] = useState('');
  const [filtroPerNotas, setFiltroPerNotas] = useState('TODOS');
  const [paginaNotas, setPaginaNotas] = useState(1);

  const codigosAprobados = historialAprobado.filter((h) => h.aprobada).map((h) => h.codigoAsignatura);
  const gruposInscritos = grupos.filter((g) => gruposMatriculadosIds.includes(g.id));
  const creditosInscritos = gruposInscritos.reduce((acc, g) => acc + g.asignatura.creditos, 0);

  if (modo === 'matricula') {
    const ofertaPeriodo = grupos.filter((g) => {
      if (g.periodoCodigo !== periodoActivo.codigo) return false;
      const matchTxt =
        !busqMat.trim() ||
        g.codigoGrupo.toLowerCase().includes(busqMat.toLowerCase()) ||
        g.asignatura.nombre.toLowerCase().includes(busqMat.toLowerCase()) ||
        g.asignatura.codigo.toLowerCase().includes(busqMat.toLowerCase());
      const matchCupo =
        filtroCupoMat === 'TODOS' ||
        (filtroCupoMat === 'CON_CUPO' && g.cupoOcupado < g.cupoMaximo) ||
        (filtroCupoMat === 'INSCRITOS' && gruposMatriculadosIds.includes(g.id));
      return matchTxt && matchCupo;
    });

    const pagMat = paginarLista(ofertaPeriodo, paginaMat, 5);

    const handleInscribir = (g: Grupo) => {
      const val = validarSolicitudMatricula({
        periodo: periodoActivo,
        ahoraISO: '2026-11-02T20:00:00Z',
        grupoCandidato: g,
        gruposYaMatriculados: gruposInscritos,
        codigosAprobados,
        creditosMaximos: 18,
      });

      if (!val.valida) {
        registrarAuditoria(
          'Matrícula',
          'MATRICULA_RECHAZADA_VALIDACION',
          `Grupo:${g.codigoGrupo}`,
          val.errores.join(' | ')
        );
        notificarFeedback(
          'error',
          `Inscripción rechazada en ${g.codigoGrupo} (${g.asignatura.nombre})`,
          val.errores
        );
        return;
      }

      setGruposMatriculadosIds((prev) => [...prev, g.id]);
      setGrupos((prev) =>
        prev.map((item) => (item.id === g.id ? { ...item, cupoOcupado: item.cupoOcupado + 1 } : item))
      );

      registrarAuditoria(
        'Matrícula',
        'MATRICULA_CONFIRMADA',
        `Grupo:${g.codigoGrupo} (${g.asignatura.codigo})`,
        `Inscripción confirmada para ${estudiante.codigoInstitucional} en periodo ${periodoActivo.codigo}.`
      );
      agregarNotificacion(
        estudiante.id,
        'MATRICULA_CONFIRMADA',
        `Matrícula confirmada en ${g.asignatura.nombre} (${g.codigoGrupo}) para el periodo ${periodoActivo.codigo}.`
      );
      notificarFeedback('exito', 'Matrícula confirmada', [
        `Asignatura inscrita: ${g.asignatura.nombre} (${g.codigoGrupo}).`,
      ]);
    };

    const handleRetirar = (g: Grupo) => {
      if (periodoActivo.estado !== 'matrícula abierta') {
        notificarFeedback('error', 'Operación fuera de ventana', [
          `El periodo ${periodoActivo.codigo} se encuentra en estado "${periodoActivo.estado}".`,
        ]);
        return;
      }
      setGruposMatriculadosIds((prev) => prev.filter((id) => id !== g.id));
      setGrupos((prev) =>
        prev.map((item) =>
          item.id === g.id ? { ...item, cupoOcupado: Math.max(0, item.cupoOcupado - 1) } : item
        )
      );
      registrarAuditoria(
        'Matrícula',
        'MATRICULA_CANCELADA',
        `Grupo:${g.codigoGrupo}`,
        `Retiro voluntario de asignatura por ${estudiante.codigoInstitucional}.`
      );
      notificarFeedback('exito', 'Asignatura retirada', [
        `Se liberó el cupo en el grupo ${g.codigoGrupo}.`,
      ]);
    };

    return (
      <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
          <div>
            <span className="text-xs font-semibold text-[#6D28D9]">
              Módulo Matrícula · Validación de Periodo, Cupo, Cruce Horario y Prerrequisitos
            </span>
            <h1 className="text-xl font-bold text-[#1E1B4B] mt-0.5">
              Oferta Académica — Periodo {periodoActivo.codigo} ({periodoActivo.estado})
            </h1>
            <p className="text-xs text-[#1E1B4B]/80 mt-0.5">
              Asignaturas aprobadas en historial:{' '}
              <strong className="font-mono-tabular">{codigosAprobados.join(', ')}</strong>
            </p>
          </div>
          <div className="bg-[#EEF2FF] px-4 py-2 rounded-lg text-xs font-mono-tabular">
            Créditos inscritos: <strong>{creditosInscritos} / 18</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <label htmlFor="est-busq-mat" className="sr-only">
              Buscar asignatura o grupo
            </label>
            <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="est-busq-mat"
              type="search"
              value={busqMat}
              onChange={(e) => {
                setBusqMat(e.target.value);
                setPaginaMat(1);
              }}
              placeholder="Código o asignatura..."
              className="pl-8 pr-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
            />
          </div>

          <select
            aria-label="Filtrar disponibilidad de grupos"
            value={filtroCupoMat}
            onChange={(e) => {
              setFiltroCupoMat(e.target.value);
              setPaginaMat(1);
            }}
            className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
          >
            <option value="TODOS">Toda la oferta</option>
            <option value="CON_CUPO">Con cupos disponibles</option>
            <option value="INSCRITOS">Mis grupos inscritos</option>
          </select>
        </div>

        <div className="overflow-x-auto border border-indigo-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#EEF2FF] border-b border-indigo-200">
                <th className="py-2.5 px-3 font-bold">Grupo / Asignatura</th>
                <th className="py-2.5 px-3 font-bold text-right">Créd.</th>
                <th className="py-2.5 px-3 font-bold">Prerrequisitos</th>
                <th className="py-2.5 px-3 font-bold">Horario y Aula</th>
                <th className="py-2.5 px-3 font-bold text-right">Cupos</th>
                <th className="py-2.5 px-3 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              {pagMat.itemsPagina.map((g) => {
                const inscrito = gruposMatriculadosIds.includes(g.id);
                return (
                  <tr key={g.id} className="hover:bg-indigo-50/40">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1E1B4B]">
                        <span className="font-mono-tabular text-[#4338CA]">{g.codigoGrupo}</span> ·{' '}
                        {g.asignatura.nombre}
                      </div>
                      <div className="text-slate-600">Docente: {g.docenteNombre}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">{g.asignatura.creditos}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">
                      {g.asignatura.prerrequisitos.join(', ') || 'Ninguno'}
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular">
                      {g.horarios.map((h) => (
                        <div key={h.id}>
                          {h.dia} {formatearMinutosAHora(h.horaInicioMinutos)}–
                          {formatearMinutosAHora(h.horaFinMinutos)} · {h.aula}
                        </div>
                      ))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold">
                      {g.cupoOcupado} / {g.cupoMaximo}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {inscrito ? (
                        <button
                          type="button"
                          onClick={() => handleRetirar(g)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-900 rounded-md"
                        >
                          Retirar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInscribir(g)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-md"
                        >
                          Inscribir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PaginationBar
          paginaActual={pagMat.paginaSegura}
          totalPaginas={pagMat.totalPaginas}
          totalItems={pagMat.totalItems}
          tamanoPagina={5}
          onPageChange={setPaginaMat}
          etiquetaTabla="oferta de matrícula"
        />
      </section>
    );
  }

  if (modo === 'horario') {
    const sesiones = gruposInscritos.flatMap((g) =>
      g.horarios.map((h) => ({
        id: `${g.id}-${h.id}`,
        dia: h.dia,
        franja: `${formatearMinutosAHora(h.horaInicioMinutos)} – ${formatearMinutosAHora(h.horaFinMinutos)}`,
        aula: h.aula,
        codigoGrupo: g.codigoGrupo,
        asignaturaNombre: g.asignatura.nombre,
        docenteNombre: g.docenteNombre,
      }))
    );

    const sesionesFiltradas = sesiones.filter((s) => {
      const matchTxt =
        !busqHor.trim() ||
        s.asignaturaNombre.toLowerCase().includes(busqHor.toLowerCase()) ||
        s.aula.toLowerCase().includes(busqHor.toLowerCase());
      const matchDia = filtroDiaHor === 'TODOS' || s.dia === filtroDiaHor;
      return matchTxt && matchDia;
    });

    const pagHor = paginarLista(sesionesFiltradas, paginaHor, 5);

    return (
      <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
        <div className="border-b border-indigo-100 pb-4">
          <span className="text-xs font-semibold text-[#6D28D9]">
            Consulta Académica · Solo Lectura
          </span>
          <h1 className="text-xl font-bold text-[#1E1B4B] mt-0.5">
            Mi Horario de Clases — Periodo {periodoActivo.codigo}
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            aria-label="Buscar en mi horario"
            value={busqHor}
            onChange={(e) => {
              setBusqHor(e.target.value);
              setPaginaHor(1);
            }}
            placeholder="Filtrar por asignatura o aula..."
            className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
          />
          <select
            aria-label="Filtrar horario por día"
            value={filtroDiaHor}
            onChange={(e) => {
              setFiltroDiaHor(e.target.value);
              setPaginaHor(1);
            }}
            className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
          >
            <option value="TODOS">Todos los días</option>
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto border border-indigo-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#EEF2FF] border-b border-indigo-200">
                <th className="py-2.5 px-3 font-bold">Día</th>
                <th className="py-2.5 px-3 font-bold">Franja Horaria</th>
                <th className="py-2.5 px-3 font-bold">Asignatura / Grupo</th>
                <th className="py-2.5 px-3 font-bold">Docente</th>
                <th className="py-2.5 px-3 font-bold">Aula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              {pagHor.itemsPagina.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3 font-bold">{s.dia}</td>
                  <td className="py-2.5 px-3 font-mono-tabular">{s.franja}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono-tabular font-semibold text-[#4338CA]">
                      {s.codigoGrupo}
                    </span>{' '}
                    · {s.asignaturaNombre}
                  </td>
                  <td className="py-2.5 px-3">{s.docenteNombre}</td>
                  <td className="py-2.5 px-3">{s.aula}</td>
                </tr>
              ))}
              {pagHor.totalItems === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-600">
                    No registra sesiones horarias para los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          paginaActual={pagHor.paginaSegura}
          totalPaginas={pagHor.totalPaginas}
          totalItems={pagHor.totalItems}
          tamanoPagina={5}
          onPageChange={setPaginaHor}
          etiquetaTabla="mi horario semanal"
        />
      </section>
    );
  }

  // ==================== NOTAS PUBLICADAS Y CERTIFICADO ACADÉMICO (SOLO LECTURA) ====================
  const notasPublicadasEstudiante = calificaciones
    .filter(
      (c) => c.estudianteId === estudiante.id && c.estado === EstadoCalificacion.Publicada
    )
    .map((c) => ({
      codigoAsignatura: c.asignaturaCodigo,
      nombreAsignatura: c.asignaturaNombre,
      creditos: c.creditos,
      periodoCodigo: c.periodoCodigo,
      notaDefinitiva: calcularNotaDefinitiva(c.corte1, c.corte2, c.examenFinal),
      aprobada: calcularNotaDefinitiva(c.corte1, c.corte2, c.examenFinal) >= 3.0,
    }));

  // Consolidar historial previo + notas recién publicadas sin duplicar código
  const consolidadoMap = new Map<string, HistorialAsignatura>();
  historialAprobado.forEach((h) => consolidadoMap.set(`${h.periodoCodigo}-${h.codigoAsignatura}`, h));
  notasPublicadasEstudiante.forEach((n) =>
    consolidadoMap.set(`${n.periodoCodigo}-${n.codigoAsignatura}`, n)
  );
  const consolidado = Array.from(consolidadoMap.values());
  const pga = calcularPromedioAcumulado(consolidado);

  const consolidadoFiltrado = consolidado.filter((item) => {
    const matchTxt =
      !busqNotas.trim() ||
      item.codigoAsignatura.toLowerCase().includes(busqNotas.toLowerCase()) ||
      item.nombreAsignatura.toLowerCase().includes(busqNotas.toLowerCase());
    const matchPer = filtroPerNotas === 'TODOS' || item.periodoCodigo === filtroPerNotas;
    return matchTxt && matchPer;
  });

  const pagNotas = paginarLista(consolidadoFiltrado, paginaNotas, 5);
  const periodosDisponibles = Array.from(new Set(consolidado.map((c) => c.periodoCodigo))).sort();

  const descargarCertificadoCSV = () => {
    const headers = ['Periodo', 'Codigo', 'Asignatura', 'Creditos', 'NotaDefinitiva', 'Concepto'];
    const rows = consolidado.map((c) => [
      c.periodoCodigo,
      c.codigoAsignatura,
      `"${c.nombreAsignatura}"`,
      String(c.creditos),
      c.notaDefinitiva.toFixed(2),
      c.aprobada ? 'APROBADA' : 'REPROBADA',
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `certificado-academico-${estudiante.codigoInstitucional}.csv`;
    a.click();

    registrarAuditoria(
      'Reportes',
      'DESCARGA_CERTIFICADO_CSV',
      `Estudiante:${estudiante.codigoInstitucional}`,
      `Descarga de historial académico con PGA ${pga.toFixed(2)}.`
    );
  };

  return (
    <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
        <div>
          <span className="text-xs font-semibold text-[#6D28D9]">
            Registro y Control Académico · Solo Calificaciones Publicadas (RF-16 y RF-19)
          </span>
          <h1 className="text-xl font-bold text-[#1E1B4B] mt-0.5">
            Historial Académico y Certificado de Calificaciones
          </h1>
          <p className="text-xs text-[#1E1B4B]/80 mt-0.5">
            Estudiante: <strong>{estudiante.nombreCompleto}</strong> · Código:{' '}
            <span className="font-mono-tabular">{estudiante.codigoInstitucional}</span> · Promedio General Acumulado:{' '}
            <strong className="font-mono-tabular text-[#4338CA]">{pga.toFixed(2)} / 5.00</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={descargarCertificadoCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#EEF2FF] hover:bg-indigo-200 text-[#1E1B4B] rounded-lg"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Descargar CSV
          </button>
          <button
            type="button"
            onClick={() => {
              registrarAuditoria(
                'Reportes',
                'EMISION_CERTIFICADO_PDF',
                `Estudiante:${estudiante.codigoInstitucional}`,
                `Generación de certificado académico en PDF (PGA ${pga.toFixed(2)}).`
              );
              window.print();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            Emitir Certificado PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <input
          type="search"
          aria-label="Buscar en certificado de notas"
          value={busqNotas}
          onChange={(e) => {
            setBusqNotas(e.target.value);
            setPaginaNotas(1);
          }}
          placeholder="Buscar por código o asignatura..."
          className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
        />
        <select
          aria-label="Filtrar notas por periodo"
          value={filtroPerNotas}
          onChange={(e) => {
            setFiltroPerNotas(e.target.value);
            setPaginaNotas(1);
          }}
          className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
        >
          <option value="TODOS">Todos los periodos cursados</option>
          {periodosDisponibles.map((p) => (
            <option key={p} value={p}>
              Periodo {p}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border border-indigo-200 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#EEF2FF] border-b border-indigo-200">
              <th className="py-2.5 px-3 font-bold">Periodo</th>
              <th className="py-2.5 px-3 font-bold">Código</th>
              <th className="py-2.5 px-3 font-bold">Asignatura</th>
              <th className="py-2.5 px-3 font-bold text-right">Créditos</th>
              <th className="py-2.5 px-3 font-bold text-right">Calificación Publicada</th>
              <th className="py-2.5 px-3 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-100">
            {pagNotas.itemsPagina.map((item) => (
              <tr key={`${item.periodoCodigo}-${item.codigoAsignatura}`}>
                <td className="py-2.5 px-3 font-mono-tabular">{item.periodoCodigo}</td>
                <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#4338CA]">
                  {item.codigoAsignatura}
                </td>
                <td className="py-2.5 px-3 font-medium">{item.nombreAsignatura}</td>
                <td className="py-2.5 px-3 text-right font-mono-tabular">{item.creditos}</td>
                <td className="py-2.5 px-3 text-right font-mono-tabular font-bold">
                  {item.notaDefinitiva.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 font-semibold text-emerald-800">
                  {item.aprobada ? 'Aprobada' : 'Reprobada'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar
        paginaActual={pagNotas.paginaSegura}
        totalPaginas={pagNotas.totalPaginas}
        totalItems={pagNotas.totalItems}
        tamanoPagina={5}
        onPageChange={setPaginaNotas}
        etiquetaTabla="historial de calificaciones publicadas"
      />
    </section>
  );
};
