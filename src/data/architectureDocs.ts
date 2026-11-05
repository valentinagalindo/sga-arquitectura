export interface DiagramaPlantUML {
  id: string;
  letra: string;
  titulo: string;
  vistaKruchten: string;
  estadoCambio: string;
  explicacion: string;
  codigo: string;
}

export const DIAGRAMAS_PLANTUML: DiagramaPlantUML[] = [
  {
    id: 'casos-uso',
    letra: 'a',
    titulo: 'Diagrama de Casos de Uso Corregido — Sistema Académico SIGA',
    vistaKruchten: 'Vista de Escenarios (+1)',
    estadoCambio: 'MODIFICADO en esta revisión',
    explicacion:
      'Actualizado para incorporar explícitamente: (1) gestión integral de usuarios, estudiantes y docentes por el Administrador (crear, editar, desactivar, asignar rol, bloquear/desbloquear), (2) búsqueda, filtrado y paginación transversal en listados (RF-11), (3) generación de reportes académicos con filtros por PeriodoAcadémico y Programa por el Coordinador académico, y (4) aislamiento estricto de grupos propios para el Docente.',
    codigo: `@startuml
title (a) Diagrama de Casos de Uso Corregido — Sistema Académico SIGA (Vista +1)
left to right direction
skinparam shadowing false
skinparam packageStyle rectangle

actor "Administrador" as Admin
actor "Coordinador académico" as Coord
actor "Docente" as Doc
actor "Estudiante" as Est

rectangle "Sistema de Gestión Académica (SGA)" {
  package "Seguridad" {
    usecase "CU-01 Autenticar sesión y autorizar Ley 1581/2012" as CU01
    usecase "CU-02 Recuperar o cambiar contraseña personal" as CU02
    usecase "CU-03 Crear, consultar, actualizar y desactivar Usuarios y asignar Rol" as CU03
    usecase "CU-05 Bloquear y desbloquear cuentas de Usuario" as CU05
  }

  package "Gestión Académica" {
    usecase "CU-04 Registrar, consultar, actualizar y desactivar Estudiantes y Docentes" as CU04
    usecase "CU-06 Crear y actualizar Programas y Planes de Estudio" as CU06
    usecase "CU-07 Crear y actualizar Asignaturas y Prerrequisitos" as CU07
  }

  package "Periodos y Grupos" {
    usecase "CU-08 Configurar PeriodoAcadémico, ventana y cambiar estado" as CU08
    usecase "CU-09 Configurar Grupos (cupo, Docente, Horario, aula/enlace)" as CU09
  }

  package "Matrícula" {
    usecase "CU-10 Matricular o cancelar Asignaturas/Grupos validando RN-03..RN-09" as CU10
    usecase "CU-11 Consultar Horario personal y asignaturas matriculadas" as CU11
  }

  package "Calificaciones" {
    usecase "CU-12 Consultar Grupos propios y listas de clase (RN-10)" as CU12
    usecase "CU-13 Editar Calificación en borrador y publicar (RN-11, RN-12)" as CU13
    usecase "CU-14 Consultar únicamente Calificaciones publicadas" as CU14
  }

  package "Reportes" {
    usecase "CU-15 Visualizar Panel de inicio según el Rol" as CU15
    usecase "CU-16 Generar y exportar Reportes por Periodo y Programa (PDF/CSV)" as CU16
    usecase "CU-17 Consultar Historial académico y emitir Certificado de notas" as CU17
    usecase "CU-18 Buscar, filtrar y paginar tablas de consulta (RF-11)" as CU18
  }

  package "Auditoría" {
    usecase "CU-19 Consultar EventoAuditoría por usuario, acción y fecha" as CU19
  }

  package "Notificaciones" {
    usecase "CU-20 Consultar bandeja de Notificaciones académicas" as CU20
  }
}

Admin --> CU01
Admin --> CU02
Admin --> CU03
Admin --> CU04
Admin --> CU05
Admin --> CU15
Admin --> CU19
Admin --> CU20

Coord --> CU01
Coord --> CU02
Coord --> CU06
Coord --> CU07
Coord --> CU08
Coord --> CU09
Coord --> CU15
Coord --> CU16
Coord --> CU20

Doc --> CU01
Doc --> CU02
Doc --> CU12
Doc --> CU13
Doc --> CU15
Doc --> CU20

Est --> CU01
Est --> CU02
Est --> CU10
Est --> CU11
Est --> CU14
Est --> CU15
Est --> CU17
Est --> CU20

CU03 ..> CU18 : <<include>>
CU04 ..> CU18 : <<include>>
CU06 ..> CU18 : <<include>>
CU09 ..> CU18 : <<include>>
CU12 ..> CU18 : <<include>>
CU16 ..> CU18 : <<include>>
CU19 ..> CU18 : <<include>>

legend right
  |= Regla de Acceso |= Comportamiento |
  | Segregación RBAC | El rol proviene únicamente de la sesión autenticada; rutas ajenas retornan HTTP 403 y auditan intento |
  | Propiedad Docente | CU-12 y CU-13 restringen acceso exclusivamente a Grupos donde Grupo.docenteId == Docente autenticado |
  | RF-11 Transversal | Todas las consultas tabulares incluyen búsqueda textual, filtros de dominio y paginación |
endlegend
@enduml`,
  },
  {
    id: 'componentes-capas',
    letra: 'b',
    titulo: 'Diagrama de Componentes por Capas Cerradas — SIGA',
    vistaKruchten: 'Vista de Desarrollo / Implementación',
    estadoCambio: 'ACTUALIZADO (detalle de filtros RF-11 y guarda RBAC 403 auditada)',
    explicacion:
      'Mantiene las 4 capas cerradas estrictas e inversión de dependencias, precisando en el bloque transversal de Seguridad el manejador AccessDeniedHandler que registra en Auditoría todo intento de acceso no autorizado (HTTP 403) y el soporte de criterios paginados en los puertos de repositorio.',
    codigo: `@startuml
title (b) Diagrama de Componentes por Capas Cerradas — SIGA (Vista de Desarrollo)
top to bottom direction
skinparam componentStyle uml2
skinparam shadowing false

package "1. Capa de Presentación (SPA React + TypeScript servida por Nginx)" {
  [SPA Cliente Web\n(WCAG 2.2 AA, Rutas por Rol, Búsqueda y Paginación)] as SPA
}

package "2. Capa de Aplicación / API (Spring Boot: Controladores REST, DTOs, Servicios App)" {
  interface "API REST OpenAPI 3.1 (HTTPS/JSON)" as IApiRest
  [App: Seguridad] as AppSeg
  [App: Gestión Académica] as AppGA
  [App: Periodos y Grupos] as AppPG
  [App: Matrícula] as AppMat
  [App: Calificaciones] as AppCal
  [App: Reportes] as AppRep
  [App: Auditoría] as AppAud
  [App: Notificaciones] as AppNot
  IApiRest - [AppMat]
}

package "3. Capa de Dominio (Java Puro — Sin dependencias de Framework)" {
  [Dominio: Seguridad] as DomSeg
  [Dominio: Gestión Académica] as DomGA
  [Dominio: Periodos y Grupos] as DomPG
  [Dominio: Matrícula] as DomMat
  [Dominio: Calificaciones] as DomCal
  [Dominio: Reportes] as DomRep
  [Dominio: Auditoría] as DomAud
  [Dominio: Notificaciones] as DomNot

  interface "Puertos IRepositorio* (Criterios + Paginación)" as IPuertoRepo
  interface "Puerto IDespachadorNotificacion" as IPuertoSmtp
}

package "4. Capa de Repositorio / Persistencia (JPA, Flyway, PostgreSQL)" {
  [Adaptadores JPA + Specifications Paginadas] as AdaptadorJpa
  [Migraciones Esquema Flyway] as FlywayMig
  [Adaptador Cliente SMTP] as AdaptadorSmtp
  database "PostgreSQL 16" as DB
}

package "Bloque Transversal (Cross-Cutting)" {
  [Seguridad: Spring Security + JWT corto + Argon2id\n+ AccessDeniedHandler (403 -> Auditoría)] as TransSeg
  [Auditoría Transversal (Usuario, Fecha, Acción, Registro)] as TransAud
  [Observabilidad (Logs JSON, Health Checks, Métricas)] as TransObs
}

SPA ..> IApiRest : HTTPS / TLS 1.3 (Bearer JWT)

AppSeg --> DomSeg
AppGA --> DomGA
AppPG --> DomPG
AppMat --> DomMat
AppCal --> DomCal
AppRep --> DomRep
AppAud --> DomAud
AppNot --> DomNot

DomSeg --> IPuertoRepo
DomGA --> IPuertoRepo
DomPG --> IPuertoRepo
DomMat --> IPuertoRepo
DomCal --> IPuertoRepo
DomRep --> IPuertoRepo
DomAud --> IPuertoRepo
DomNot --> IPuertoRepo
DomNot --> IPuertoSmtp

AdaptadorJpa .up.|> IPuertoRepo : <<implementa (DIP)>>
AdaptadorSmtp .up.|> IPuertoSmtp : <<implementa (DIP)>>
AdaptadorJpa --> DB : Consultas parametrizadas JDBC
FlywayMig --> DB : Versionado DDL

TransSeg ..> AppSeg : Autenticación y RBAC estricto
TransSeg ..> TransAud : Registra intento 403 denegado
TransAud ..> DomAud : Persiste EventoAuditoría
TransObs ..> AppMat : Trazas y métricas

legend right
  |= Regla Arquitectónica |= Verificación |
  | Capas Cerradas | Presentación -> Aplicación -> Dominio <- Persistencia |
  | Denegación Auditada | Todo fallo de autorización RBAC o propiedad de Grupo devuelve 403 y graba EventoAuditoría |
endlegend
@enduml`,
  },
  {
    id: 'despliegue',
    letra: 'c',
    titulo: 'Diagrama de Despliegue — SIGA',
    vistaKruchten: 'Vista Física / Despliegue',
    estadoCambio: 'SIN CAMBIOS ESTRUCTURALES',
    explicacion:
      'Conserva la topología física exigida: navegador cliente con controles HTTPS/TLS, proxy inverso Nginx sirviendo la SPA y balanceando hacia 2 réplicas stateless del API Spring Boot, motor PostgreSQL, almacenamiento externo cifrado de respaldos (RPO <= 24 h, RTO <= 4 h) y pasarela SMTP.',
    codigo: `@startuml
title (c) Diagrama de Despliegue — SIGA (Vista Física)
left to right direction
skinparam shadowing false

node "Equipo Usuario Final" as Cliente {
  artifact "Navegador Web\n(HTTPS, CSP, WCAG 2.2 AA)" as Browser
}

node "Nodo Perimetral DMZ [Contenedor Docker]" as NodoNginx {
  component "Proxy Inverso Nginx\n- Terminación TLS 1.3 / HSTS\n- Balanceo hacia 2 réplicas API\n- Rate Limiting Login" as Nginx
  artifact "Estáticos SPA\n(React + TypeScript)" as SpaBuild
  Nginx -- SpaBuild
}

package "Subred Privada de Aplicación" {
  node "Contenedor API Réplica 1 [Docker]" as NodoApi1 {
    component "Spring Boot API #1\n(Stateless JWT + Actuator Health)" as Api1
  }
  node "Contenedor API Réplica 2 [Docker]" as NodoApi2 {
    component "Spring Boot API #2\n(Stateless JWT + Actuator Health)" as Api2
  }
}

package "Subred Privada de Datos y Servicios" {
  node "Servidor Base de Datos [Contenedor/Host]" as NodoBD {
    database "PostgreSQL 16\n(Datos + Flyway + WAL)" as PG
  }

  node "Almacenamiento Seguro de Respaldos" as NodoBackup {
    artifact "Respaldos Cifrados AES-256\nDump diario + WAL Archiving\n(RPO <= 24 h | RTO <= 4 h)" as Backups
  }

  node "Servidor de Correo Saliente" as NodoSmtp {
    component "Relay Institucional SMTP" as Smtp
  }
}

Browser ==> Nginx : HTTPS (TLS 1.3, TCP 443)
Nginx ==> Api1 : HTTP/TLS Interno (TCP 8080)
Nginx ==> Api2 : HTTP/TLS Interno (TCP 8080)
Api1 ==> PG : JDBC sobre TLS (TCP 5432)
Api2 ==> PG : JDBC sobre TLS (TCP 5432)
PG ..> Backups : Copia diaria + WAL continuo
Api1 ..> Smtp : SMTP + STARTTLS (TCP 587)
Api2 ..> Smtp : SMTP + STARTTLS (TCP 587)

legend bottom
  |= Control |= Especificación |
  | Alta Disponibilidad API | 2 réplicas stateless balanceadas por Nginx |
  | Recuperación (RNF-18) | RPO <= 24 h y RTO <= 4 h verificables mediante simulacro de restauración |
endlegend
@enduml`,
  },
  {
    id: 'datos-conceptual',
    letra: 'd',
    titulo: 'Modelo Conceptual de Datos con las 15 Entidades Obligatorias',
    vistaKruchten: 'Vista Lógica',
    estadoCambio: 'ACTUALIZADO (atributos explícitos en EventoAuditoría y Asignatura)',
    explicacion:
      'Mantiene exactamente las 15 entidades obligatorias y sus cardinalidades, detallando explícitamente semestre y créditos en Asignatura, estado activo en Usuario, y registroAfectado en EventoAuditoría para soportar los filtros de auditoría por usuario, acción y fecha.',
    codigo: `@startuml
title (d) Modelo Conceptual de Datos — SIGA (Vista Lógica)
hide circle
hide methods
skinparam linetype ortho
skinparam shadowing false

entity "Usuario" as Usuario {
  * id : UUID <<PK>>
  --
  * correo : VARCHAR(150) <<UK>>
  * hashArgon2id : VARCHAR(255)
  * activo : BOOLEAN
  * bloqueado : BOOLEAN
  * intentosFallidos : SMALLINT
  * fechaConsentimientoLey1581 : TIMESTAMP
}

entity "Rol" as Rol {
  * id : UUID <<PK>>
  --
  * nombre : VARCHAR(40) <<UK>>
}

entity "Estudiante" as Estudiante {
  * id : UUID <<PK>>
  --
  * usuarioId : UUID <<FK, UK>>
  * planEstudioId : UUID <<FK>>
  * codigoEstudiantil : VARCHAR(30) <<UK>>
  * documento : VARCHAR(30) <<UK>>
  * nombreCompleto : VARCHAR(160)
}

entity "Docente" as Docente {
  * id : UUID <<PK>>
  --
  * usuarioId : UUID <<FK, UK>>
  * codigoDocente : VARCHAR(30) <<UK>>
  * documento : VARCHAR(30) <<UK>>
  * especialidad : VARCHAR(120)
  * nombreCompleto : VARCHAR(160)
}

entity "Programa" as Programa {
  * id : UUID <<PK>>
  --
  * codigo : VARCHAR(20) <<UK>>
  * nombre : VARCHAR(150)
  * facultad : VARCHAR(120)
  * activo : BOOLEAN
}

entity "PlanEstudio" as PlanEstudio {
  * id : UUID <<PK>>
  --
  * programaId : UUID <<FK>>
  * version : VARCHAR(30)
  * creditosTotales : SMALLINT
  * vigente : BOOLEAN
}

entity "Asignatura" as Asignatura {
  * id : UUID <<PK>>
  --
  * codigo : VARCHAR(20) <<UK>>
  * nombre : VARCHAR(150)
  * creditos : SMALLINT
  * semestre : SMALLINT
}

entity "Prerrequisito" as Prerrequisito {
  * id : UUID <<PK>>
  --
  * planEstudioId : UUID <<FK>>
  * asignaturaId : UUID <<FK>>
  * asignaturaRequeridaId : UUID <<FK>>
}

entity "PeriodoAcadémico" as PeriodoAcademico {
  * id : UUID <<PK>>
  --
  * codigo : VARCHAR(15) <<UK>>
  * estado : ENUM(planeado, matricula_abierta, en_curso, cerrado)
  * ventanaInicio : TIMESTAMP
  * ventanaFin : TIMESTAMP
}

entity "Grupo" as Grupo {
  * id : UUID <<PK>>
  --
  * asignaturaId : UUID <<FK>>
  * periodoId : UUID <<FK>>
  * docenteId : UUID <<FK>>
  * codigoGrupo : VARCHAR(20)
  * cupoMaximo : SMALLINT
  * cupoOcupado : SMALLINT
}

entity "Horario" as Horario {
  * id : UUID <<PK>>
  --
  * grupoId : UUID <<FK>>
  * diaSemana : VARCHAR(15)
  * horaInicio : TIME
  * horaFin : TIME
  * aula : VARCHAR(60)
}

entity "Matrícula" as Matricula {
  * id : UUID <<PK>>
  --
  * estudianteId : UUID <<FK>>
  * grupoId : UUID <<FK>>
  * periodoId : UUID <<FK>>
  * estado : VARCHAR(20)
  * fechaRegistro : TIMESTAMP
}

entity "Calificación" as Calificacion {
  * id : UUID <<PK>>
  --
  * matriculaId : UUID <<FK>>
  * corteEvaluativo : VARCHAR(30)
  * valorNumerico : DECIMAL(3,2)
  * estado : ENUM(borrador, publicada)
  * fechaActualizacion : TIMESTAMP
}

entity "EventoAuditoría" as EventoAuditoria {
  * id : UUID <<PK>>
  --
  * usuarioId : UUID <<FK>>
  * fechaHora : TIMESTAMP
  * modulo : VARCHAR(50)
  * accion : VARCHAR(80)
  * registroAfectado : VARCHAR(120)
  * detalle : TEXT
}

entity "Notificación" as Notificacion {
  * id : UUID <<PK>>
  --
  * usuarioDestinoId : UUID <<FK>>
  * tipo : VARCHAR(40)
  * mensaje : VARCHAR(500)
  * enviadaCorreo : BOOLEAN
  * leida : BOOLEAN
}

Usuario "1..*" -- "1..*" Rol : posee >
Usuario "1" -- "0..1" Estudiante : asocia >
Usuario "1" -- "0..1" Docente : asocia >
Programa "1" -- "1..*" PlanEstudio : estructura >
Estudiante "0..*" -- "1" PlanEstudio : cursa >
PlanEstudio "1..*" -- "1..*" Asignatura : contiene >
PlanEstudio "1" -- "0..*" Prerrequisito : contextualiza >
Asignatura "1" -- "0..*" Prerrequisito : exige >
Asignatura "1" -- "0..*" Prerrequisito : es exigida en >
PeriodoAcademico "1" -- "0..*" Grupo : oferta >
Asignatura "1" -- "0..*" Grupo : instancia >
Docente "1" -- "0..*" Grupo : titular de >
Grupo "1" -- "1..*" Horario : sesiona en >
Estudiante "1" -- "0..*" Matricula : realiza >
Grupo "1" -- "0..*" Matricula : vincula >
PeriodoAcademico "1" -- "0..*" Matricula : enmarca >
Matricula "1" -- "0..*" Calificacion : registra >
Usuario "1" -- "0..*" EventoAuditoria : ejecuta >
Usuario "1" -- "0..*" Notificacion : recibe >

legend right
  |= Integridad Conceptual |= Detalle |
  | 15 Entidades Exactas | Nombres idénticos a la especificación obligatoria |
  | Índices de Filtrado (RF-11) | Índices en EventoAuditoría(usuarioId, accion, fechaHora) y Grupo(periodoId, asignaturaId) |
endlegend
@enduml`,
  },
  {
    id: 'secuencias',
    letra: 'e',
    titulo: 'Diagramas de Secuencia: (e.1) Matrícula y (e.2) Registro de Calificación con Validación de Titularidad',
    vistaKruchten: 'Vista de Procesos',
    estadoCambio: 'ACTUALIZADO (verificación explícita de propiedad de Grupo 403 en Docente)',
    explicacion:
      'En (e.1) se ejecutan en orden las validaciones de periodo abierto, duplicado, cupo con bloqueo FOR UPDATE, cruce de horario, prerrequisitos, transacción ACID, auditoría y notificación. En (e.2) se refuerza la validación de que el Docente autenticado sea titular del Grupo; de lo contrario, se rechaza con HTTP 403 Forbidden y se escribe el intento en EventoAuditoría.',
    codigo: `@startuml
title (e.1) Secuencia de Matrícula y (e.2) Registro de Calificación con Control 403 (Vista de Procesos)
autonumber
skinparam shadowing false

actor "Estudiante" as Est
actor "Docente" as Doc
participant "SPA React\n[Presentación]" as SPA
participant "Servicio Aplicación\n[Matrícula / Calificaciones]" as App
participant "Servicio Dominio\n[Matrícula / Calificaciones]" as Dom
participant "Adaptador JPA\n[Persistencia]" as Repo
database "PostgreSQL" as PG
participant "Módulo\nAuditoría" as Aud
participant "Módulo\nNotificaciones" as Notif

== (e.1) Secuencia Transaccional de Matrícula ==
Est -> SPA : Solicita inscribir Grupo (grupoId, periodoId)
SPA -> App : POST /api/v1/matriculas (Bearer JWT)
activate App
App -> Dom : inscribir(estudianteId, grupoId, periodoId)
activate Dom
Dom -> Repo : buscarPeriodo(periodoId)
Repo -> PG : SELECT ... FROM periodo_academico
Dom -> Dom : 1) Validar estado == "matrícula abierta" y ventana vigente
Dom -> Repo : existeMatriculaOAprobacionPrevia(estudianteId, asignaturaId, periodoId)
Repo -> PG : SELECT ... FROM matricula / calificacion
Dom -> Dom : 2) Validar ausencia de duplicado
Dom -> Repo : bloquearGrupo(grupoId)
Repo -> PG : SELECT ... FROM grupo WHERE id = ? FOR UPDATE
Dom -> Dom : 3) Validar cupoOcupado < cupoMaximo
Dom -> Repo : obtenerHorariosActivos(estudianteId, periodoId)
Repo -> PG : SELECT ... FROM horario JOIN matricula
Dom -> Dom : 4) Validar ausencia de cruce de Horario
Dom -> Repo : verificarPrerrequisitos(estudianteId, planId, asignaturaId)
Repo -> PG : SELECT ... FROM prerrequisito / calificacion
Dom -> Dom : 5) Validar Prerrequisitos aprobados
Dom -> Repo : guardarMatriculaEIncrementarCupo(Matrícula, Grupo)
Repo -> PG : INSERT INTO matricula; UPDATE grupo SET cupo_ocupado = cupo_ocupado + 1
Dom --> App : Matrícula confirmada
deactivate Dom
App -> Aud : registrar(usuario, fecha, MATRICULA_CONFIRMADA, Matrícula:id)
Aud -> PG : INSERT INTO evento_auditoria
App -> Notif : persistirNotificacion(Estudiante, MATRICULA_CONFIRMADA)
Notif -> PG : INSERT INTO notificacion
App -> App : Commit transacción ACID
App -> Notif : enviarCorreoPostCommit(Notificación)
App --> SPA : 201 Created
deactivate App
SPA --> Est : Muestra comprobante y actualiza Horario

== (e.2) Secuencia de Registro/Publicación de Calificación por Docente ==
Doc -> SPA : Edita nota en borrador o pulsa Publicar
SPA -> App : PUT /api/v1/calificaciones/{id} (valor, estado)
activate App
App -> Dom : actualizarCalificacion(docenteAutenticadoId, calificacionId, valor, estado)
activate Dom
Dom -> Repo : cargarCalificacionYGrupo(calificacionId)
Repo -> PG : SELECT ... FROM calificacion JOIN matricula JOIN grupo
alt Grupo.docenteId != docenteAutenticadoId
  Dom --> App : ExcepcionAccesoDenegadoDominio (403)
  App -> Aud : registrar(usuario, fecha, ACCESO_DENEGADO_403, Grupo:id)
  Aud -> PG : INSERT INTO evento_auditoria
  App --> SPA : 403 Forbidden ("Acceso denegado (403)")
else Docente es titular del Grupo
  Dom -> Dom : Validar rango [0.00..5.00] y estado permitido
  Dom -> Repo : guardarCalificacion(valor, estado)
  Repo -> PG : UPDATE calificacion SET valor_numerico=?, estado=?
  App -> Aud : registrar(usuario, fecha, CALIFICACION_BORRADOR | CALIFICACION_PUBLICADA, Calificación:id)
  Aud -> PG : INSERT INTO evento_auditoria
  opt estado == "publicada"
    App -> Notif : persistirYDespachar(Estudiante, NOTA_PUBLICADA)
    Notif -> PG : INSERT INTO notificacion
  end
  App -> App : Commit transacción ACID
  App --> SPA : 200 OK
end
deactivate Dom
deactivate App
SPA --> Doc : Confirma operación en pantalla

legend right
  |= Control |= Evidencia en Auditoría |
  | Segregación Docente | Un intento sobre un Grupo ajeno aborta cambio, responde 403 y escribe ACCESO_DENEGADO_403 |
endlegend
@enduml`,
  },
];

