<p align="center">
  <img src="https://github.com/user-attachments/assets/32dfcb54-448d-4516-b80d-e3428b40925a" alt="Connectin Logo" width="150">
</p>

<h1 align="center">🚀 ConnectIn: Your Professional IT Ecosystem</h1>

<p align="center">
  <em>Connecting Developers, Projects, and Opportunities in the Tech World.</em>
  <br />
  </p>

---

**ConnectIn** is a modern web platform designed to bridge the gap between developers seeking practical experience and projects/teams looking for motivated talent. It acts as a central hub, fostering collaboration, skill development, and career growth within the IT community.

[Watch the video!](https://www.youtube.com/watch?v=clV6R6F6AWw)

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

### Backend (`connectin-backend`)

* **Framework:** <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /> (using <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" />)
* **Database:** <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /> (on <img src="https://img.shields.io/badge/AWS_RDS-527FFF?style=for-the-badge&logo=amazonrds&logoColor=white" alt="AWS RDS" />)
* **ORM:** <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy" />
* **Migrations:** **Alembic**
* **Data Validation:** **Pydantic**
* **Authentication:** <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />, <img src="https://img.shields.io/badge/OAuth2-24AAFF?style=for-the-badge&logo=oauth&logoColor=white" alt="OAuth2" /> (Google), **Passlib/Bcrypt**
* **Deployment:** <img src="https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" alt="Railway" /> (using <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /> or <img src="https://img.shields.io/badge/Nixpacks-5277C3?style=for-the-badge&logo=nixos&logoColor=white" alt="Nixpacks (using NixOS logo)" />)

### Frontend (`connectin-frontend`)

* **Library:** <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React.js" /> (with <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />)
* **Styling:** <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
* **State Management:** React Context API / **Zustand** *(Confirm based on your setup)*
* **Routing:** <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router DOM" />
* **API Client:** **Axios**
* **Real-time:** **WebSocket** 🔌
* **UI Enhancements:** <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />, **React Toastify**, <img src="https://img.shields.io/badge/FontAwesome-528DD7?style=for-the-badge&logo=fontawesome&logoColor=white" alt="FontAwesome" />
* **Deployment:** <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />

### Machine Learning Service (`connectin-ml_service`)

* **Language:** <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" />
* **Libraries:** <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy" />, <img src="https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white" alt="NumPy" />, <img src="https://img.shields.io/badge/Scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="Scikit-learn" />
* **Deployment:** <img src="https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=awslambda&logoColor=white" alt="AWS Lambda" /> (via <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /> container on <img src="https://img.shields.io/badge/AWS_ECR-FF9900?style=for-the-badge&logo=amazonecr&logoColor=white" alt="AWS ECR" />)
* **Scheduling:** <img src="https://img.shields.io/badge/AWS_EventBridge-FF9900?style=for-the-badge&logo=amazoneventbridge&logoColor=white" alt="AWS EventBridge Scheduler" />

### Cloud Infrastructure (AWS)

* **Core Services:** <img src="https://img.shields.io/badge/Amazon_AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS" />
* **Database:** <img src="https://img.shields.io/badge/AWS_RDS-527FFF?style=for-the-badge&logo=amazonrds&logoColor=white" alt="AWS RDS" /> (hosting <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />)
* **File Storage:** <img src="https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white" alt="AWS S3" />
* **Container Registry:** <img src="https://img.shields.io/badge/AWS_ECR-FF9900?style=for-the-badge&logo=amazonecr&logoColor=white" alt="AWS ECR" />
* **Serverless Compute:** <img src="https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=awslambda&logoColor=white" alt="AWS Lambda" />
* **Scheduling:** <img src="https://img.shields.io/badge/AWS_EventBridge-FF9900?style=for-the-badge&logo=amazoneventbridge&logoColor=white" alt="AWS EventBridge" />
* **Permissions:** <img src="https://img.shields.io/badge/AWS_IAM-FF9900?style=for-the-badge&logo=awsidentityandaccessmanagement&logoColor=white" alt="AWS IAM" />
* **Monitoring:** <img src="https://img.shields.io/badge/AWS_CloudWatch-FF9900?style=for-the-badge&logo=amazoncloudwatch&logoColor=white" alt="AWS CloudWatch" />

## 🏗️ Architecture

ConnectIn uses a distributed architecture separating concerns:

```mermaid
graph TD
    %% Define Styles based on ConnectIn Palette
    classDef user fill:#E0F2F7,stroke:#00796b,stroke-width:2px,color:#004d40;  
    classDef frontend fill:#E8F5E9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20; 
    classDef backend fill:#E3F2FD,stroke:#0d47a1,stroke-width:2px,color:#0d47a1; 
    classDef aws fill:#FFF3E0,stroke:#ff9900,stroke-width:2px,color:#e65100;   
    classDef data fill:#FFF8E1,stroke:#ff8f00,stroke-width:1px,color:#e65100;  
    classDef ml fill:#F1F8E9,stroke:#558b2f,stroke-width:1px,color:#33691e;  

    subgraph User Browser
        U[<fa:fa-user/> User]:::user
    end

    subgraph Frontend Deployed on Railway  
        FE[<fa:fa-window-maximize/> React SPA]:::frontend
    end

    subgraph Backend Deployed on Railway
        BE[<fa:fa-server/> FastAPI API]:::backend
    end

    subgraph "AWS Cloud Infrastructure"
        subgraph "Data & Storage"
            RDS[<fa:fa-database/> AWS RDS PostgreSQL]:::data
            S3[<fa:fa-hard-drive/> AWS S3 Files]:::data
        end
        subgraph "ML Service (Serverless)"
            ECR[<fa:fa-box/> ECR Image]:::ml;
            EB(<fa:fa-clock/> EventBridge Scheduler) -->|Triggers| L[<fa:fa-microchip/> Lambda Function]:::ml;
            L -->|Uses Image| ECR;
            L <-->|Reads/Writes Data| RDS;
            L -->|Sends Logs| CW[<fa:fa-file-alt/> CloudWatch Logs]:::ml;
            IAM((<fa:fa-key/> IAM Role)) -- Grants Permissions --> L;
        end
    end

    U -- HTTPS --> FE;
    FE -- API Calls --> BE;
    FE -- WebSocket <--> BE;
    BE -- DB Access --> RDS;
    BE -- File Storage --> S3;

    %% Apply Classes
    class U user;
    class FE frontend;
    class BE backend;
    class RDS,S3 data;
    class ECR,EB,L,IAM,CW ml;
```
* **Frontend:** User interface built with React, hosted on **Vercel**.
* **Backend:** FastAPI application handling core logic, API requests, and WebSocket connections, hosted on **Railway**.
* **Database:** PostgreSQL managed by **AWS RDS**.
* **File Storage:** User uploads (avatars, chat media) stored in **AWS S3**.
* **ML Service:** Independent Python script running on **AWS Lambda** (deployed as a Docker container from **AWS ECR**). Triggered periodically by **AWS EventBridge** to calculate recommendations without loading the main backend.
* **AWS Services:** Provide the underlying infrastructure for data, storage, and serverless ML processing, secured by **IAM** and monitored via **CloudWatch**.

## 🚀 Getting Started

To set up the project locally for development:

**Prerequisites:**

* **Python Environment:** <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" /> & Pip
* **JavaScript Runtime:** <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js LTS" /> (LTS) & <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm" /> / <img src="https://img.shields.io/badge/yarn-2C8EBB?style=for-the-badge&logo=yarn&logoColor=white" alt="yarn" />
* **Containerization:** <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /> & Docker Compose *(Recommended for local DB)*
* **Database Client:** <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /> Client (`psql`)
* **Version Control:** <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" alt="Git" />

**Setup Steps:**

1.  **Clone:** `git clone https://github.com/ded-r/ConnectIn/ && cd ConnectIn`

2.  **Backend (`connectin-backend`):**
    * `cd connectin-backend`
    * `python -m venv .venv && source .venv/bin/activate` (or `.venv\Scripts\activate` on Windows)
    * `pip install -r requirements.txt`
    * Create `.env` file (copy `.env.example` if available).
    * **Set `DATABASE_URL`** (e.g., `postgresql+psycopg2://user:pass@localhost:5432/connectin_dev`). *Use Docker Compose or local PostgreSQL.*
    * Set `SECRET_KEY`, `ALGORITHM`, token expiry times.
    * *(Optional)* Set AWS/OpenAI/Stripe keys if testing locally.
    * Set `FRONTEND_URL` (e.g., `http://localhost:5173`).
    * **Apply Migrations:** Ensure DB is running, then `alembic upgrade head`.

3.  **Frontend (`connectin-frontend`):**
    * `cd ../connectin-frontend`
    * `npm install` (or `yarn install`)
    * Create `.env.local` file.
    * Set `VITE_API_URL=http://localhost:8000` (your backend address, **without** `/api/v1`).
    * *(Optional)* Set `VITE_STRIPE_PUBLISHABLE_KEY`.

4.  **ML Service (`connectin-ml_service`):**
    * `cd ../connectin-ml_service`
    * `python -m venv .venv && source .venv/bin/activate`
    * `pip install -r requirements.txt`
    * Create `.env` file.
    * Set `DATABASE_URL` to your **local/test** database.

## ▶️ Running Locally

1.  **Start Backend:** In `connectin-backend` (venv active):
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
2.  **Start Frontend:** In `connectin-frontend`:
    ```bash
    npm run dev
    ```
    Access via `http://localhost:5173` (or indicated port).
3.  **Run ML Service (Manually):** In `connectin-ml_service` (venv active):
    ```bash
    python run_recommendations.py
    ```

## 🧪 Testing

The project currently relies on **manual testing** to ensure functionality across different user scenarios. **A/B testing** methodologies were employed during development to compare the effectiveness of different recommendation approaches *(adjust this sentence if A/B testing wasn't actually done)*. Automated tests (unit, integration) are planned for future iterations.

## ☁️ Deployment

* **Backend API & Frontend UI:** Deployed on **Railway**. *(Correction: You mentioned both are on Railway now)*
* **ML Service:** Deployed on **AWS Lambda** via container image from **AWS ECR**, scheduled by **AWS EventBridge**.
* **Database:** **AWS RDS** (PostgreSQL).
* **File Storage:** **AWS S3**.

## 📂 Project Structure
```
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
```

## 📜 License

License pending. Will be updated shortly (likely MIT).

## 🙏 Acknowledgements

* SDU University & Faculty Advisor Shakhnazar Sultan Manbay
* The FastAPI, React, and SQLAlchemy open-source communities.
* AWS Cloud Services for providing robust infrastructure.

---

🌟 **Join ConnectIn and shape the future of tech collaboration!**
