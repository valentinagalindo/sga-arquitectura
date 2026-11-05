import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EstadoPeriodo,
  Grupo,
  PeriodoAcademico,
  RolNombre,
  calcularNotaDefinitiva,
  calcularPromedioAcumulado,
  existeCruceHorario,
  paginarLista,
  registrarIntentoLogin,
  tienePermisoRuta,
  validarRangoCalificacion,
  validarSolicitudMatricula,
} from './academicRules';

const periodoAbierto: PeriodoAcademico = {
  id: 'per-2026-2',
  codigo: '2026-2',
  nombre: 'Segundo Semestre 2026',
  estado: EstadoPeriodo.MatriculaAbierta,
  ventanaInicioISO: '2026-10-15T00:00:00Z',
  ventanaFinISO: '2026-11-30T23:59:59Z',
};

const grupoBase: Grupo = {
  id: 'grp-arq-01',
  codigoGrupo: 'IS304-01',
  asignatura: {
    id: 'asig-304',
    planId: 'plan-is-2024',
    codigo: 'IS-304',
    nombre: 'Arquitectura de Software',
    creditos: 4,
    semestre: 6,
    prerrequisitos: ['IS-201'],
  },
  docenteId: 'usr-doc-01',
  docenteNombre: 'Alejandro Mendoza',
  periodoCodigo: '2026-2',
  cupoMaximo: 25,
  cupoOcupado: 20,
  horarios: [
    { id: 'h1', dia: 'Martes', horaInicioMinutos: 420, horaFinMinutos: 540, aula: 'B-301' },
  ],
};

test('RF-02 y RBAC: verifica segregación estricta de rutas por rol (403 en rutas ajenas)', () => {
  assert.equal(tienePermisoRuta(RolNombre.Estudiante, 'est-matricula'), true);
  assert.equal(tienePermisoRuta(RolNombre.Estudiante, 'admin-usuarios'), false);
  assert.equal(tienePermisoRuta(RolNombre.Docente, 'docente-grupos'), true);
  assert.equal(tienePermisoRuta(RolNombre.Docente, 'coord-programas'), false);
  assert.equal(tienePermisoRuta(RolNombre.Administrador, 'admin-auditoria'), true);
});

test('RF-11: paginarLista calcula páginas seguras y subconjuntos exactos', () => {
  const datos = [1, 2, 3, 4, 5, 6, 7];
  const p1 = paginarLista(datos, 1, 3);
  assert.deepEqual(p1.itemsPagina, [1, 2, 3]);
  assert.equal(p1.totalPaginas, 3);

  const pFueraRango = paginarLista(datos, 99, 3);
  assert.equal(pFueraRango.paginaSegura, 3);
  assert.deepEqual(pFueraRango.itemsPagina, [7]);
});

test('RF-15: detecta cruce de horarios cuando los intervalos se solapan el mismo día', () => {
  const h1 = { id: '1', dia: 'Martes' as const, horaInicioMinutos: 420, horaFinMinutos: 540, aula: 'A1' };
  const h2 = { id: '2', dia: 'Martes' as const, horaInicioMinutos: 480, horaFinMinutos: 600, aula: 'A2' };
  const h3 = { id: '3', dia: 'Martes' as const, horaInicioMinutos: 540, horaFinMinutos: 660, aula: 'A3' };

  assert.equal(existeCruceHorario(h1, h2), true);
  assert.equal(existeCruceHorario(h1, h3), false);
});

test('RF-14 y RF-15: aprueba matrícula válida con prerrequisitos cumplidos, cupo y periodo abierto', () => {
  const res = validarSolicitudMatricula({
    periodo: periodoAbierto,
    ahoraISO: '2026-11-02T12:00:00Z',
    grupoCandidato: grupoBase,
    gruposYaMatriculados: [],
    codigosAprobados: ['IS-101', 'IS-201'],
    creditosMaximos: 18,
  });

  assert.equal(res.valida, true);
  assert.equal(res.errores.length, 0);
});

test('RF-15: rechaza matrícula por prerrequisito faltante y falta de cupo simultáneamente', () => {
  const grupoSinCupo: Grupo = { ...grupoBase, cupoOcupado: 25 };
  const res = validarSolicitudMatricula({
    periodo: periodoAbierto,
    ahoraISO: '2026-11-02T12:00:00Z',
    grupoCandidato: grupoSinCupo,
    gruposYaMatriculados: [],
    codigosAprobados: ['IS-101'],
    creditosMaximos: 18,
  });

  assert.equal(res.valida, false);
  assert.equal(res.errores.length, 2);
  assert.match(res.errores[0], /no cuenta con cupos/);
  assert.match(res.errores[1], /IS-201/);
});

test('RF-16 y RF-19: calcula nota definitiva ponderada y promedio acumulado por créditos', () => {
  assert.equal(calcularNotaDefinitiva(4.0, 4.5, 3.8), 4.07);
  assert.equal(validarRangoCalificacion(4.5), true);
  assert.equal(validarRangoCalificacion(5.2), false);

  const pga = calcularPromedioAcumulado([
    { codigoAsignatura: 'IS-101', nombreAsignatura: 'Algoritmos', creditos: 3, periodoCodigo: '2025-1', notaDefinitiva: 4.0, aprobada: true },
    { codigoAsignatura: 'IS-201', nombreAsignatura: 'Estructuras de Datos', creditos: 4, periodoCodigo: '2025-2', notaDefinitiva: 4.5, aprobada: true },
  ]);
  assert.equal(pga, 4.29);
});

test('RF-13 y RNF-13: bloquea cuenta al alcanzar 5 intentos fallidos consecutivos', () => {
  let estado = { intentosFallidos: 0, bloqueado: false };
  for (let i = 0; i < 4; i++) {
    estado = registrarIntentoLogin(estado, false, 5);
    assert.equal(estado.bloqueado, false);
  }
  estado = registrarIntentoLogin(estado, false, 5);
  assert.equal(estado.bloqueado, true);
});
