# Sistema de Gestión Académica (SIGA) - Arquitectura y Prototipo

Repositorio oficial del proyecto académico enfocado en el diseño arquitectónico, modelado de dominios y desarrollo de un prototipo interactivo para un Sistema de Gestión Académica (SGA).

## 🚀 Características Principales
* **Arquitectura:** Monolito modular estructurado en 4 capas cerradas estrictas (Presentación, Aplicación/API, Dominio y Repositorio/Persistencia) con Inversión de Dependencias (DIP).
* **Modelado (4+1):** Diagramas en sintaxis PlantUML bajo el modelo de vistas de Kruchten (Casos de uso, Componentes, Despliegue, Datos conceptual y Secuencia).
* **Seguridad y Trazabilidad:** Control de acceso basado en roles (RBAC) para Administrador, Coordinador académico, Docente y Estudiante, con encriptación Argon2id, tokens JWT de corta expiración y registro de auditoría inmutable (*append-only*).
* **Prototipo Interactivo:** Interfaz web autónoma que simula transacciones de matrícula, validación de prerrequisitos, cruces de horarios, ciclos de calificación y cumplimiento de accesibilidad WCAG 2.2 AA.

## 🛠️ Tecnologías y Herramientas del Proyecto
* **Frontend / Prototipo:** React, TypeScript, HTML5, CSS Grid/Flexbox y JavaScript Vanilla.
* **Backend y Persistencia (Propuesta teórica):** Java 21, Spring Boot 3.x, Spring Data JPA, Flyway, PostgreSQL 16 y HikariCP.
* **Modelado y Documentación:** PlantUML y OpenAPI 3.1 (`springdoc-openapi`).
* **Infraestructura y Pruebas (Propuesta teórica):** Docker, Nginx, JUnit 5, Testcontainers, k6 y ArchUnit.

## 👥 Cuentas Ficticias de Prueba (Prototipo)
El prototipo web incluye cuentas precargadas para probar los diferentes perfiles:
* **Estudiante:** `camila.rios@siga.edu.co`
* **Docente:** `alejandro.mendoza@siga.edu.co`
* **Coordinador Académico:** `patricia.lozano@siga.edu.co`
* **Administrador:** `hernan.castro@siga.edu.co`
*(Contraseña general de demostración para el prototipo: `DemoSiga2026!`)*

## 📂 Estructura del Repositorio
```text
├── prototipo/             # Prototipo funcional en un archivo HTML autónomo
├── src/                   # Código fuente de la SPA (React + TypeScript) y dominio
├── docs/                  # Documentación complementaria y especificaciones
└── README.md              # Documentación y guía del proyecto
