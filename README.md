# EduRank System

A comprehensive faculty performance evaluation, ranking, and improvement planning platform.

## Architecture

The project consists of two main components:

- **Backend (`/backend`)**: Spring Boot (Java 17) REST API running on port `8090`. Provides endpoints and DAOs for evaluations, faculty assignments, improvement plans, and principal management with MySQL integration.
- **Frontend (`/edurankk`)**: React + TypeScript application powered by Vite, TanStack Router, Tailwind CSS, and Radix UI components.

## Getting Started

### Prerequisites

- Java 17+ & Maven
- Node.js 18+ & npm
- MySQL Server

### 1. Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend server starts on `http://localhost:8090`. Configure database connection details in `backend/src/main/resources/application.properties`.

### 2. Frontend Setup

```bash
cd edurankk
npm install
npm run dev
```

The frontend application runs on `http://localhost:8080` (or the port specified in `vite.config.ts`).

## Features

- **Faculty Evaluation**: Multi-parameter rating and evaluation calculation.
- **Faculty Dashboard**: Individual performance metrics, history, and improvement areas.
- **Principal & Admin Portal**: Institutional overview, faculty rankings, and assignment management.
- **Action Plans**: Structured performance improvement plans.
