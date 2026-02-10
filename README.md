# Alpina Coach Nutricional (MVP)

Una aplicación web responsive diseñada para ayudar a los clientes de Alpina a mejorar sus hábitos alimenticios mediante un coach nutricional inteligente impulsado por IA.

## 🚀 Tecnologías

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Next.js API Routes.
- **Base de Datos & Auth**: Supabase (PostgreSQL, Auth, Storage).
- **IA**: Anthropic Claude 3.5 Sonnet (con soporte de visión para análisis de fotos de comida).
- **Métricas**: Recharts.

## 📦 Estructura del Proyecto

```text
alpina-coach/
  app/              # Rutas de la aplicación (Auth, Consumer, Admin, API)
  components/       # Componentes de UI reutilizables
  lib/              # Lógica de Supabase, AI y utilidades
  data/             # Catálogos de productos y alimentos
  supabase/         # Migraciones de base de datos
  types/            # Definiciones de TypeScript
```

## 🛠️ Configuración Inicial

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env.local` basado en `.env.local.example` y agrega tus credenciales de Supabase y Anthropic.

3. **Base de Datos:**
   Ejecuta la migración ubicada en `supabase/migrations/20240209000000_initial_schema.sql` en tu panel SQL de Supabase.

4. **Correr en desarrollo:**
   ```bash
   npm run dev
   ```

## ✨ Funcionalidades Core

- **Login Magic Link**: Acceso sin contraseña usando solo email.
- **Onboarding Inteligente**: Cálculo automático de TMB y meta calórica (Harris-Benedict).
- **Chat con IA**:
  - Análisis de comida por texto.
  - Análisis de comida por imagen (fotos reales).
  - Recomendaciones naturales de productos Alpina relevantes.
- **Registro Diario**: Visualización de macros (Proteína, Carbos, Grasa) y calorías restantes.
- **Panel Admin**:
  - Métricas de usuarios activos y registro de alimentos.
  - Distribución de objetivos.
  - Gestión de usuarios y exportación a CSV.

## 🎨 Diseño
Basado en la identidad de marca Alpina:
- Azul Oscuro: `#1B3A5C`
- Naranja: `#E87722`
- Verde: `#2E8B57`

---
Desarrollado para Alpina S.A.
