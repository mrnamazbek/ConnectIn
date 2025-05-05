<p align="center">
  <img src="placeholder-logo.png" alt="ConnectIn Logo Placeholder" width="150">
</p>

<h1 align="center">🚀 ConnectIn: Your Professional IT Ecosystem</h1>

<p align="center">
  <em>Connecting Developers, Projects, and Opportunities in the Tech World.</em>
  <br />
  </p>

---

**ConnectIn** is a modern web platform designed to bridge the gap between developers seeking practical experience and projects/teams looking for motivated talent. It acts as a central hub, fostering collaboration, skill development, and career growth within the IT community.

## 🤔 Why ConnectIn? The Problem

Many developers, especially students and those starting their careers, face common challenges:

* **Gaining Real Experience:** It's hard to get hired without experience, but hard to get experience without being hired.
* **Finding the Right Fit:** Job boards often lack details about projects or team culture. Code platforms like GitHub focus on code, not necessarily on team collaboration or finding specific project roles.
* **Building a Network:** Connecting with collaborators, mentors, or peers for projects can be difficult.
* **Showcasing Skills:** Traditional resumes don't always reflect practical skills gained through collaboration and project work.

## ✨ Our Solution: ConnectIn

ConnectIn tackles these issues by creating an interactive ecosystem where:

* **Developers:** Build detailed profiles showcasing not just skills, but actual project contributions. Discover projects tailored to their interests and apply to join teams.
* **Project Leaders:** Create project pages, define needed skills/roles, and recruit talent based on verified abilities and profile data.
* **The Community:** Share knowledge, project updates, and insights through posts, fostering a supportive environment.

## 🔑 Key Features

* 👤 **Rich User Profiles:** Display skills, work experience, education, project history, social links.
* 🚀 **Project Hub:** Create, find, and manage projects with details, required skills, and team members.
* 🤝 **Team Building:** Form teams, invite members, and collaborate effectively.
* 📝 **Community Feed:** Share posts, articles, and updates. Engage via comments and likes.
* 💬 **Real-Time Chat:** Integrated chat for direct messaging and team communication, including media sharing via AWS S3.
* 🧠 **ML Recommendations:** Suggests relevant projects, teams, and posts based on user skills and activity (likes).
* 📄 *(Optional)* **AI Resume Generation:** Creates professional resumes from profile data.

## 🛠️ Tech Stack

ConnectIn is built with a modern technology stack:

* **Backend (`connectin-backend`):**
    * Framework: **FastAPI** (Python 3.11+)
    * Database: **PostgreSQL** (on **AWS RDS**)
    * ORM: **SQLAlchemy**
    * Migrations: **Alembic**
    * Data Validation: **Pydantic**
    * Authentication: **JWT**, **OAuth2** (Google), **Passlib/Bcrypt**
    * Deployment: **Railway** (using Docker or Nixpacks)
* **Frontend (`connectin-frontend`):**
    * Library: **React.js** (with Vite)
    * Styling: **Tailwind CSS**
    * State Management: React Context API / Zustand *(Confirm based on your setup)*
    * Routing: **React Router DOM**
    * API Client: **Axios**
    * Real-time: **WebSocket**
    * UI Enhancements: **Framer Motion**, **React Toastify**, **FontAwesome**
    * Deployment: **Vercel**
* **Machine Learning Service (`connectin-ml_service`):**
    * Language: **Python 3.11+**
    * Libraries: **SQLAlchemy**, **NumPy**, **Scikit-learn**
    * Deployment: **AWS Lambda** (via Docker container on **AWS ECR**)
    * Scheduling: **AWS EventBridge Scheduler**
* **Cloud Infrastructure (AWS):**
    * **RDS** (Database), **S3** (File Storage), **ECR** (Container Registry), **Lambda** (Serverless Compute), **EventBridge** (Scheduling), **IAM** (Permissions), **CloudWatch** (Monitoring)

## 🏗️ Architecture

ConnectIn uses a distributed architecture separating concerns:

```mermaid
graph TD
    subgraph User Browser
        U[<fa:fa-user/> User]
    end

    subgraph Frontend (Vercel)
        FE[<fa:fa-window-maximize/> React SPA]
    end

    subgraph Backend (Railway)
        BE[<fa:fa-server/> FastAPI API]
    end

    subgraph "AWS Cloud"
        subgraph "Data & Storage"
            RDS[<fa:fa-database/> AWS RDS (PostgreSQL)]
            S3[<fa:fa-hard-drive/> AWS S3 (Files)]
        end
        subgraph "ML Service (Serverless)"
            ECR[<fa:fa-box/> ECR Image];
            EB(<fa:fa-clock/> EventBridge) -->|Triggers| L[<fa:fa-microchip/> Lambda];
            L -->|Uses| ECR;
            L <-->|Data| RDS;
            L -->|Logs| CW[<fa:fa-file-alt/> CloudWatch];
            IAM((<fa:fa-key/> IAM Role)) -- Grants --> L;
        end
    end

    U -- HTTPS --> FE;
    FE -- API Calls --> BE;
    FE -- WebSocket <--> BE;
    BE -- DB Access --> RDS;
    BE -- File Access --> S3;

    classDef aws fill:#FF9900,stroke:#333,stroke-width:1px,color:#000;
    class RDS,S3,ECR,EB,L,IAM,CW aws;
```
Frontend: User interface built with React, hosted on Vercel.
Backend: FastAPI application handling core logic, API requests, and WebSocket connections, hosted on Railway.
Database: PostgreSQL managed by AWS RDS.
File Storage: User uploads (avatars, chat media) stored in AWS S3.
ML Service: Independent Python script running on AWS Lambda (deployed as a Docker container from ECR). It's triggered periodically by AWS EventBridge to calculate recommendations without loading the main backend.
AWS Services: Provide the underlying infrastructure for data, storage, and serverless ML processing.
🚀 Getting Started
To run this project locally for development:
Prerequisites:
Python 3.11+ & Pip
Node.js (LTS version recommended) & npm or yarn
Docker & Docker Compose (highly recommended for local database)
PostgreSQL Client (e.g., psql)
Git
Setup Steps:
Clone Repository:
git clone <your-repository-url>
cd ConnectIn


