# AI Interview Prep Platform

A full-stack MERN application that helps candidates prepare for job interviews by analyzing a target job description, the candidate's resume, and an optional self-description. The app generates a personalized interview preparation report with a match score, technical questions, behavioral questions, skill gaps, a 7-day preparation roadmap, and an AI-generated resume PDF.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Application Flow](#application-flow)
- [Production Notes](#production-notes)
- [Known Limitations](#known-limitations)

## Overview

This project is built as a separated frontend and backend application:

- `Frontend`: React + Vite client for authentication, report generation, report viewing, and resume PDF download.
- `Backend`: Express API for authentication, protected interview report routes, resume parsing, Gemini-powered content generation, MongoDB persistence, and PDF generation.

The user signs up or logs in, uploads a resume PDF, enters a job description and self-description, then receives an AI-generated interview preparation report tailored to the target role.

## Features

- User registration and login with JWT cookie authentication.
- Protected routes for authenticated users.
- Login error feedback with a dismissible message popup.
- Profile menu with current user details and logout access.
- Resume upload with in-memory file handling using Multer.
- PDF resume text extraction using `pdf-parse`.
- AI-generated interview preparation reports using Google GenAI.
- Match score based on resume, self-description, and job description fit.
- Technical interview questions with interviewer intention and model answers.
- Behavioral interview questions with structured answer guidance.
- Skill gap analysis with severity levels.
- 7-day preparation roadmap.
- Saved interview reports per user.
- Resume PDF generation using AI-generated HTML and Puppeteer.
- Live job description character counter in the report generation form.
- React context-based state management for auth and interview reports.
- SCSS-based responsive UI styling.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Sass / SCSS
- ESLint

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT
- bcryptjs
- cookie-parser
- cors
- multer
- pdf-parse
- Google GenAI SDK
- Puppeteer
- Zod

## Project Structure

```txt
project_16/
+-- Backend/
|   +-- server.js
|   +-- package.json
|   +-- src/
|       +-- app.js
|       +-- config/
|       |   +-- database.js
|       +-- controllers/
|       |   +-- auth.controller.js
|       |   +-- interview.controller.js
|       +-- middlewares/
|       |   +-- auth.middleware.js
|       |   +-- file.middleware.js
|       +-- models/
|       |   +-- blacklist.model.js
|       |   +-- interviewReport.model.js
|       |   +-- user.model.js
|       +-- routes/
|       |   +-- auth.routes.js
|       |   +-- interview.routes.js
|       +-- services/
|           +-- ai.service.js
|
+-- Frontend/
|   +-- index.html
|   +-- package.json
|   +-- vite.config.js
|   +-- src/
|       +-- App.jsx
|       +-- app.routes.jsx
|       +-- main.jsx
|       +-- features/
|       |   +-- auth/
|       |   +-- interview/
|       +-- style/
|
+-- README.md
```

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js 20 or later
- npm
- MongoDB local instance or MongoDB Atlas database
- Google GenAI API key

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd project_16
```

### 2. Install Backend Dependencies

```bash
cd Backend
npm install
```

### 3. Configure Backend Environment Variables

Create a `.env` file inside the `Backend` directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/ai-interview-prep
JWT_SECRET=replace_with_a_strong_secret_key
GOOGLE_GENAI_API_KEY=replace_with_your_google_genai_api_key
```

### 4. Start the Backend Server

```bash
npm run dev
```

The backend runs on:

```txt
http://localhost:3000
```

### 5. Install Frontend Dependencies

Open a new terminal:

```bash
cd Frontend
npm install
```

### 6. Start the Frontend Development Server

```bash
npm run dev
```

The frontend runs on:

```txt
http://localhost:5173
```

## Environment Variables

The backend requires the following environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JWT auth tokens. |
| `GOOGLE_GENAI_API_KEY` | Yes | API key used by the Google GenAI SDK. |

The frontend currently uses `http://localhost:3000` as the API base URL inside the Axios service files.

## Available Scripts

### Backend

Run from the `Backend` directory.

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Express server using Nodemon through `npx nodemon server.js`. |
| `npm test` | Placeholder test script. Tests are not configured yet. |

### Frontend

Run from the `Frontend` directory.

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Builds the frontend for production. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint checks. |

## API Reference

Base URL:

```txt
http://localhost:3000
```

### Auth Routes

#### Register User

```http
POST /api/auth/register
```

Request body:

```json
{
  "username": "abhinav",
  "email": "abhinav@example.com",
  "password": "securePassword123"
}
```

Response:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "username": "abhinav",
    "email": "abhinav@example.com"
  }
}
```

#### Login User

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "abhinav@example.com",
  "password": "securePassword123"
}
```

#### Logout User

```http
GET /api/auth/logout
```

Clears the auth cookie and stores the current token in the blacklist collection.

#### Get Current User

```http
GET /api/auth/get-me
```

Requires authentication.

### Interview Routes

#### Generate Interview Report

```http
POST /api/interview/
```

Requires authentication.

Content type:

```txt
multipart/form-data
```

Form fields:

| Field | Type | Description |
| --- | --- | --- |
| `jobDescription` | string | Target job description. |
| `selfDescription` | string | Candidate's short profile summary. |
| `resume` | file | Resume file. Current backend parser expects PDF content. |

#### Get All Reports

```http
GET /api/interview/
```

Requires authentication. Returns all interview reports created by the logged-in user, sorted by newest first.

#### Get Report by ID

```http
GET /api/interview/report/:interviewId
```

Requires authentication. Returns a single report owned by the logged-in user.

#### Generate Resume PDF

```http
POST /api/interview/resume/pdf/:interviewReportId
```

Requires authentication. Returns a generated resume PDF for the selected interview report.

## Application Flow

1. The user creates an account or logs in.
2. The backend stores a JWT in a cookie.
3. The user can open the profile menu to view account details or log out.
4. The user uploads a resume PDF and optionally adds a self-description.
5. The user enters a target job description and can track the character count while typing.
6. The backend extracts resume text from the uploaded PDF.
7. The backend sends the resume, job description, and self-description to Google GenAI.
8. The AI response is validated and saved in MongoDB as an interview report.
9. The frontend displays the report with questions, answers, skill gaps, and roadmap.
10. The user can revisit saved reports, generate a tailored resume PDF, or log out from the profile menu.

## Production Notes

Before deploying this project, review the following:

- Move hard-coded API URLs and CORS origins into environment variables.
- Set secure cookie options in production, including `httpOnly`, `secure`, and `sameSite`.
- Add global error handling middleware for consistent API errors.
- Add request validation for auth and interview inputs.
- Add file type validation so only supported resume formats are accepted.
- Align frontend upload copy with backend support. The UI mentions PDF or DOCX, but the backend currently parses PDF content.
- Add rate limiting to auth and AI generation routes.
- Add logging and monitoring for API errors and AI failures.
- Add automated tests for controllers, middleware, and core service behavior.
- Configure a production process manager or deployment platform for the backend.
- Use a managed MongoDB database for production.
- Store all secrets in the deployment provider's secret manager.

## Known Limitations

- Tests are not configured yet.
- The backend runs on port `3000` directly in `server.js`.
- The frontend API base URL is hard-coded to `http://localhost:3000`.
- The backend CORS origin is hard-coded to `http://localhost:5173`.
- Resume upload is limited to 3 MB by the backend middleware.
- Resume upload is required by the current backend controller because it reads `req.file.buffer`.
- The current backend PDF parser expects PDF input, even though the frontend upload label also mentions DOCX.
- The AI model name is configured directly inside `ai.service.js`.

## License

This project is currently licensed under the ISC license as declared in the backend package metadata.