export interface FilaTrazabilidad {
  codigo: string;
  tipo: 'Base RF' | 'Complementario RF' | 'Base RNF' | 'Complementario RNF';
  especificacion: string;
  modulosComponentes: string;
  modeloDecision: string;
  metodoVerificacion: string;
}

export const MATRIZ_TRAZABILIDAD: FilaTrazabilidad[] = [
  {
    codigo: 'RF-01',
    tipo: 'Base RF',
    especificacion: 'Autenticación: los usuarios inician y cierran sesión con credenciales individuales.',
    modulosComponentes: 'Seguridad (SPA Login, AuthController, AuthService, Spring Security)',
    modeloDecision: 'Usuario, EventoAuditoría | ADR-03: JWT corto (15 min) + hash Argon2id',
    metodoVerificacion: 'Pruebas de integración sobre /api/v1/auth/login y /logout verificando emisión JWT, rechazo 401 y registro en EventoAuditoría',
  },
  {
    codigo: 'RF-02',
    tipo: 'Base RF',
    especificacion: 'Roles y permisos: mínimo administrador, coordinador académico, docente y estudiante; restringir funciones según permisos.',
    modulosComponentes: 'Seguridad, Auditoría (Capas 1–4 + Bloque Transversal)',
    modeloDecision: 'Usuario, Rol, EventoAuditoría | RN-01: Guardas de ruta por rol + AccessDeniedHandler (HTTP 403 auditado)',
    metodoVerificacion: 'Matriz automatizada RBAC probando los 4 actores contra rutas no autorizadas, confirmando HTTP 403 y traza en Auditoría',
  },
  {
    codigo: 'RF-03',
    tipo: 'Base RF',
    especificacion: 'Gestión de estudiantes: registrar, consultar, actualizar y desactivar.',
    modulosComponentes: 'Gestión Académica, Seguridad (Capas 1–4)',
    modeloDecision: 'Estudiante, Usuario, PlanEstudio | RN-02: Desactivación lógica (activo = false) sin borrado físico',
    metodoVerificacion: 'Pruebas CRUD verificando alta, consulta paginada, actualización y desactivación lógica de fichas de Estudiante',
  },
  {
    codigo: 'RF-04',
    tipo: 'Base RF',
    especificacion: 'Gestión de docentes: registrar, consultar, actualizar y desactivar.',
    modulosComponentes: 'Gestión Académica, Seguridad (Capas 1–4)',
    modeloDecision: 'Docente, Usuario | RN-02: Unicidad de documento/código docente y desactivación lógica',
    metodoVerificacion: 'Pruebas CRUD verificando registro, consulta paginada, actualización y desactivación lógica de Docente',
  },
  {
    codigo: 'RF-05',
    tipo: 'Base RF',
    especificacion: 'Programas y asignaturas: crear y actualizar programas, planes de estudio y asignaturas (código, nombre, créditos, semestre o nivel).',
    modulosComponentes: 'Gestión Académica (Capas 1–4)',
    modeloDecision: 'Programa, PlanEstudio, Asignatura, Prerrequisito | ADR-01 Capas cerradas',
    metodoVerificacion: 'Pruebas de integración validando creación y actualización de programas, planes y asignaturas con créditos y semestre válidos',
  },
  {
    codigo: 'RF-06',
    tipo: 'Base RF',
    especificacion: 'Grupos y periodos: configurar periodos, grupos, cupos, docentes asignados, horarios y aulas o enlaces de encuentro.',
    modulosComponentes: 'Periodos y Grupos (Capas 1–4)',
    modeloDecision: 'PeriodoAcadémico, Grupo, Horario, Docente | RN-03, RN-06: Cupo > 0, titularidad docente e intervalos coherentes',
    metodoVerificacion: 'Pruebas de dominio e integración verificando apertura de periodos y grupos con docente, horario y aula/enlace',
  },
  {
    codigo: 'RF-07',
    tipo: 'Base RF',
    especificacion: 'Matrícula académica: matricular estudiantes en asignaturas o grupos de un periodo, validar cupos y evitar duplicados.',
    modulosComponentes: 'Matrícula, Periodos y Grupos, Auditoría (Capas 1–4)',
    modeloDecision: 'Matrícula, Grupo, EventoAuditoría | RN-05, RN-06, ADR-02: Transacción ACID + bloqueo SELECT FOR UPDATE',
    metodoVerificacion: 'Prueba de concurrencia con hilos simultáneos sobre el último cupo disponible verificando cero sobrecupos y cero duplicados',
  },
  {
    codigo: 'RF-08',
    tipo: 'Base RF',
    especificacion: 'Registro de calificaciones: el docente registra y actualiza calificaciones de los estudiantes matriculados en sus grupos.',
    modulosComponentes: 'Calificaciones, Auditoría (Capas 1–4)',
    modeloDecision: 'Calificación, Matrícula, Grupo, Docente | RN-10, RN-12: Verificación de propiedad Grupo.docenteId en Dominio',
    metodoVerificacion: 'Prueba de seguridad funcional: Docente A intentando leer/editar Grupo de Docente B recibe 403 y genera EventoAuditoría',
  },
  {
    codigo: 'RF-09',
    tipo: 'Base RF',
    especificacion: 'Consulta de resultados: el estudiante consulta asignaturas matriculadas, horarios y calificaciones publicadas.',
    modulosComponentes: 'Matrícula, Calificaciones, Reportes (Capas 1–4)',
    modeloDecision: 'Matrícula, Horario, Calificación | RN-11: Exposición exclusiva de calificaciones con estado == publicada',
    metodoVerificacion: 'Prueba E2E verificando visualización de horario e invisibilidad de calificaciones en borrador para el Estudiante',
  },
  {
    codigo: 'RF-10',
    tipo: 'Base RF',
    especificacion: 'Reportes: reportes básicos de matriculados, grupos, asignaturas y resultados, con filtros por periodo y programa.',
    modulosComponentes: 'Reportes (Capas 1–4)',
    modeloDecision: 'Proyecciones de lectura sobre PeriodoAcadémico, Programa, Grupo, Matrícula y Calificación',
    metodoVerificacion: 'Pruebas de integración comprobando exactitud de filas al filtrar combinadamente por Periodo y Programa',
  },
  {
    codigo: 'RF-11',
    tipo: 'Base RF',
    especificacion: 'Búsqueda y filtros: buscar y filtrar por identificadores, nombres, programa, periodo o estado.',
    modulosComponentes: 'Presentación (Tablas paginadas) + Aplicación/Persistencia (Consultas paginadas)',
    modeloDecision: 'CU-18: Paginación estandarizada (page, size, totalElements) e índices compuestos en PostgreSQL',
    metodoVerificacion: 'Pruebas unitarias de paginación y pruebas E2E comprobando búsqueda, filtros y controles en todas las tablas',
  },
  {
    codigo: 'RF-12',
    tipo: 'Base RF',
    especificacion: 'Auditoría: registrar inicios de sesión, cambios de roles, matrículas y modificaciones de calificaciones (usuario, fecha, acción, registro afectado).',
    modulosComponentes: 'Auditoría (Bloque Transversal + Módulo Auditoría)',
    modeloDecision: 'EventoAuditoría | ADR-04: Escritura transaccional inmutable y consulta exclusiva de Administrador con filtros',
    metodoVerificacion: 'Inspección tras login, cambio de rol, matrícula, nota y acceso 403 verificando persistencia y filtrado por usuario/acción/fecha',
  },
  {
    codigo: 'RF-13',
    tipo: 'Complementario RF',
    especificacion: 'Recuperación/cambio de contraseña y bloqueo/desbloqueo de usuarios',
    modulosComponentes: 'Seguridad, Notificaciones, Auditoría',
    modeloDecision: 'Usuario (bloqueado, intentosFallidos), EventoAuditoría | ADR-03 Argon2id + umbral 5 intentos',
    metodoVerificacion: 'Prueba automatizada de bloqueo al 5.º fallo, desbloqueo por Administrador y expiración de token de recuperación (15 min)',
  },
  {
    codigo: 'RF-14',
    tipo: 'Complementario RF',
    especificacion: 'Estados del periodo (planeado, matrícula abierta, en curso, cerrado) y ventana de matrícula',
    modulosComponentes: 'Periodos y Grupos, Matrícula, Calificaciones',
    modeloDecision: 'PeriodoAcadémico (máquina de estados en Dominio)',
    metodoVerificacion: 'Pruebas unitarias verificando bloqueo de inscripción cuando el estado difiere de "matrícula abierta" o fuera de fechas',
  },
  {
    codigo: 'RF-15',
    tipo: 'Complementario RF',
    especificacion: 'Validación de cruces de horario y prerrequisitos en la matrícula',
    modulosComponentes: 'Matrícula (Servicio de Dominio puro), Periodos y Grupos, Gestión Académica',
    modeloDecision: 'Matrícula, Grupo, Horario, Prerrequisito, Calificación',
    metodoVerificacion: 'Suite unitaria evaluando solapamiento horario en el mismo día e incumplimiento de asignaturas prerrequisito',
  },
  {
    codigo: 'RF-16',
    tipo: 'Complementario RF',
    especificacion: 'Calificaciones en estado borrador o publicada',
    modulosComponentes: 'Calificaciones, Auditoría',
    modeloDecision: 'Calificación (estado: borrador | publicada)',
    metodoVerificacion: 'Prueba funcional confirmando que el Estudiante solo visualiza notas publicadas y el Docente edita notas en borrador',
  },
  {
    codigo: 'RF-17',
    tipo: 'Complementario RF',
    especificacion: 'Notificaciones por matrícula confirmada y nota publicada',
    modulosComponentes: 'Notificaciones, Matrícula, Calificaciones',
    modeloDecision: 'Notificación + Adaptador SMTP STARTTLS | ADR-04 Despacho post-commit',
    metodoVerificacion: 'Prueba de integración verificando inserción en tabla Notificación y envío de correo tras commit exitoso',
  },
  {
    codigo: 'RF-18',
    tipo: 'Complementario RF',
    especificacion: 'Exportación de reportes a formatos PDF y CSV',
    modulosComponentes: 'Reportes (Capas 1 y 2)',
    modeloDecision: 'Exportador documental respetando los filtros activos de PeriodoAcadémico y Programa',
    metodoVerificacion: 'Prueba automatizada verificando descarga CSV UTF-8 con BOM y generación de documento PDF imprimible',
  },
  {
    codigo: 'RF-19',
    tipo: 'Complementario RF',
    especificacion: 'Historial académico y certificado de notas del estudiante',
    modulosComponentes: 'Reportes, Calificaciones, Gestión Académica',
    modeloDecision: 'Estudiante, PlanEstudio, Calificación (únicamente estado publicada)',
    metodoVerificacion: 'Prueba unitaria del cálculo ponderado de PGA y verificación de modo solo lectura para Estudiante',
  },
  {
    codigo: 'RF-20',
    tipo: 'Complementario RF',
    especificacion: 'Panel de inicio diferenciado según el rol autenticado',
    modulosComponentes: 'Presentación (SPA), Seguridad, Reportes',
    modeloDecision: 'Menú y vistas segregadas estrictamente según Rol de la cuenta autenticada (sin conmutador artificial)',
    metodoVerificacion: 'Prueba E2E iniciando sesión con cada uno de los 4 roles y comprobando menús e indicadores propios',
  },
  {
    codigo: 'RNF-01',
    tipo: 'Base RNF',
    especificacion: 'Seguridad: HTTPS; contraseñas no en texto plano; acceso por roles.',
    modulosComponentes: 'Proxy Nginx (TLS 1.3), Bloque Transversal Seguridad (Spring Security, Argon2id, RBAC)',
    modeloDecision: 'ADR-03: TLS 1.3 + HSTS, hashes Argon2id y guardas RBAC estrictas (RN-01)',
    metodoVerificacion: 'Escaneo TLS (testssl.sh), inspección de hashes Argon2id y matriz de autorización RBAC',
  },
  {
    codigo: 'RNF-02',
    tipo: 'Base RNF',
    especificacion: 'Rendimiento: 95 % de consultas comunes en máximo 3 s con hasta 300 usuarios concurrentes.',
    modulosComponentes: 'Nginx, 2 Réplicas API Spring Boot, HikariCP, PostgreSQL 16',
    modeloDecision: 'ADR-01, ADR-02: Consultas paginadas, índices compuestos B-Tree y transacciones acotadas',
    metodoVerificacion: 'Prueba de carga automatizada con k6 a 300 usuarios concurrentes verificando p(95) <= 3000 ms',
  },
  {
    codigo: 'RNF-03',
    tipo: 'Base RNF',
    especificacion: 'Disponibilidad: objetivo mensual de al menos 99,5 %, excluyendo mantenimientos programados.',
    modulosComponentes: 'Nginx, 2 Réplicas API Docker, PostgreSQL 16',
    modeloDecision: 'Redundancia activa-activa en capa API con health checks (/actuator/health) y recuperación rápida',
    metodoVerificacion: 'Monitoreo continuo y prueba de detención en caliente de Réplica #1 verificando continuidad en Réplica #2',
  },
  {
    codigo: 'RNF-04',
    tipo: 'Base RNF',
    especificacion: 'Escalabilidad: aumentar recursos de cómputo y crecer en usuarios, periodos, cursos y registros sin rediseñar todo.',
    modulosComponentes: 'Capa 2 Aplicación / API stateless + Capa 4 PostgreSQL indexada/paginada',
    modeloDecision: 'ADR-01, ADR-03: Escalado horizontal de contenedores API sin sesiones en memoria y paginación obligatoria',
    metodoVerificacion: 'Adición en caliente de réplica API tras Nginx y pruebas de volumen multi-periodo',
  },
  {
    codigo: 'RNF-05',
    tipo: 'Base RNF',
    especificacion: 'Mantenibilidad: separar responsabilidades; facilitar pruebas y evolución; bajo acoplamiento y cohesión adecuada.',
    modulosComponentes: 'Capas 1 (Presentación), 2 (Aplicación/API), 3 (Dominio) y 4 (Persistencia)',
    modeloDecision: 'ADR-01, ADR-05: 4 capas cerradas con inversión de dependencias (DIP)',
    metodoVerificacion: 'Suite ArchUnit en compilación bloqueando saltos de capa o imports de framework dentro de Dominio',
  },
  {
    codigo: 'RNF-06',
    tipo: 'Base RNF',
    especificacion: 'Usabilidad y accesibilidad: interfaz consistente, adaptable a computador y móvil, etiquetas claras, contraste suficiente y operación por teclado.',
    modulosComponentes: 'Capa 1 Presentación (SPA React + TypeScript / WCAG 2.2 AA)',
    modeloDecision: 'Contraste >= 4.5:1 (#1E1B4B sobre #EEF2FF/#FFFFFF), foco visible 3px, etiquetas explícitas y diseño responsive',
    metodoVerificacion: 'Recorrido completo por teclado e inspección en viewports 1440x900 y 390x844',
  },
  {
    codigo: 'RNF-07',
    tipo: 'Base RNF',
    especificacion: 'Integridad y consistencia: matrícula y calificaciones validan reglas y preservan consistencia ante errores o solicitudes simultáneas.',
    modulosComponentes: 'Matrícula, Calificaciones, PostgreSQL 16',
    modeloDecision: 'ADR-02: Transacción ACID + bloqueo pesimista SELECT FOR UPDATE + restricciones UK/CHECK en BD',
    metodoVerificacion: 'Prueba concurrente multi-hilo sobre el último cupo disponible verificando 0 sobrecupos y rollback limpio',
  },
  {
    codigo: 'RNF-08',
    tipo: 'Base RNF',
    especificacion: 'Interoperabilidad: interfaces documentadas, preferiblemente API REST.',
    modulosComponentes: 'Capa 2 Aplicación / API (Controladores REST JSON /api/v1/*)',
    modeloDecision: 'Contratos RESTful semánticos documentados con OpenAPI 3.1',
    metodoVerificacion: 'Validación de respuestas JSON y códigos HTTP estándar en suite de integración API',
  },
  {
    codigo: 'RNF-09',
    tipo: 'Base RNF',
    especificacion: 'Respaldo y recuperación: copias periódicas y procedimiento de restauración; explicar cómo se protegen los datos.',
    modulosComponentes: 'PostgreSQL 16 + Nodo aislado de respaldos cifrados AES-256',
    modeloDecision: 'ADR-06: pg_dump diario + archivado continuo WAL cifrado AES-256 con retención inmutable',
    metodoVerificacion: 'Ejecución periódica del procedimiento de restauración limpia verificando sumas SHA-256',
  },
  {
    codigo: 'RNF-10',
    tipo: 'Base RNF',
    especificacion: 'Trazabilidad: relacionar decisiones y requisitos con componentes, interfaces, modelos y evidencias de validación.',
    modulosComponentes: 'Documentación 4+1 + Matriz de Trazabilidad + Módulo Auditoría',
    modeloDecision: 'Mapeo bidireccional RF/RNF <-> CU <-> RN <-> ADR <-> Entidades <-> Endpoints <-> Pruebas',
    metodoVerificacion: 'Auditoría documental verificando cobertura completa de los 39 requisitos sin huérfanos',
  },
  {
    codigo: 'RNF-11',
    tipo: 'Base RNF',
    especificacion: 'Privacidad: limitar el acceso a datos personales y académicos según el rol.',
    modulosComponentes: 'Seguridad, Calificaciones, Matrícula, Reportes (Capas 1–3)',
    modeloDecision: 'RN-01, RN-10, RN-11, ADR-07: Segregación por rol y validación de propiedad de grupo/estudiante',
    metodoVerificacion: 'Pruebas negativas verificando bloqueo 403 ante acceso a grupos ajenos o notas en borrador de terceros',
  },
  {
    codigo: 'RNF-12',
    tipo: 'Base RNF',
    especificacion: 'Compatibilidad: funcionar en versiones recientes de navegadores comunes y adaptarse a distintos tamaños de pantalla.',
    modulosComponentes: 'Capa 1 Presentación (HTML5 semántico, CSS Grid/Flexbox, ES2022)',
    modeloDecision: 'Estándares W3C sin extensiones propietarias y adaptación fluida escritorio/móvil',
    metodoVerificacion: 'Ejecución de flujos críticos en Chromium, Firefox y WebKit en resoluciones de escritorio y móvil',
  },
  {
    codigo: 'RNF-13',
    tipo: 'Complementario RNF',
    especificacion: 'Seguridad de aplicación (consultas parametrizadas, validación, CSRF/XSS, tokens con expiración, bloqueo por intentos)',
    modulosComponentes: 'Bloque Transversal Seguridad, API REST, Persistencia JPA, Nginx',
    modeloDecision: 'ADR-03: JPA parametrizado, Bean Validation, CSP estricta, JWT corto (15 min), Argon2id, bloqueo al 5.º intento',
    metodoVerificacion: 'Pruebas SAST/DAST (OWASP ZAP) + casos negativos de inyección, XSS y fuerza bruta',
  },
  {
    codigo: 'RNF-14',
    tipo: 'Complementario RNF',
    especificacion: 'Observabilidad (logs estructurados, health checks, métricas)',
    modulosComponentes: 'Bloque Transversal Observabilidad, API Spring Boot, Nginx',
    modeloDecision: 'Logback JSON con correlationId, Spring Boot Actuator (/actuator/health) y Micrometer',
    metodoVerificacion: 'Validación de esquema JSON de logs y monitoreo HTTP 200 de /actuator/health en ambas réplicas',
  },
  {
    codigo: 'RNF-15',
    tipo: 'Complementario RNF',
    especificacion: 'Testabilidad (inyección de dependencias, cobertura >= 70 % en dominio)',
    modulosComponentes: 'Capa 3 Dominio (8 módulos)',
    modeloDecision: 'ADR-01: Dominio libre de frameworks con inyección por constructor',
    metodoVerificacion: 'Umbral obligatorio JaCoCo >= 70 % en paquete domain dentro del pipeline de integración continua',
  },
  {
    codigo: 'RNF-16',
    tipo: 'Complementario RNF',
    especificacion: 'Despliegue reproducible con contenedores y CI/CD',
    modulosComponentes: 'Dockerfiles (Nginx + API), PostgreSQL, Flyway, Pipeline CI/CD',
    modeloDecision: 'Contenedores inmutables multi-stage + migraciones versionadas Flyway',
    metodoVerificacion: 'Despliegue limpio automatizado en entorno efímero ejecutando migraciones y pruebas de humo',
  },
  {
    codigo: 'RNF-17',
    tipo: 'Complementario RNF',
    especificacion: 'Cumplimiento de la Ley 1581 de 2012 (Colombia)',
    modulosComponentes: 'Seguridad, Gestión Académica, Auditoría',
    modeloDecision: 'Autorización previa e informada persistida en Usuario, minimización PII en logs y trazabilidad de accesos',
    metodoVerificacion: 'Verificación funcional del consentimiento obligatorio y auditoría de no exposición de datos sensibles en logs',
  },
  {
    codigo: 'RNF-18',
    tipo: 'Complementario RNF',
    especificacion: 'Continuidad de negocio con RPO <= 24 h y RTO <= 4 h',
    modulosComponentes: 'PostgreSQL, Almacenamiento de Respaldos, Infraestructura Docker',
    modeloDecision: 'Respaldo completo diario cifrado + archivado continuo WAL + procedimiento automatizado de restauración',
    metodoVerificacion: 'Simulacro cronometrado de restauración completa midiendo RTO efectivo <= 4 h y pérdida <= 24 h',
  },
  {
    codigo: 'RNF-19',
    tipo: 'Complementario RNF',
    especificacion: 'API documentada con OpenAPI',
    modulosComponentes: 'Capa 2 Aplicación / API (Controladores REST y DTOs)',
    modeloDecision: 'Contrato OpenAPI 3.1 autogenerado y validado con springdoc-openapi',
    metodoVerificacion: 'Validación automática del archivo openapi.json en CI contra los controladores implementados',
  },
];
