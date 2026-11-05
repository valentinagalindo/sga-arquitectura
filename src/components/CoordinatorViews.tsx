import React, { useState } from 'react';
import {
  AsignaturaItem,
  CalificacionRegistro,
  EstadoPeriodo,
  EventoAuditoria,
  Grupo,
  Horario,
  PeriodoAcademico,
  PlanEstudioItem,
  ProgramaAcademico,
  RolNombre,
  UsuarioSistema,
  calcularNotaDefinitiva,
  formatearMinutosAHora,
  paginarLista,
} from '../domain/academicRules';
import { PaginationBar } from './PaginationBar';
import { Download, FileText, Plus, Search } from 'lucide-react';

interface CoordinatorViewsProps {
  modo: 'programas' | 'periodos-grupos' | 'reportes';
  programas: ProgramaAcademico[];
  setProgramas: React.Dispatch<React.SetStateAction<ProgramaAcademico[]>>;
  planes: PlanEstudioItem[];
  setPlanes: React.Dispatch<React.SetStateAction<PlanEstudioItem[]>>;
  asignaturas: AsignaturaItem[];
  setAsignaturas: React.Dispatch<React.SetStateAction<AsignaturaItem[]>>;
  periodos: PeriodoAcademico[];
  setPeriodos: React.Dispatch<React.SetStateAction<PeriodoAcademico[]>>;
  grupos: Grupo[];
  setGrupos: React.Dispatch<React.SetStateAction<Grupo[]>>;
  docentes: UsuarioSistema[];
  calificaciones: CalificacionRegistro[];
  registrarAuditoria: (
    modulo: EventoAuditoria['modulo'],
    accion: string,
    registroAfectado: string,
    detalle: string
  ) => void;
  notificarFeedback: (tipo: 'exito' | 'error', titulo: string, detalles: string[]) => void;
}

