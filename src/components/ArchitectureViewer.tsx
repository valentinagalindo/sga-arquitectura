import React, { useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';
import { DIAGRAMAS_PLANTUML, MATRIZ_TRAZABILIDAD } from '../data/architectureDocs';
import { paginarLista } from '../domain/academicRules';
import { PaginationBar } from './PaginationBar';

export const ArchitectureViewer: React.FC = () => {
  const [seccionActiva, setSeccionActiva] = useState<'req' | 'arq' | 'uml' | 'matriz' | 'riesgos'>('req');
  const [diagramaActivo, setDiagramaActivo] = useState<string>(DIAGRAMAS_PLANTUML[0].id);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [filtroMatriz, setFiltroMatriz] = useState<string>('');
  const [filtroTipoMatriz, setFiltroTipoMatriz] = useState<string>('TODOS');
  const [paginaMatriz, setPaginaMatriz] = useState<number>(1);

  const handleCopiar = async (id: string, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      setCopiadoId(null);
    }
  };

  const filasFiltradas = MATRIZ_TRAZABILIDAD.filter((f) => {
    const coincideTexto =
      f.codigo.toLowerCase().includes(filtroMatriz.toLowerCase()) ||
      f.especificacion.toLowerCase().includes(filtroMatriz.toLowerCase()) ||
      f.modulosComponentes.toLowerCase().includes(filtroMatriz.toLowerCase());
    const coincideTipo = filtroTipoMatriz === 'TODOS' || f.tipo === filtroTipoMatriz;
    return coincideTexto && coincideTipo;
  });

  const paginacionMatriz = paginarLista(filasFiltradas, paginaMatriz, 8);
  const diagSeleccionado =
    DIAGRAMAS_PLANTUML.find((d) => d.id === diagramaActivo) || DIAGRAMAS_PLANTUML[0];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-indigo-200/80 rounded-xl p-5 sm:p-6">
        <div className="space-y-4 border-b border-indigo-100 pb-5">
          <div>
            <p className="text-xs font-medium text-[#4338CA]">
              Documentación Arquitectónica · Modelo 4+1 de Kruchten · WCAG 2.2 AA
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] mt-1">
              Especificación de Arquitectura — Sistema Académico SIGA
            </h1>
          </div>
          <div
            role="tablist"
            aria-label="Secciones de documentación arquitectónica"
            className="flex flex-wrap items-center gap-1.5 bg-[#EEF2FF] p-1.5 rounded-lg w-fit"
          >
            {[
              { id: 'req', label: '1. Clasificación y Reglas' },
              { id: 'arq', label: '2. Arquitectura y ADRs' },
              { id: 'uml', label: '3. Diagramas PlantUML (5)' },
              { id: 'matriz', label: '4. Matriz Trazabilidad' },
              { id: 'riesgos', label: '5. Análisis Crítico' },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={seccionActiva === tab.id}
                onClick={() => setSeccionActiva(tab.id as typeof seccionActiva)}
                className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA] ${
                  seccionActiva === tab.id
                    ? 'bg-[#4338CA] text-white'
                    : 'text-[#1E1B4B] hover:bg-indigo-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {seccionActiva === 'req' && (
          <div className="pt-6 space-y-6 text-sm leading-relaxed text-[#1E1B4B]">
            <div className="bg-[#EEF2FF] border border-indigo-200 rounded-lg p-4 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-[#1E1B4B]">
                  Contexto Oficial — Sistema de Gestión Académica (SGA)
                </h2>
                <p className="mt-1 text-[#1E1B4B]/90">
                  Una institución de educación superior requiere un Sistema de Gestión Académica (SGA) que centralice la información de estudiantes, docentes, programas académicos, asignaturas, grupos, matrículas, calificaciones y horarios, garantizando una solución segura, mantenible, escalable y accesible desde navegadores web (39 requisitos oficiales: RF-01..RF-20 y RNF-01..RNF-19).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="/analisis-arquitectura-sga.pdf"
                  download="analisis-arquitectura-sga.pdf"
                  className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  Descargar Análisis PDF (8 Partes)
                </a>
                <a
                  href="/inventario-arquitectura-sga.md"
                  download="inventario-arquitectura-sga.md"
                  className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]"
                >
                  Descargar Inventario (.md)
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="border border-indigo-100 rounded-lg p-5 bg-white">
                <h3 className="text-base font-bold text-[#4338CA]">Segregación Estricta por Actor (RBAC)</h3>
                <ul className="mt-3 space-y-2.5 text-xs">
                  <li>
                    <strong>Administrador:</strong> Crear, editar y desactivar cuentas de <em>Usuario</em>, fichas de <em>Estudiante</em> y <em>Docente</em>; asignar <em>Rol</em>; bloquear/desbloquear cuentas; consultar <em>EventoAuditoría</em> filtrando por usuario, acción y fecha.
                  </li>
                  <li>
                    <strong>Coordinador académico:</strong> Crear y editar <em>Programa</em>, <em>PlanEstudio</em> y <em>Asignatura</em> (código, nombre, créditos, semestre); crear <em>PeriodoAcadémico</em> y cambiar su estado; crear <em>Grupo</em> (cupo, docente, horario, aula); generar reportes filtrados por periodo y programa en CSV y PDF.
                  </li>
                  <li>
                    <strong>Docente:</strong> Visualizar exclusivamente sus propios grupos asignados y listas de clase; editar notas en estado <em>borrador</em> y publicarlas; prohibición total de ver o editar grupos ajenos (403 auditado).
                  </li>
                  <li>
                    <strong>Estudiante:</strong> Inscribir matrícula validando periodo, duplicado, cupo, cruce horario y prerrequisitos; consultar su horario personal, notas publicadas y certificado académico; sin permisos de edición administrativa ni docente.
                  </li>
                </ul>
              </section>

              <section className="border border-indigo-100 rounded-lg p-5 bg-white">
                <h3 className="text-base font-bold text-[#4338CA]">Catálogo Unificado de Reglas de Negocio (RN-01..RN-12)</h3>
                <ul className="mt-3 space-y-2 text-xs">
                  <li><strong>RN-01 y RN-02 (Seguridad y Cuentas):</strong> Rol inmutable por sesión sin conmutador, rutas ajenas devuelven <em>Acceso denegado (403)</em> auditado, desactivación lógica (sin borrado físico) y bloqueo al 5.º intento fallido.</li>
                  <li><strong>RN-03 a RN-09 (Matrícula Académica):</strong> Exige periodo en <em>matrícula abierta</em> y ventana vigente, sin duplicados, cupo disponible bajo bloqueo transaccional, sin cruce horario, prerrequisitos aprobados y tope de 18 créditos.</li>
                  <li><strong>RN-10 a RN-12 (Calificaciones):</strong> Docente restringido a sus propios grupos, transición controlada <em>borrador &rarr; publicada</em> (única visible al estudiante) y escala 0.00–5.00 (aprobatoria 3.00).</li>
                  <li><strong>CU-18 (RF-11) y Ley 1581/2012:</strong> Todas las tablas incluyen búsqueda, filtros y paginación; autorización expresa de datos personales y contraste accesible WCAG 2.2 AA.</li>
                </ul>
              </section>
            </div>
          </div>
        )}

        {seccionActiva === 'arq' && (
          <div className="pt-6 space-y-6 text-sm leading-relaxed text-[#1E1B4B]">
            <section className="border border-indigo-100 rounded-lg p-5">
              <h2 className="text-lg font-bold text-[#1E1B4B]">
                Arquitectura en 4 Capas Cerradas con Inversión de Dependencias
              </h2>
              <p className="mt-2 text-xs">
                El sistema implementa un monolito modular desplegado en 2 réplicas API sin estado tras Nginx. Cada capa invoca únicamente a la inmediata inferior: <strong>1) Presentación</strong> (SPA React+TS / Nginx, WCAG 2.2 AA) &rarr; <strong>2) Aplicación/API</strong> (Spring Boot REST, DTOs, OpenAPI) &rarr; <strong>3) Dominio</strong> (Entidades, servicios de dominio y puertos de repositorio sin dependencias de framework) &larr; <strong>4) Repositorio/Persistencia</strong> (Adaptadores JPA, Flyway, PostgreSQL).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="p-4 rounded-lg bg-[#EEF2FF]/60 border border-indigo-100">
                  <h3 className="font-bold text-[#4338CA]">Descarte de Microservicios y EDA Puro</h3>
                  <p className="mt-1">
                    La validación simultánea de estado de periodo, cupo, cruce horario y prerrequisitos requiere atomicidad ACID inmediata sobre PostgreSQL; distribuirla en microservicios o colas asíncronas introduciría sobrecupos por consistencia eventual y complejidad operativa innecesaria.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#EEF2FF]/60 border border-indigo-100">
                  <h3 className="font-bold text-[#4338CA]">Descarte de Monolito sin Capas y SOA (ESB)</h3>
                  <p className="mt-1">
                    Un monolito sin capas impide aislar las reglas de negocio para alcanzar cobertura &ge; 70 % en dominio (RNF-15), mientras que un bus SOA añade latencia y acoplamiento centralizado frente a contratos REST OpenAPI ligeros.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {seccionActiva === 'uml' && (
          <div className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {DIAGRAMAS_PLANTUML.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDiagramaActivo(d.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA] ${
                    diagramaActivo === d.id
                      ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                      : 'bg-white text-[#1E1B4B] border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  ({d.letra}) {d.vistaKruchten}
                </button>
              ))}
            </div>

            <div className="border border-indigo-200 rounded-lg p-5 bg-[#EEF2FF]/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-[#6D28D9]">
                    {diagSeleccionado.vistaKruchten} · {diagSeleccionado.estadoCambio}
                  </span>
                  <h2 className="text-base font-bold text-[#1E1B4B] mt-0.5">
                    ({diagSeleccionado.letra}) {diagSeleccionado.titulo}
                  </h2>
                </div>
                <button
                  onClick={() => handleCopiar(diagSeleccionado.id, diagSeleccionado.codigo)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]"
                >
                  {copiadoId === diagSeleccionado.id ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      PlantUML copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      Copiar código PlantUML
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#1E1B4B]/90 mt-2 leading-relaxed">
                {diagSeleccionado.explicacion}
              </p>
              <pre className="mt-4 p-4 rounded-lg bg-[#1E1B4B] text-indigo-50 text-xs font-mono-tabular overflow-x-auto leading-relaxed max-h-[440px]">
                <code>{diagSeleccionado.codigo}</code>
              </pre>
            </div>
          </div>
        )}

        {seccionActiva === 'matriz' && (
          <div className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {['TODOS', 'Base RF', 'Complementario RF', 'Base RNF', 'Complementario RNF'].map(
                  (tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => {
                        setFiltroTipoMatriz(tipo);
                        setPaginaMatriz(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                        filtroTipoMatriz === tipo
                          ? 'bg-[#4338CA] text-white border-[#4338CA]'
                          : 'bg-white text-[#1E1B4B] border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      {tipo}
                    </button>
                  )
                )}
              </div>
              <div className="relative w-full md:w-72">
                <label htmlFor="buscar-trazabilidad" className="sr-only">
                  Buscar en matriz de trazabilidad
                </label>
                <Search
                  className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="buscar-trazabilidad"
                  type="search"
                  value={filtroMatriz}
                  onChange={(e) => {
                    setFiltroMatriz(e.target.value);
                    setPaginaMatriz(1);
                  }}
                  placeholder="Buscar por RF/RNF o módulo..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-indigo-200 rounded-lg text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-indigo-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EEF2FF] text-[#1E1B4B] border-b border-indigo-200">
                    <th className="py-3 px-3 font-bold whitespace-nowrap">Código</th>
                    <th className="py-3 px-3 font-bold">Especificación</th>
                    <th className="py-3 px-3 font-bold">Módulos / Componentes</th>
                    <th className="py-3 px-3 font-bold">Modelo / Decisión</th>
                    <th className="py-3 px-3 font-bold">Método de Verificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100 bg-white">
                  {paginacionMatriz.itemsPagina.map((fila) => (
                    <tr key={fila.codigo} className="hover:bg-indigo-50/40">
                      <td className="py-3 px-3 font-mono-tabular font-semibold text-[#4338CA] whitespace-nowrap align-top">
                        {fila.codigo}
                        <div className="text-[11px] font-sans font-normal text-slate-600 mt-0.5">
                          {fila.tipo}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#1E1B4B] align-top">{fila.especificacion}</td>
                      <td className="py-3 px-3 text-[#1E1B4B]/90 align-top">
                        {fila.modulosComponentes}
                      </td>
                      <td className="py-3 px-3 text-[#1E1B4B]/90 align-top">
                        {fila.modeloDecision}
                      </td>
                      <td className="py-3 px-3 text-[#1E1B4B]/90 align-top">
                        {fila.metodoVerificacion}
                      </td>
                    </tr>
                  ))}
                  {paginacionMatriz.totalItems === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-600">
                        Sin resultados para los criterios seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              paginaActual={paginacionMatriz.paginaSegura}
              totalPaginas={paginacionMatriz.totalPaginas}
              totalItems={paginacionMatriz.totalItems}
              tamanoPagina={8}
              onPageChange={setPaginaMatriz}
              etiquetaTabla="matriz de trazabilidad"
            />
          </div>
        )}

        {seccionActiva === 'riesgos' && (
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs leading-relaxed text-[#1E1B4B]">
            <div className="border border-indigo-200 rounded-lg p-4 bg-white">
              <h2 className="text-sm font-bold text-[#4338CA]">Puntos Únicos de Falla y Resiliencia</h2>
              <ul className="mt-2.5 space-y-2">
                <li>
                  <strong>Instancia primaria PostgreSQL:</strong> Mitigada con respaldos completos diarios cifrados, archivado continuo WAL y guion de restauración automatizada cumpliendo RPO &le; 24 h y RTO &le; 4 h (RNF-18).
                </li>
                <li>
                  <strong>Proxy inverso Nginx:</strong> Mitigado con sonda de salud automatizada, reinicio declarativo de contenedor y 2 réplicas independientes del API Spring Boot detrás del balanceador.
                </li>
              </ul>
            </div>

            <div className="border border-indigo-200 rounded-lg p-4 bg-white">
              <h2 className="text-sm font-bold text-[#4338CA]">Controles de Seguridad y Privacidad</h2>
              <ul className="mt-2.5 space-y-2">
                <li>
                  <strong>Prevención de IDOR y Acceso 403:</strong> Validación en Dominio de titularidad de grupo docente y propiedad de historial estudiantil; todo intento no autorizado devuelve HTTP 403 y graba registro en <em>EventoAuditoría</em>.
                </li>
                <li>
                  <strong>Credenciales y Ley 1581 de 2012:</strong> Hash Argon2id, bloqueo al 5.º intento fallido, JWT corto (15 min) y consentimiento expreso de tratamiento de datos personales.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