Backend Setup (connectin-backend):
Navigate: cd connectin-backend
Create Virtual Environment: python -m venv .venv
Activate: source .venv/bin/activate (Linux/macOS) or .venv\Scripts\activate (Windows)
Install Dependencies: pip install -r requirements.txt
Configure Environment:
Create a .env file (copy .env.example if available).
Set DATABASE_URL (e.g., postgresql+psycopg2://user:pass@localhost:5432/connectin_dev). You can use Docker Compose (see archive/docker-compose.yml?) or a local PostgreSQL installation.
Set SECRET_KEY, ALGORITHM, token expiry times.
(Optional) Set OPENAI_API_KEY, AWS credentials (N_AWS...), Stripe keys if testing those features locally.
Set FRONTEND_URL=http://localhost:5173 (or your frontend port).
Apply Migrations: Make sure your database is running, then run:
alembic upgrade head


Frontend Setup (connectin-frontend):
Navigate: cd ../connectin-frontend
Install Dependencies: npm install (or yarn install)
Configure Environment:
Create a .env.local file.
Set VITE_API_URL=http://localhost:8000 (or your backend address, without /api/v1).
(Optional) Set VITE_STRIPE_PUBLISHABLE_KEY.
ML Service Setup (connectin-ml_service):
Navigate: cd ../connectin-ml_service
Create Virtual Environment: python -m venv .venv
Activate: source .venv/bin/activate (or .venv\Scripts\activate)
Install Dependencies: pip install -r requirements.txt
Configure Environment:
Create a .env file.
Set DATABASE_URL to your local/test database connection string.
▶️ Running Locally
Start Backend:
In connectin-backend (with venv activated):
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


Start Frontend:
In connectin-frontend:
npm run dev
# or yarn dev


Access in browser: http://localhost:5173 (or as indicated).
Run ML Service (Manually for Testing):
In connectin-ml_service (with venv activated):
python run_recommendations.py


🧪 Testing
(Placeholder: Add instructions on how to run any automated tests you have)
# Example: cd connectin-backend && pytest
Please we do not have atutomated testing, we tested all over manual testing!!! and A/B testing.


☁️ Deployment
Backend API and Frontend UI: Deployed on Railway.
ML Service: Deployed on AWS Lambda via container image from AWS ECR, scheduled by AWS EventBridge.


📂 Project Structure
├── connectin-backend/      # FastAPI Backend Application
│   ├── alembic/            # Database migrations
│   ├── app/                # Core application code
│   │   ├── api/            # API Routers (v1, v2...)
│   │   ├── core/           # Configuration, settings
│   │   ├── db/             # Database session setup
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic data schemas
│   │   ├── services/       # Business logic layer
│   │   ├── crud/           # Data access layer (optional, alternative to repos)
│   │   ├── utils/          # Utility functions (auth, s3, etc.)
│   │   ├── websockets/     # WebSocket logic (manager, endpoints)
│   │   └── main.py         # FastAPI app creation and router includes
│   ├── tests/              # Backend tests
│   ├── Dockerfile          # For backend deployment/local env
│   └── requirements.txt
├── connectin-frontend/     # React Frontend Application
│   ├── public/             # Static assets
│   ├── src/                # Frontend source code
│   │   ├── assets/         # Images, fonts
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Context providers (e.g., AuthContext)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API service calls (e.g., tokenService)
│   │   ├── store/          # State management (if using Zustand/Redux)
│   │   ├── styles/         # Global CSS, component styles
│   │   ├── utils/          # Frontend utility functions
│   │   └── App.jsx         # Main application component with routing
│   ├── index.html          # HTML entry point
│   ├── package.json
│   └── vite.config.js      # Vite configuration
├── connectin-ml_service/   # ML Recommendation Service (for Lambda)
│   ├── Dockerfile          # For building the Lambda container image
│   ├── run_recommendations.py # Main script executed by Lambda
│   ├── requirements.txt    # Python dependencies for ML service
│   └── tests/              # Tests for ML service (optional)
├── .gitignore
└── README.md               # This file


📜 License
We didn't get License yet(Coming soon license, e.g., MIT)
A license is pending and will be provided shortly (e.g., MIT).
Distributed under the MIT License. See LICENSE.md for more information.


🙏 Acknowledgements
(Optional: Thank advisors, inspirations, key libraries)
SDU University & @Shakhnazar Sultan Manbay
FastAPI, React
