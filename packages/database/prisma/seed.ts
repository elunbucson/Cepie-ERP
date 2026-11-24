import {
  PrismaClient,
  UserRole,
  Modality,
  EducationLevel,
  InventoryCategory,
  AssetCondition,
} from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando carga de datos base institucionales...");

  const defaultPasswordHash = await argon2.hash("Institucional2026!", {
    type: argon2.argon2id,
  });

  // 1. InstituciÃ³n Base
  const institution = await prisma.institution.upsert({
    where: { cctCode: "02PSU0001X" },
    update: {},
    create: {
      name: "CEPIE",
      legalName: "CENTRO DE ESTUDIOS SUPERIORES",
      cctCode: "02PSU0001X",
      primaryColor: "#0F172A",
      secondaryColor: "#1D4ED8",
      supportEmail: "soporte@cepie.edu.mx",
      supportPhone: "+52 (664) 000-0000",
      privacyNotice:
        "Aviso de Privacidad Integral conforme a la Ley Federal de ProtecciÃ³n de Datos Personales en PosesiÃ³n de los Particulares (LFPDPPP). Los datos recabados son utilizados exclusivamente para fines acadÃ©micos, de control escolar y acreditaciÃ³n ante la SecretarÃ­a de EducaciÃ³n PÃºblica.",
    },
  });

  // 2. Usuarios Operativos y Cuentas de VerificaciÃ³n RVOE (Anexo 4)
  const adminUser = await prisma.user.upsert({
    where: { email: "arath.hernandez.corrales@uabc.edu.mx" },
    update: {},
    create: {
      email: "arath.hernandez.corrales@uabc.edu.mx",
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN_GENERAL,
      firstName: "Arath",
      lastName: "Hernandez",
      isDemoAccount: false,
    },
  });

  // Cuenta de prueba Administrador para verificador SEP
  await prisma.user.upsert({
    where: { email: "verificador.admin@institucion-demo.edu.mx" },
    update: {},
    create: {
      email: "verificador.admin@institucion-demo.edu.mx",
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN_GENERAL,
      firstName: "Verificador SEP",
      lastName: "Perfil Administrador",
      isDemoAccount: true,
    },
  });

  // Docente titular y cuenta de prueba Docente
  const teacherUser = await prisma.user.upsert({
    where: { email: "docente.demo@institucion-demo.edu.mx" },
    update: {},
    create: {
      email: "docente.demo@institucion-demo.edu.mx",
      passwordHash: defaultPasswordHash,
      role: UserRole.DOCENTE,
      firstName: "Dra. Elena",
      lastName: "Salgado Ortega",
      isDemoAccount: true,
      teacherProfile: {
        create: {
          employeeNumber: "DOC-2026-001",
          academicDegree: "Doctorado en Ciencias Computacionales",
          professionalId: "8492014",
          specialty: "IngenierÃ­a de Software y Bases de Datos",
        },
      },
    },
  });

  // 3. Programa AcadÃ©mico y Plan de Estudios
  const program = await prisma.academicProgram.upsert({
    where: { code: "LIC-ISC-2026" },
    update: {},
    create: {
      institutionId: institution.id,
      name: "Licenciatura en IngenierÃ­a en Sistemas Computacionales",
      code: "LIC-ISC-2026",
      level: EducationLevel.LICENCIATURA,
      modality: Modality.NO_ESCOLARIZADA,
      description:
        "Programa de educaciÃ³n superior en modalidad no escolarizada orientado al desarrollo de arquitectura de software.",
    },
  });

  const studyPlan = await prisma.studyPlan.upsert({
    where: { code: "PLAN-ISC-2026A" },
    update: {},
    create: {
      programId: program.id,
      code: "PLAN-ISC-2026A",
      name: "Plan de Estudios 2026 - En LÃ­nea",
      totalCredits: 300,
      totalPeriods: 9,
    },
  });

  const subject = await prisma.subject.upsert({
    where: {
      studyPlanId_code: {
        studyPlanId: studyPlan.id,
        code: "ISC-101",
      },
    },
    update: {},
    create: {
      studyPlanId: studyPlan.id,
      code: "ISC-101",
      name: "Arquitectura de Computadoras y Sistemas Operativos",
      periodOrder: 1,
      credits: 8,
      teacherHours: 32,
      independentHours: 96,
      generalObjective:
        "Analizar la estructura interna de los sistemas de cÃ³mputo modernos y la gestiÃ³n de recursos del sistema operativo.",
      competencies: "DiseÃ±a y configura entornos operativos seguros y eficientes.",
      bibliography: "Tanenbaum, A. S. (2023). Sistemas Operativos Modernos. Pearson.",
      evalCriteria: "40% Actividades prÃ¡cticas, 40% Evaluaciones parciales, 20% Proyecto integrador.",
    },
  });

  // 4. Periodo Escolar, Grupo y Alumno de Prueba
  const term = await prisma.schoolTerm.upsert({
    where: { code: "2026-2" },
    update: {},
    create: {
      code: "2026-2",
      name: "Ciclo Escolar 2026-2",
      startDate: new Date("2026-08-10T00:00:00Z"),
      endDate: new Date("2026-12-15T23:59:59Z"),
      isCurrent: true,
    },
  });

  const group = await prisma.courseGroup.upsert({
    where: {
      subjectId_termId_groupCode: {
        subjectId: subject.id,
        termId: term.id,
        groupCode: "GPO-101-V",
      },
    },
    update: {},
    create: {
      subjectId: subject.id,
      termId: term.id,
      teacherId: teacherUser.id,
      groupCode: "GPO-101-V",
      scheduleNote: "AsesorÃ­a sÃ­ncrona opcional: MiÃ©rcoles 19:00 hrs (Centro)",
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "alumno.demo@institucion-demo.edu.mx" },
    update: {},
    create: {
      email: "alumno.demo@institucion-demo.edu.mx",
      passwordHash: defaultPasswordHash,
      role: UserRole.ALUMNO,
      firstName: "Luis Alberto",
      lastName: "Vega Castellanos",
      isDemoAccount: true,
      studentProfile: {
        create: {
          matricula: "202610001",
          programId: program.id,
          studyPlanId: studyPlan.id,
          currentSemester: 1,
        },
      },
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_groupId: {
        studentId: studentUser.id,
        groupId: group.id,
      },
    },
    update: {},
    create: {
      studentId: studentUser.id,
      groupId: group.id,
    },
  });

  // 5. Inventario Inicial (Evidencia TecnolÃ³gica RVOE)
  await prisma.inventoryItem.upsert({
    where: { assetTag: "INV-SRV-001" },
    update: {},
    create: {
      institutionId: institution.id,
      assetTag: "INV-SRV-001",
      name: "Base de Datos Serverless en Nube (Neon PostgreSQL)",
      description: "PostgreSQL 16 con Point-in-Time Recovery, cifrado SSL/TLS y respaldos automatizados.",
      category: InventoryCategory.COMPUTO_SERVIDORES,
      brand: "Neon Tech",
      model: "Serverless Enterprise",
      quantityTotal: 1,
      quantityAvail: 1,
      condition: AssetCondition.NUEVO,
      location: "RegiÃ³n US-West (Nube Institucional)",
      isRvoeEvidence: true,
    },
  });

  await prisma.inventoryItem.upsert({
    where: { assetTag: "INV-STR-002" },
    update: {},
    create: {
      institutionId: institution.id,
      assetTag: "INV-STR-002",
      name: "Almacenamiento de Objetos en Nube (Cloudflare R2)",
      description: "Repositorio compatible S3 para materiales acadÃ©micos y evidencias con URLs firmadas.",
      category: InventoryCategory.SOFTWARE_LICENCIAS,
      brand: "Cloudflare",
      model: "R2 Object Storage",
      quantityTotal: 1,
      quantityAvail: 1,
      condition: AssetCondition.NUEVO,
      location: "Nube Global Distribuida",
      isRvoeEvidence: true,
    },
  });

  // 6. Perfil TÃ©cnico Base para Anexo 4 RVOE
  await prisma.rvoeTechnicalProfile.upsert({
    where: { institutionId: institution.id },
    update: {},
    create: {
      institutionId: institution.id,
      generalDescription:
        "Plataforma educativa LMS modular y Sistema de GestiÃ³n Escolar desarrollados bajo arquitectura web moderna con soporte para modalidades no escolarizada y mixta.",
      architectureSummary:
        "Arquitectura Monorepo desacoplada en dos aplicaciones web (Portal LMS y Gestor Escolar) sobre Next.js, TypeScript y base de datos relacional Neon PostgreSQL con optimizaciÃ³n mediante Lazy Loading.",
      hardwareInfra:
        "Infraestructura serverless en la nube con balanceo automÃ¡tico de carga y almacenamiento de objetos compatible con S3 (Cloudflare R2).",
      serverHostingSpec:
        "Alojamiento en la nube con certificado SSL/TLS 1.3 institucional, protecciÃ³n DDoS y alta disponibilidad.",
      databaseSpec:
        "Neon PostgreSQL 16 con integridad referencial ACID, cifrado en trÃ¡nsito (TLS) y en reposo (AES-256).",
      bandwidthConnect:
        "Conectividad escalable mediante CDN y carga diferida (Lazy Loading) para bajo consumo de ancho de banda del alumno.",
      storageCapacity:
        "Almacenamiento elÃ¡stico en Cloudflare R2 escalable segÃºn crecimiento de matrÃ­cula y repositorio documental.",
      scalabilityPlan:
        "Escalamiento automÃ¡tico de cÃ³mputo y almacenamiento sin interrupciÃ³n del servicio.",
      supportProcedures:
        "Mesa de ayuda institucional con atenciÃ³n vÃ­a correo electrÃ³nico, mensajerÃ­a interna y seguimiento de incidencias.",
      maintenancePlan:
        "Ventanas de mantenimiento preventivo programadas en horarios de baja demanda con aviso previo de 72 horas.",
      contingencyPlan:
        "ConmutaciÃ³n por error automatizada y protocolo de restauraciÃ³n rÃ¡pida ante incidentes.",
      backupRecoveryPlan:
        "Respaldos automatizados diarios y Point-in-Time Recovery (PITR) en Neon PostgreSQL.",
      securityPolicies:
        "AutenticaciÃ³n basada en roles (RBAC), hashing Argon2id para contraseÃ±as, cierre de sesiÃ³n por inactividad y bitÃ¡cora inmutable de auditorÃ­a.",
      platformAdvantages:
        "SeparaciÃ³n administrativa y acadÃ©mica, bajo consumo de datos mediante Lazy Loading, trazabilidad completa de evidencias y cumplimiento LFPDPPP.",
    },
  });

  // Registro inicial en bitÃ¡cora
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      appSource: "GESTOR_ESCOLAR",
      action: "SYSTEM_SEED_COMPLETED",
      entityType: "Institution",
      entityId: institution.id,
      metadata: { message: "InicializaciÃ³n base del sistema completada" },
    },
  });

  console.log("Seed ejecutado correctamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
