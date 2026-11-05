export enum RolNombre {
  Administrador = 'Administrador',
  CoordinadorAcademico = 'Coordinador académico',
  Docente = 'Docente',
  Estudiante = 'Estudiante',
}

export enum EstadoPeriodo {
  Planeado = 'planeado',
  MatriculaAbierta = 'matrícula abierta',
  EnCurso = 'en curso',
  Cerrado = 'cerrado',
}

export enum EstadoCalificacion {
  Borrador = 'borrador',
  Publicada = 'publicada',
}

export type RutaApp =
  | 'panel'
  | 'admin-usuarios'
  | 'admin-auditoria'
  | 'coord-programas'
  | 'coord-periodos-grupos'
  | 'coord-reportes'
  | 'docente-grupos'
  | 'est-matricula'
  | 'est-horario'
  | 'est-notas'
  | 'arquitectura';

export const PERMISOS_RUTA_POR_ROL: Record<RolNombre, RutaApp[]> = {
  [RolNombre.Administrador]: ['panel', 'admin-usuarios', 'admin-auditoria', 'arquitectura'],
  [RolNombre.CoordinadorAcademico]: [
    'panel',
    'coord-programas',
    'coord-periodos-grupos',
    'coord-reportes',
    'arquitectura',
  ],
  [RolNombre.Docente]: ['panel', 'docente-grupos', 'arquitectura'],
  [RolNombre.Estudiante]: ['panel', 'est-matricula', 'est-horario', 'est-notas', 'arquitectura'],
};

export function tienePermisoRuta(rol: RolNombre, ruta: RutaApp): boolean {
  return PERMISOS_RUTA_POR_ROL[rol].includes(ruta);
}

export interface UsuarioSistema {
  id: string;
  correo: string;
  nombreCompleto: string;
  documento: string;
  rol: RolNombre;
  activo: boolean;
  bloqueado: boolean;
  intentosFallidos: number;
  // Campos específicos si es Estudiante o Docente
  codigoInstitucional: string;
  programaId?: string;
  planId?: string;
  especialidad?: string;
}

export interface ProgramaAcademico {
  id: string;
  codigo: string;
  nombre: string;
  facultad: string;
  activo: boolean;
}

export interface PlanEstudioItem {
  id: string;
  programaId: string;
  version: string;
  creditosTotales: number;
  vigente: boolean;
}

export interface AsignaturaItem {
  id: string;
  planId: string;
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: number;
  prerrequisitos: string[]; // códigos de Asignatura
}

export interface Horario {
  id: string;
  dia: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  horaInicioMinutos: number;
  horaFinMinutos: number;
  aula: string;
}

export interface Grupo {
  id: string;
  codigoGrupo: string;
  asignatura: AsignaturaItem;
  docenteId: string;
  docenteNombre: string;
  periodoCodigo: string;
  cupoMaximo: number;
  cupoOcupado: number;
  horarios: Horario[];
}

export interface PeriodoAcademico {
  id: string;
  codigo: string;
  nombre: string;
  estado: EstadoPeriodo;
  ventanaInicioISO: string;
  ventanaFinISO: string;
}

export interface HistorialAsignatura {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditos: number;
  periodoCodigo: string;
  notaDefinitiva: number;
  aprobada: boolean;
}

export interface Matricula {
  id: string;
  estudianteId: string;
  estudianteCodigo: string;
  estudianteNombre: string;
  programaId: string;
  grupoId: string;
  periodoCodigo: string;
  fechaISO: string;
  estado: 'ACTIVA' | 'CANCELADA';
}

export interface CalificacionRegistro {
  id: string;
  matriculaId: string;
  grupoId: string;
  grupoCodigo: string;
  periodoCodigo: string;
  programaId: string;
  asignaturaCodigo: string;
  asignaturaNombre: string;
  creditos: number;
  estudianteId: string;
  estudianteCodigo: string;
  estudianteNombre: string;
  corte1: number;
  corte2: number;
  examenFinal: number;
  estado: EstadoCalificacion;
  actualizadoISO: string;
}

export interface EventoAuditoria {
  id: string;
  fechaISO: string;
  usuario: string;
  rol: RolNombre;
  modulo:
    | 'Seguridad'
    | 'Gestión Académica'
    | 'Periodos y Grupos'
    | 'Matrícula'
    | 'Calificaciones'
    | 'Reportes'
    | 'Auditoría'
    | 'Notificaciones';
  accion: string;
  registroAfectado: string;
  detalle: string;
}

export interface Notificacion {
  id: string;
  usuarioDestinoId: string;
  tipo: 'MATRICULA_CONFIRMADA' | 'NOTA_PUBLICADA' | 'SEGURIDAD';
  mensaje: string;
  fechaISO: string;
  leida: boolean;
}

export interface ResultadoValidacionMatricula {
  valida: boolean;
  errores: string[];
}

export function formatearMinutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function existeCruceHorario(a: Horario, b: Horario): boolean {
  if (a.dia !== b.dia) return false;
  return a.horaInicioMinutos < b.horaFinMinutos && b.horaInicioMinutos < a.horaFinMinutos;
}