export const CoordinatorViews: React.FC<CoordinatorViewsProps> = ({
  modo,
  programas,
  setProgramas,
  planes,
  setPlanes,
  asignaturas,
  setAsignaturas,
  periodos,
  setPeriodos,
  grupos,
  setGrupos,
  docentes,
  calificaciones,
  registrarAuditoria,
  notificarFeedback,
}) => {
  // === Estado Curricular (Programas, Planes y Asignaturas) ===
  const [progEditId, setProgEditId] = useState<string | null>(null);
  const [progCodigo, setProgCodigo] = useState('');
  const [progNombre, setProgNombre] = useState('');
  const [progFacultad, setProgFacultad] = useState('Facultad de Ingeniería y Ciencias Básicas');

  const [planEditId, setPlanEditId] = useState<string | null>(null);
  const [planProgId, setPlanProgId] = useState(programas[0]?.id || '');
  const [planVersion, setPlanVersion] = useState('');
  const [planCreditos, setPlanCreditos] = useState('160');

  const [asigEditId, setAsigEditId] = useState<string | null>(null);
  const [asigPlanId, setAsigPlanId] = useState(planes[0]?.id || '');
  const [asigCodigo, setAsigCodigo] = useState('');
  const [asigNombre, setAsigNombre] = useState('');
  const [asigCreditos, setAsigCreditos] = useState('3');
  const [asigSemestre, setAsigSemestre] = useState('1');
  const [asigPrereq, setAsigPrereq] = useState('');

  const [busquedaAsig, setBusquedaAsig] = useState('');
  const [filtroSemestreAsig, setFiltroSemestreAsig] = useState('TODOS');
  const [paginaAsig, setPaginaAsig] = useState(1);

  // === Estado Periodos y Grupos ===
  const [perCodigo, setPerCodigo] = useState('');
  const [perNombre, setPerNombre] = useState('');
  const [perInicio, setPerInicio] = useState('2027-07-01');
  const [perFin, setPerFin] = useState('2027-08-05');

  const [grpCodigo, setGrpCodigo] = useState('');
  const [grpAsigId, setGrpAsigId] = useState(asignaturas[0]?.id || '');
  const [grpPeriodoCod, setGrpPeriodoCod] = useState('2026-2');
  const [grpDocenteId, setGrpDocenteId] = useState(docentes[0]?.id || '');
  const [grpCupo, setGrpCupo] = useState('25');
  const [grpDia, setGrpDia] = useState<Horario['dia']>('Lunes');
  const [grpHoraIni, setGrpHoraIni] = useState('08:00');
  const [grpHoraFin, setGrpHoraFin] = useState('10:00');
  const [grpAula, setGrpAula] = useState('Edificio B · Aula 204');

  const [busquedaGrp, setBusquedaGrp] = useState('');
  const [filtroPeriodoGrp, setFiltroPeriodoGrp] = useState('TODOS');
  const [paginaGrp, setPaginaGrp] = useState(1);

  // === Estado Reportes por Periodo y Programa ===
  const [repPeriodo, setRepPeriodo] = useState('TODOS');
  const [repPrograma, setRepPrograma] = useState('TODOS');
  const [repBusqueda, setRepBusqueda] = useState('');
  const [paginaRep, setPaginaRep] = useState(1);

  const convertirHoraAMinutos = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  if (modo === 'programas') {
    const handleGuardarPrograma = (e: React.FormEvent) => {
      e.preventDefault();
      if (progCodigo.trim().length < 3 || progNombre.trim().length < 5) {
        notificarFeedback('error', 'Datos incompletos en Programa', [
          'El código SNIES/interno y el nombre del programa son obligatorios.',
        ]);
        return;
      }
      if (progEditId) {
        setProgramas((prev) =>
          prev.map((p) =>
            p.id === progEditId
              ? { ...p, codigo: progCodigo.trim(), nombre: progNombre.trim(), facultad: progFacultad.trim() }
              : p
          )
        );
        registrarAuditoria(
          'Gestión Académica',
          'EDICION_PROGRAMA',
          `Programa:${progEditId} (${progCodigo.trim()})`,
          `Actualizado programa ${progNombre.trim()}.`
        );
        notificarFeedback('exito', 'Programa actualizado', [progNombre.trim()]);
      } else {
        const nuevoId = `prog-${Date.now()}`;
        setProgramas((prev) => [
          ...prev,
          { id: nuevoId, codigo: progCodigo.trim(), nombre: progNombre.trim(), facultad: progFacultad.trim(), activo: true },
        ]);
        registrarAuditoria(
          'Gestión Académica',
          'CREACION_PROGRAMA',
          `Programa:${nuevoId} (${progCodigo.trim()})`,
          `Creado programa académico ${progNombre.trim()}.`
        );
        notificarFeedback('exito', 'Programa académico registrado', [progNombre.trim()]);
      }
      setProgEditId(null);
      setProgCodigo('');
      setProgNombre('');
    };

    const handleCrearPlan = (e: React.FormEvent) => {
      e.preventDefault();
      const cred = Number(planCreditos);
      if (!planVersion.trim() || !Number.isFinite(cred) || cred < 60) {
        notificarFeedback('error', 'Validación de Plan de Estudio', [
          'Indique una versión válida y un total de créditos mayor o igual a 60.',
        ]);
        return;
      }
      if (planEditId) {
        setPlanes((prev) =>
          prev.map((pl) =>
            pl.id === planEditId
              ? { ...pl, programaId: planProgId, version: planVersion.trim(), creditosTotales: cred }
              : pl
          )
        );
        registrarAuditoria(
          'Gestión Académica',
          'EDICION_PLAN_ESTUDIO',
          `PlanEstudio:${planEditId} (${planVersion.trim()})`,
          `Actualizado plan en programa ${planProgId} con ${cred} créditos.`
        );
        notificarFeedback('exito', 'Plan de estudio actualizado', [`Versión ${planVersion.trim()} actualizada.`]);
      } else {
        const nuevoId = `plan-${Date.now()}`;
        setPlanes((prev) => [
          ...prev,
          { id: nuevoId, programaId: planProgId, version: planVersion.trim(), creditosTotales: cred, vigente: true },
        ]);
        registrarAuditoria(
          'Gestión Académica',
          'CREACION_PLAN_ESTUDIO',
          `PlanEstudio:${nuevoId} (${planVersion.trim()})`,
          `Asociado al programa ${planProgId} con ${cred} créditos.`
        );
        notificarFeedback('exito', 'Plan de estudio creado', [`Versión ${planVersion.trim()} activa.`]);
      }
      setPlanEditId(null);
      setPlanVersion('');
    };

    const handleGuardarAsignatura = (e: React.FormEvent) => {
      e.preventDefault();
      const cred = Number(asigCreditos);
      const sem = Number(asigSemestre);
      if (
        asigCodigo.trim().length < 3 ||
        asigNombre.trim().length < 4 ||
        cred < 1 ||
        cred > 12 ||
        sem < 1 ||
        sem > 12
      ) {
        notificarFeedback('error', 'Validación de Asignatura', [
          'Ingrese código, nombre, créditos (1–12) y semestre (1–12) válidos.',
        ]);
        return;
      }
      const prereqs = asigPrereq
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      if (asigEditId) {
        setAsignaturas((prev) =>
          prev.map((a) =>
            a.id === asigEditId
              ? {
                  ...a,
                  planId: asigPlanId,
                  codigo: asigCodigo.trim().toUpperCase(),
                  nombre: asigNombre.trim(),
                  creditos: cred,
                  semestre: sem,
                  prerrequisitos: prereqs,
                }
              : a
          )
        );
        registrarAuditoria(
          'Gestión Académica',
          'EDICION_ASIGNATURA',
          `Asignatura:${asigCodigo.trim().toUpperCase()}`,
          `Actualizada asignatura ${asigNombre.trim()} (${cred} créd., sem. ${sem}).`
        );
        notificarFeedback('exito', 'Asignatura actualizada', [asigNombre.trim()]);
      } else {
        const id = `asig-${Date.now()}`;
        setAsignaturas((prev) => [
          {
            id,
            planId: asigPlanId,
            codigo: asigCodigo.trim().toUpperCase(),
            nombre: asigNombre.trim(),
            creditos: cred,
            semestre: sem,
            prerrequisitos: prereqs,
          },
          ...prev,
        ]);
        registrarAuditoria(
          'Gestión Académica',
          'CREACION_ASIGNATURA',
          `Asignatura:${asigCodigo.trim().toUpperCase()}`,
          `Registrada en plan ${asigPlanId} (${cred} créditos, semestre ${sem}).`
        );
        notificarFeedback('exito', 'Asignatura creada', [
          `${asigCodigo.trim().toUpperCase()} · ${asigNombre.trim()}`,
        ]);
      }
      setAsigEditId(null);
      setAsigCodigo('');
      setAsigNombre('');
      setAsigPrereq('');
    };

    const asigFiltradas = asignaturas.filter((a) => {
      const matchTxt =
        a.codigo.toLowerCase().includes(busquedaAsig.toLowerCase()) ||
        a.nombre.toLowerCase().includes(busquedaAsig.toLowerCase());
      const matchSem = filtroSemestreAsig === 'TODOS' || String(a.semestre) === filtroSemestreAsig;
      return matchTxt && matchSem;
    });
    const pagAsig = paginarLista(asigFiltradas, paginaAsig, 5);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-[#1E1B4B]">
              {progEditId ? 'Editar Programa Académico' : 'Crear Programa Académico'}
            </h2>
            <form onSubmit={handleGuardarPrograma} className="space-y-3" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prog-cod" className="block text-xs font-semibold mb-1">
                    Código SNIES / Interno
                  </label>
                  <input
                    id="prog-cod"
                    type="text"
                    value={progCodigo}
                    onChange={(e) => setProgCodigo(e.target.value)}
                    placeholder="SNIES-11204"
                    className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="prog-nom" className="block text-xs font-semibold mb-1">
                    Nombre del Programa
                  </label>
                  <input
                    id="prog-nom"
                    type="text"
                    value={progNombre}
                    onChange={(e) => setProgNombre(e.target.value)}
                    placeholder="Ingeniería de Ciberseguridad"
                    className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <ul className="text-xs text-slate-600 space-y-0.5">
                  {programas.map((p) => (
                    <li key={p.id}>
                      <strong>{p.codigo}</strong> · {p.nombre}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setProgEditId(p.id);
                          setProgCodigo(p.codigo);
                          setProgNombre(p.nombre);
                          setProgFacultad(p.facultad);
                        }}
                        className="text-[#4338CA] underline ml-1"
                      >
                        Editar
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] rounded-lg shrink-0"
                >
                  {progEditId ? 'Actualizar' : 'Guardar Programa'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-[#1E1B4B]">
              {planEditId ? 'Editar Plan de Estudio' : 'Registrar Plan de Estudio'}
            </h2>
            <form onSubmit={handleCrearPlan} className="space-y-3" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="plan-prog" className="block text-xs font-semibold mb-1">
                    Programa
                  </label>
                  <select
                    id="plan-prog"
                    value={planProgId}
                    onChange={(e) => setPlanProgId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
                  >
                    {programas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="plan-ver" className="block text-xs font-semibold mb-1">
                    Código Versión
                  </label>
                  <input
                    id="plan-ver"
                    type="text"
                    value={planVersion}
                    onChange={(e) => setPlanVersion(e.target.value)}
                    placeholder="IS-2027-V2"
                    className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="plan-cred" className="block text-xs font-semibold mb-1">
                    Créditos Totales
                  </label>
                  <input
                    id="plan-cred"
                    type="number"
                    value={planCreditos}
                    onChange={(e) => setPlanCreditos(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <ul className="text-xs text-slate-600 space-y-0.5">
                  {planes.map((pl) => (
                    <li key={pl.id}>
                      <strong>{pl.version}</strong> ({pl.creditosTotales} créd.){' '}
                      <button
                        type="button"
                        onClick={() => {
                          setPlanEditId(pl.id);
                          setPlanProgId(pl.programaId);
                          setPlanVersion(pl.version);
                          setPlanCreditos(String(pl.creditosTotales));
                        }}
                        className="text-[#4338CA] underline ml-1"
                      >
                        Editar
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] rounded-lg shrink-0"
                >
                  {planEditId ? 'Actualizar Plan' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Catálogo y Formulario de Asignaturas */}
        <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1E1B4B]">
            {asigEditId ? 'Editar Asignatura' : 'Crear Asignatura en Plan de Estudio'}
          </h2>
          <form onSubmit={handleGuardarAsignatura} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end" noValidate>
            <div>
              <label htmlFor="asig-plan" className="block text-xs font-semibold mb-1">
                Plan de Estudio
              </label>
              <select
                id="asig-plan"
                value={asigPlanId}
                onChange={(e) => setAsigPlanId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              >
                {planes.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.version}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="asig-cod" className="block text-xs font-semibold mb-1">
                Código
              </label>
              <input
                id="asig-cod"
                type="text"
                value={asigCodigo}
                onChange={(e) => setAsigCodigo(e.target.value)}
                placeholder="IS-401"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="asig-nom" className="block text-xs font-semibold mb-1">
                Nombre Asignatura
              </label>
              <input
                id="asig-nom"
                type="text"
                value={asigNombre}
                onChange={(e) => setAsigNombre(e.target.value)}
                placeholder="Ingeniería de Confiabilidad"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="asig-cred" className="block text-xs font-semibold mb-1">
                  Créditos
                </label>
                <input
                  id="asig-cred"
                  type="number"
                  min="1"
                  max="12"
                  value={asigCreditos}
                  onChange={(e) => setAsigCreditos(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-indigo-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="asig-sem" className="block text-xs font-semibold mb-1">
                  Semestre
                </label>
                <input
                  id="asig-sem"
                  type="number"
                  min="1"
                  max="12"
                  value={asigSemestre}
                  onChange={(e) => setAsigSemestre(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-indigo-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label htmlFor="asig-pre" className="block text-xs font-semibold mb-1">
                Prerrequisitos (coma)
              </label>
              <input
                id="asig-pre"
                type="text"
                value={asigPrereq}
                onChange={(e) => setAsigPrereq(e.target.value)}
                placeholder="IS-304, IS-310"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-6 flex justify-end gap-2">
              {asigEditId && (
                <button
                  type="button"
                  onClick={() => {
                    setAsigEditId(null);
                    setAsigCodigo('');
                    setAsigNombre('');
                    setAsigPrereq('');
                  }}
                  className="px-3 py-2 text-xs font-semibold bg-[#EEF2FF] rounded-lg"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-[#4338CA] rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {asigEditId ? 'Actualizar Asignatura' : 'Guardar Asignatura'}
              </button>
            </div>
          </form>

          {/* Filtros tabla Asignaturas */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-indigo-100">
            <div className="relative">
              <label htmlFor="buscar-asig" className="sr-only">
                Buscar asignatura
              </label>
              <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="buscar-asig"
                type="search"
                value={busquedaAsig}
                onChange={(e) => {
                  setBusquedaAsig(e.target.value);
                  setPaginaAsig(1);
                }}
                placeholder="Código o nombre..."
                className="pl-8 pr-3 py-1.5 text-xs border border-indigo-200 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="filtro-sem-asig" className="sr-only">
                Filtrar por semestre
              </label>
              <select
                id="filtro-sem-asig"
                value={filtroSemestreAsig}
                onChange={(e) => {
                  setFiltroSemestreAsig(e.target.value);
                  setPaginaAsig(1);
                }}
                className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
              >
                <option value="TODOS">Todos los semestres</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                  <option key={s} value={String(s)}>
                    Semestre {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-indigo-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EEF2FF] border-b border-indigo-200">
                  <th className="py-2.5 px-3 font-bold">Código</th>
                  <th className="py-2.5 px-3 font-bold">Asignatura</th>
                  <th className="py-2.5 px-3 font-bold">Plan</th>
                  <th className="py-2.5 px-3 font-bold text-right">Créditos</th>
                  <th className="py-2.5 px-3 font-bold text-right">Semestre</th>
                  <th className="py-2.5 px-3 font-bold">Prerrequisitos</th>
                  <th className="py-2.5 px-3 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {pagAsig.itemsPagina.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-3 font-mono-tabular font-bold text-[#4338CA]">{a.codigo}</td>
                    <td className="py-2.5 px-3 font-medium">{a.nombre}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">
                      {planes.find((pl) => pl.id === a.planId)?.version || a.planId}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">{a.creditos}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">{a.semestre}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">
                      {a.prerrequisitos.join(', ') || 'Ninguno'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAsigEditId(a.id);
                          setAsigPlanId(a.planId);
                          setAsigCodigo(a.codigo);
                          setAsigNombre(a.nombre);
                          setAsigCreditos(String(a.creditos));
                          setAsigSemestre(String(a.semestre));
                          setAsigPrereq(a.prerrequisitos.join(', '));
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#EEF2FF] hover:bg-indigo-200 rounded"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            paginaActual={pagAsig.paginaSegura}
            totalPaginas={pagAsig.totalPaginas}
            totalItems={pagAsig.totalItems}
            tamanoPagina={5}
            onPageChange={setPaginaAsig}
            etiquetaTabla="asignaturas curriculares"
          />
        </section>
      </div>
    );
  }

  if (modo === 'periodos-grupos') {
    const handleCrearPeriodo = (e: React.FormEvent) => {
      e.preventDefault();
      if (!perCodigo.trim() || !perNombre.trim() || perInicio >= perFin) {
        notificarFeedback('error', 'Validación de Periodo Académico', [
          'Indique código, nombre y una ventana donde la fecha final sea posterior a la inicial.',
        ]);
        return;
      }
      if (periodos.some((p) => p.codigo === perCodigo.trim())) {
        notificarFeedback('error', 'Código duplicado', [`El periodo ${perCodigo.trim()} ya existe.`]);
        return;
      }
      const nuevo: PeriodoAcademico = {
        id: `per-${Date.now()}`,
        codigo: perCodigo.trim(),
        nombre: perNombre.trim(),
        estado: EstadoPeriodo.Planeado,
        ventanaInicioISO: `${perInicio}T00:00:00Z`,
        ventanaFinISO: `${perFin}T23:59:59Z`,
      };
      setPeriodos((prev) => [nuevo, ...prev]);
      registrarAuditoria(
        'Periodos y Grupos',
        'CREACION_PERIODO',
        `PeriodoAcadémico:${nuevo.codigo}`,
        `Creado en estado planeado con ventana ${perInicio} a ${perFin}.`
      );
      notificarFeedback('exito', 'Periodo académico creado', [`${nuevo.codigo} · ${nuevo.nombre}`]);
      setPerCodigo('');
      setPerNombre('');
    };

    const handleCrearGrupo = (e: React.FormEvent) => {
      e.preventDefault();
      const cupo = Number(grpCupo);
      const minIni = convertirHoraAMinutos(grpHoraIni);
      const minFin = convertirHoraAMinutos(grpHoraFin);
      const asigObj = asignaturas.find((a) => a.id === grpAsigId);
      const docObj = docentes.find((d) => d.id === grpDocenteId);

      if (!grpCodigo.trim() || !asigObj || !docObj || cupo < 5 || minFin <= minIni || !grpAula.trim()) {
        notificarFeedback('error', 'Validación de Grupo', [
          'Verifique código de grupo, cupo (>= 5), aula y que la hora fin sea posterior a la hora inicio.',
        ]);
        return;
      }

      const nuevoGrupo: Grupo = {
        id: `grp-${Date.now()}`,
        codigoGrupo: grpCodigo.trim().toUpperCase(),
        asignatura: asigObj,
        docenteId: docObj.id,
        docenteNombre: docObj.nombreCompleto,
        periodoCodigo: grpPeriodoCod,
        cupoMaximo: cupo,
        cupoOcupado: 0,
        horarios: [
          {
            id: `hor-${Date.now()}`,
            dia: grpDia,
            horaInicioMinutos: minIni,
            horaFinMinutos: minFin,
            aula: grpAula.trim(),
          },
        ],
      };

      setGrupos((prev) => [nuevoGrupo, ...prev]);
      registrarAuditoria(
        'Periodos y Grupos',
        'CREACION_GRUPO',
        `Grupo:${nuevoGrupo.codigoGrupo} (${asigObj.codigo})`,
        `Periodo ${grpPeriodoCod}, cupo ${cupo}, docente ${docObj.nombreCompleto}, ${grpDia} ${grpHoraIni}-${grpHoraFin}.`
      );
      notificarFeedback('exito', 'Grupo ofertado exitosamente', [
        `Grupo ${nuevoGrupo.codigoGrupo} habilitado en periodo ${grpPeriodoCod}.`,
      ]);
      setGrpCodigo('');
    };

    const gruposFiltrados = grupos.filter((g) => {
      const matchTxt =
        g.codigoGrupo.toLowerCase().includes(busquedaGrp.toLowerCase()) ||
        g.asignatura.nombre.toLowerCase().includes(busquedaGrp.toLowerCase()) ||
        g.docenteNombre.toLowerCase().includes(busquedaGrp.toLowerCase());
      const matchPer = filtroPeriodoGrp === 'TODOS' || g.periodoCodigo === filtroPeriodoGrp;
      return matchTxt && matchPer;
    });
    const pagGrp = paginarLista(gruposFiltrados, paginaGrp, 5);

    return (
      <div className="space-y-6">
        {/* Gestión de Periodos Académicos y Estados (RF-14) */}
        <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
          <h1 className="text-xl font-bold text-[#1E1B4B]">
            Periodos Académicos y Estados de Ventana (RF-14)
          </h1>
          <form onSubmit={handleCrearPeriodo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end" noValidate>
            <div>
              <label htmlFor="per-cod" className="block text-xs font-semibold mb-1">
                Código Periodo
              </label>
              <input
                id="per-cod"
                type="text"
                value={perCodigo}
                onChange={(e) => setPerCodigo(e.target.value)}
                placeholder="2027-2"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="per-nom" className="block text-xs font-semibold mb-1">
                Descripción
              </label>
              <input
                id="per-nom"
                type="text"
                value={perNombre}
                onChange={(e) => setPerNombre(e.target.value)}
                placeholder="Segundo Semestre 2027"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="per-ini" className="block text-xs font-semibold mb-1">
                Inicio Ventana
              </label>
              <input
                id="per-ini"
                type="date"
                value={perInicio}
                onChange={(e) => setPerInicio(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="per-fin" className="block text-xs font-semibold mb-1">
                Fin Ventana
              </label>
              <input
                id="per-fin"
                type="date"
                value={perFin}
                onChange={(e) => setPerFin(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#4338CA] rounded-lg"
            >
              Crear Periodo
            </button>
          </form>

          <div className="overflow-x-auto border border-indigo-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EEF2FF] border-b border-indigo-200">
                  <th className="py-2.5 px-3 font-bold">Periodo</th>
                  <th className="py-2.5 px-3 font-bold">Ventana Matrícula</th>
                  <th className="py-2.5 px-3 font-bold">Estado Actual</th>
                  <th className="py-2.5 px-3 font-bold text-right">Cambiar Estado (RF-14)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {periodos.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3">
                      <span className="font-mono-tabular font-bold text-[#4338CA]">{p.codigo}</span> ·{' '}
                      {p.nombre}
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular">
                      {p.ventanaInicioISO.slice(0, 10)} a {p.ventanaFinISO.slice(0, 10)}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{p.estado}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1">
                        {Object.values(EstadoPeriodo).map((est) => (
                          <button
                            key={est}
                            type="button"
                            onClick={() => {
                              setPeriodos((prev) =>
                                prev.map((item) => (item.id === p.id ? { ...item, estado: est } : item))
                              );
                              registrarAuditoria(
                                'Periodos y Grupos',
                                'CAMBIO_ESTADO_PERIODO',
                                `PeriodoAcadémico:${p.codigo}`,
                                `Estado cambiado de "${p.estado}" a "${est}".`
                              );
                              notificarFeedback('exito', `Periodo ${p.codigo} actualizado`, [
                                `Nuevo estado vigente: ${est}.`,
                              ]);
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                              p.estado === est
                                ? 'bg-[#4338CA] text-white border-[#4338CA]'
                                : 'bg-white text-[#1E1B4B] border-indigo-200 hover:bg-indigo-50'
                            }`}
                          >
                            {est}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Creación y Tabla Paginada de Grupos */}
        <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1E1B4B]">
            Programación de Grupos (Cupo, Docente, Horario y Aula)
          </h2>
          <form onSubmit={handleCrearGrupo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end" noValidate>
            <div>
              <label htmlFor="grp-cod" className="block text-xs font-semibold mb-1">
                Código Grupo
              </label>
              <input
                id="grp-cod"
                type="text"
                value={grpCodigo}
                onChange={(e) => setGrpCodigo(e.target.value)}
                placeholder="IS304-02"
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="grp-asig" className="block text-xs font-semibold mb-1">
                Asignatura
              </label>
              <select
                id="grp-asig"
                value={grpAsigId}
                onChange={(e) => setGrpAsigId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              >
                {asignaturas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.codigo} · {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="grp-per" className="block text-xs font-semibold mb-1">
                Periodo
              </label>
              <select
                id="grp-per"
                value={grpPeriodoCod}
                onChange={(e) => setGrpPeriodoCod(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              >
                {periodos.map((p) => (
                  <option key={p.id} value={p.codigo}>
                    {p.codigo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="grp-doc" className="block text-xs font-semibold mb-1">
                Docente Titular
              </label>
              <select
                id="grp-doc"
                value={grpDocenteId}
                onChange={(e) => setGrpDocenteId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              >
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombreCompleto}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="grp-cupo" className="block text-xs font-semibold mb-1">
                Cupo Máximo
              </label>
              <input
                id="grp-cupo"
                type="number"
                min="5"
                max="80"
                value={grpCupo}
                onChange={(e) => setGrpCupo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="grp-dia" className="block text-xs font-semibold mb-1">
                Día Semana
              </label>
              <select
                id="grp-dia"
                value={grpDia}
                onChange={(e) => setGrpDia(e.target.value as Horario['dia'])}
                className="w-full px-2.5 py-2 text-xs border border-indigo-300 rounded-lg bg-white"
              >
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="grp-ini" className="block text-xs font-semibold mb-1">
                  Inicio
                </label>
                <input
                  id="grp-ini"
                  type="time"
                  value={grpHoraIni}
                  onChange={(e) => setGrpHoraIni(e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-indigo-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="grp-fin" className="block text-xs font-semibold mb-1">
                  Fin
                </label>
                <input
                  id="grp-fin"
                  type="time"
                  value={grpHoraFin}
                  onChange={(e) => setGrpHoraFin(e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-indigo-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label htmlFor="grp-aula" className="block text-xs font-semibold mb-1">
                Aula / Laboratorio
              </label>
              <input
                id="grp-aula"
                type="text"
                value={grpAula}
                onChange={(e) => setGrpAula(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4338CA] rounded-lg"
              >
                Abrir Grupo Académico
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-indigo-100">
            <input
              type="search"
              aria-label="Buscar grupos"
              value={busquedaGrp}
              onChange={(e) => {
                setBusquedaGrp(e.target.value);
                setPaginaGrp(1);
              }}
              placeholder="Buscar por grupo, asignatura o docente..."
              className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg w-64"
            />
            <select
              aria-label="Filtrar grupos por periodo"
              value={filtroPeriodoGrp}
              onChange={(e) => {
                setFiltroPeriodoGrp(e.target.value);
                setPaginaGrp(1);
              }}
              className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
            >
              <option value="TODOS">Todos los periodos</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.codigo}>
                  Periodo {p.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto border border-indigo-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EEF2FF] border-b border-indigo-200">
                  <th className="py-2.5 px-3 font-bold">Grupo / Asignatura</th>
                  <th className="py-2.5 px-3 font-bold">Periodo</th>
                  <th className="py-2.5 px-3 font-bold">Docente Titular</th>
                  <th className="py-2.5 px-3 font-bold">Horario y Aula</th>
                  <th className="py-2.5 px-3 font-bold text-right">Cupos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {pagGrp.itemsPagina.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2.5 px-3">
                      <span className="font-mono-tabular font-bold text-[#4338CA]">{g.codigoGrupo}</span> ·{' '}
                      {g.asignatura.nombre}
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular">{g.periodoCodigo}</td>
                    <td className="py-2.5 px-3">{g.docenteNombre}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">
                      {g.horarios
                        .map(
                          (h) =>
                            `${h.dia} ${formatearMinutosAHora(h.horaInicioMinutos)}–${formatearMinutosAHora(h.horaFinMinutos)} (${h.aula})`
                        )
                        .join(' | ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold">
                      {g.cupoOcupado} / {g.cupoMaximo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            paginaActual={pagGrp.paginaSegura}
            totalPaginas={pagGrp.totalPaginas}
            totalItems={pagGrp.totalItems}
            tamanoPagina={5}
            onPageChange={setPaginaGrp}
            etiquetaTabla="grupos ofertados"
          />
        </section>
      </div>
    );
  }

  // ==================== REPORTES CON FILTROS POR PERIODO Y PROGRAMA (RF-10, RF-18) ====================
  const registrosReporte = calificaciones.filter((c) => {
    const matchPer = repPeriodo === 'TODOS' || c.periodoCodigo === repPeriodo;
    const matchProg = repPrograma === 'TODOS' || c.programaId === repPrograma;
    const matchTxt =
      !repBusqueda.trim() ||
      c.estudianteNombre.toLowerCase().includes(repBusqueda.toLowerCase()) ||
      c.asignaturaNombre.toLowerCase().includes(repBusqueda.toLowerCase()) ||
      c.grupoCodigo.toLowerCase().includes(repBusqueda.toLowerCase());
    return matchPer && matchProg && matchTxt;
  });

  const pagRep = paginarLista(registrosReporte, paginaRep, 5);

  const exportarCSVReporte = () => {
    const headers = ['Periodo', 'Programa', 'Grupo', 'Asignatura', 'Estudiante', 'Definitiva', 'Estado'];
    const rows = registrosReporte.map((r) => [
      r.periodoCodigo,
      `"${programas.find((p) => p.id === r.programaId)?.nombre || r.programaId}"`,
      r.grupoCodigo,
      `"${r.asignaturaNombre}"`,
      `"${r.estudianteNombre}"`,
      calcularNotaDefinitiva(r.corte1, r.corte2, r.examenFinal).toFixed(2),
      r.estado,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((x) => x.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-academico-${repPeriodo}-${repPrograma}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    registrarAuditoria(
      'Reportes',
      'EXPORTACION_REPORTE_CSV',
      `Reporte:${repPeriodo}/${repPrograma}`,
      `Exportados ${registrosReporte.length} registros filtrados a CSV.`
    );
    notificarFeedback('exito', 'Reporte CSV descargado', [
      `Se exportaron ${registrosReporte.length} registros según los filtros activos.`,
    ]);
  };

  return (
    <section className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
        <div>
          <span className="text-xs font-semibold text-[#6D28D9]">
            Módulo Reportes · Consolidado por Periodo y Programa (RF-10 y RF-18)
          </span>
          <h1 className="text-xl font-bold text-[#1E1B4B] mt-0.5">
            Reporte de Rendimiento y Matrícula Académica
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={exportarCSVReporte}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#EEF2FF] hover:bg-indigo-200 text-[#1E1B4B] rounded-lg"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => {
              registrarAuditoria(
                'Reportes',
                'EXPORTACION_REPORTE_PDF',
                `Reporte:${repPeriodo}/${repPrograma}`,
                `Generación de documento PDF con ${registrosReporte.length} filas.`
              );
              window.print();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Controles de Filtro por Periodo, Programa y Búsqueda (RF-11) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div>
          <label htmlFor="rep-periodo" className="block text-xs font-semibold mb-1">
            Filtrar por Periodo Académico
          </label>
          <select
            id="rep-periodo"
            value={repPeriodo}
            onChange={(e) => {
              setRepPeriodo(e.target.value);
              setPaginaRep(1);
            }}
            className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg bg-white"
          >
            <option value="TODOS">Todos los periodos</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.codigo}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rep-programa" className="block text-xs font-semibold mb-1">
            Filtrar por Programa Académico
          </label>
          <select
            id="rep-programa"
            value={repPrograma}
            onChange={(e) => {
              setRepPrograma(e.target.value);
              setPaginaRep(1);
            }}
            className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg bg-white"
          >
            <option value="TODOS">Todos los programas</option>
            {programas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rep-busq" className="block text-xs font-semibold mb-1">
            Búsqueda por Estudiante o Asignatura
          </label>
          <input
            id="rep-busq"
            type="search"
            value={repBusqueda}
            onChange={(e) => {
              setRepBusqueda(e.target.value);
              setPaginaRep(1);
            }}
            placeholder="Filtrar resultados..."
            className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg bg-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-indigo-200 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#EEF2FF] border-b border-indigo-200">
              <th className="py-2.5 px-3 font-bold">Periodo</th>
              <th className="py-2.5 px-3 font-bold">Programa</th>
              <th className="py-2.5 px-3 font-bold">Grupo / Asignatura</th>
              <th className="py-2.5 px-3 font-bold">Estudiante</th>
              <th className="py-2.5 px-3 font-bold text-right">Definitiva</th>
              <th className="py-2.5 px-3 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-100">
            {pagRep.itemsPagina.map((r) => (
              <tr key={r.id}>
                <td className="py-2.5 px-3 font-mono-tabular">{r.periodoCodigo}</td>
                <td className="py-2.5 px-3">
                  {programas.find((p) => p.id === r.programaId)?.nombre || r.programaId}
                </td>
                <td className="py-2.5 px-3">
                  <span className="font-mono-tabular font-semibold text-[#4338CA]">{r.grupoCodigo}</span> ·{' '}
                  {r.asignaturaNombre}
                </td>
                <td className="py-2.5 px-3">
                  {r.estudianteNombre} ({r.estudianteCodigo})
                </td>
                <td className="py-2.5 px-3 text-right font-mono-tabular font-bold">
                  {calcularNotaDefinitiva(r.corte1, r.corte2, r.examenFinal).toFixed(2)}
                </td>
                <td className="py-2.5 px-3 font-semibold">{r.estado}</td>
              </tr>
            ))}
            {pagRep.totalItems === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-600">
                  No se encontraron registros para la combinación de periodo y programa seleccionada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        paginaActual={pagRep.paginaSegura}
        totalPaginas={pagRep.totalPaginas}
        totalItems={pagRep.totalItems}
        tamanoPagina={5}
        onPageChange={setPaginaRep}
        etiquetaTabla="reporte académico"
      />
    </section>
  );
};