export function validarSolicitudMatricula(params: {
  periodo: PeriodoAcademico;
  ahoraISO: string;
  grupoCandidato: Grupo;
  gruposYaMatriculados: Grupo[];
  codigosAprobados: string[];
  creditosMaximos: number;
}): ResultadoValidacionMatricula {
  const errores: string[] = [];
  const {
    periodo,
    ahoraISO,
    grupoCandidato,
    gruposYaMatriculados,
    codigosAprobados,
    creditosMaximos,
  } = params;

  if (periodo.estado !== EstadoPeriodo.MatriculaAbierta) {
    errores.push(
      `El periodo ${periodo.codigo} se encuentra en estado "${periodo.estado}". Solo se permite matricular cuando está en "matrícula abierta".`
    );
  } else {
    const ahora = new Date(ahoraISO).getTime();
    const inicio = new Date(periodo.ventanaInicioISO).getTime();
    const fin = new Date(periodo.ventanaFinISO).getTime();
    if (ahora < inicio || ahora > fin) {
      errores.push(
        `La solicitud se encuentra fuera de la ventana de matrícula (${periodo.ventanaInicioISO.slice(0, 10)} a ${periodo.ventanaFinISO.slice(0, 10)}).`
      );
    }
  }

  const duplicadaEnPeriodo = gruposYaMatriculados.some(
    (g) => g.asignatura.codigo === grupoCandidato.asignatura.codigo
  );
  if (duplicadaEnPeriodo) {
    errores.push(
      `Ya registra matrícula activa en la asignatura ${grupoCandidato.asignatura.codigo} (${grupoCandidato.asignatura.nombre}) durante este periodo.`
    );
  }

  if (codigosAprobados.includes(grupoCandidato.asignatura.codigo)) {
    errores.push(
      `La asignatura ${grupoCandidato.asignatura.codigo} ya consta como aprobada en el historial académico.`
    );
  }

  if (grupoCandidato.cupoOcupado >= grupoCandidato.cupoMaximo) {
    errores.push(
      `El grupo ${grupoCandidato.codigoGrupo} no cuenta con cupos disponibles (${grupoCandidato.cupoOcupado}/${grupoCandidato.cupoMaximo}).`
    );
  }

  const faltantes = grupoCandidato.asignatura.prerrequisitos.filter(
    (req) => !codigosAprobados.includes(req)
  );
  if (faltantes.length > 0) {
    errores.push(
      `Prerrequisitos pendientes para ${grupoCandidato.asignatura.codigo}: debe aprobar previamente ${faltantes.join(', ')}.`
    );
  }

  for (const inscrito of gruposYaMatriculados) {
    for (const hInscrito of inscrito.horarios) {
      for (const hCandidato of grupoCandidato.horarios) {
        if (existeCruceHorario(hInscrito, hCandidato)) {
          errores.push(
            `Cruce de horario el ${hCandidato.dia} (${formatearMinutosAHora(hCandidato.horaInicioMinutos)}–${formatearMinutosAHora(hCandidato.horaFinMinutos)}) con ${inscrito.asignatura.nombre} (${inscrito.codigoGrupo}).`
          );
        }
      }
    }
  }

  const creditosActuales = gruposYaMatriculados.reduce((acc, g) => acc + g.asignatura.creditos, 0);
  if (creditosActuales + grupoCandidato.asignatura.creditos > creditosMaximos) {
    errores.push(
      `Supera el tope semestral de ${creditosMaximos} créditos (${creditosActuales} actuales + ${grupoCandidato.asignatura.creditos} solicitados).`
    );
  }

  return {
    valida: errores.length === 0,
    errores,
  };
}

export function calcularNotaDefinitiva(corte1: number, corte2: number, examenFinal: number): number {
  const ponderada = corte1 * 0.3 + corte2 * 0.3 + examenFinal * 0.4;
  return Math.round(ponderada * 100) / 100;
}

export function validarRangoCalificacion(valor: number): boolean {
  return Number.isFinite(valor) && valor >= 0.0 && valor <= 5.0;
}

export function calcularPromedioAcumulado(historial: HistorialAsignatura[]): number {
  if (historial.length === 0) return 0;
  const totalCreditos = historial.reduce((acc, item) => acc + item.creditos, 0);
  if (totalCreditos === 0) return 0;
  const sumaPonderada = historial.reduce(
    (acc, item) => acc + item.notaDefinitiva * item.creditos,
    0
  );
  return Math.round((sumaPonderada / totalCreditos) * 100) / 100;
}

export interface EstadoCuentaSeguridad {
  intentosFallidos: number;
  bloqueado: boolean;
}

export function registrarIntentoLogin(
  estadoActual: EstadoCuentaSeguridad,
  credencialesCorrectas: boolean,
  maxIntentos = 5
): EstadoCuentaSeguridad {
  if (estadoActual.bloqueado) {
    return { ...estadoActual, bloqueado: true };
  }
  if (credencialesCorrectas) {
    return { intentosFallidos: 0, bloqueado: false };
  }
  const nuevosIntentos = estadoActual.intentosFallidos + 1;
  return {
    intentosFallidos: nuevosIntentos,
    bloqueado: nuevosIntentos >= maxIntentos,
  };
}

export function paginarLista<T>(items: T[], paginaActual: number, tamanoPagina: number): {
  itemsPagina: T[];
  totalPaginas: number;
  paginaSegura: number;
  totalItems: number;
} {
  const totalItems = items.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItems / tamanoPagina));
  const paginaSegura = Math.min(Math.max(1, paginaActual), totalPaginas);
  const inicio = (paginaSegura - 1) * tamanoPagina;
  return {
    itemsPagina: items.slice(inicio, inicio + tamanoPagina),
    totalPaginas,
    paginaSegura,
    totalItems,
  };
}
