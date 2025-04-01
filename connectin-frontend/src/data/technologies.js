const technologies = [
    // --- Frontend ---
    {
        name: "React",
        logo: "https://cdn.worldvectorlogo.com/logos/react-2.svg",
        description: "Builds our dynamic and responsive user interface.",
        category: "Frontend",
    },
    {
        name: "React Router",
        logo: "https://reactrouter.com/_brand/React%20Router%20Brand%20Assets/React%20Router%20Logo/Light.png",
        description: "Handles client-side navigation within the app.",
        category: "Frontend",
    },
    {
        name: "Tailwind CSS",
        logo: "https://cdn.worldvectorlogo.com/logos/tailwindcss.svg",
        description: "Styles our app with utility-first CSS for rapid UI development.",
        category: "Frontend",
    },
    {
        name: "Formik",
        logo: "https://static-00.iconduck.com/assets.00/formik-icon-2048x2048-zq3mhew8.png",
        description: "Manages complex form state and submissions efficiently.",
        category: "Frontend",
    },
    // {
    //     name: "Yup",
    //     logo: yupLogoPlaceholder, // Using placeholder - replace if possible
    //     description: "Ensures robust schema-based form validation.",
    //     category: "Frontend",
    // },
    {
        name: "Axios",
        logo: "https://cdn.worldvectorlogo.com/logos/axios.svg",
        description: "Handles asynchronous HTTP requests to our backend API.",
        category: "Frontend",
    },
    {
        name: "CKEditor",
        logo: "https://cdnlogo.com/logos/c/59/ckeditor-wordmark.svg",
        description: "Enables rich text editing for user-generated content.",
        category: "Frontend",
    },
    {
        name: "FontAwesome", // Added based on your component code
        logo: "https://cdn.worldvectorlogo.com/logos/fontawesome-1.svg",
        description: "Provides scalable vector icons for the UI.",
        category: "Frontend",
    },

    // --- Backend ---
    {
        name: "Python", // Added - Core language
        logo: "https://cdn.worldvectorlogo.com/logos/python-5.svg",
        description: "The core programming language for our backend logic.",
        category: "Backend",
    },
    {
        name: "FastAPI",
        logo: "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png",
        description: "Powers our backend with high-performance, asynchronous APIs.",
        category: "Backend",
    },
    {
        name: "SQLAlchemy", // Added from requirements.txt
        logo: "https://cdn.worldvectorlogo.com/logos/sqlalchemy.svg",
        description: "Interacts with our PostgreSQL database using ORM patterns.",
        category: "Backend",
    },
    {
        name: "Pydantic", // Added from requirements.txt
        logo: "https://docs.pydantic.dev/latest/logo.png", // Found official logo
        description: "Handles data validation and settings management.",
        category: "Backend",
    },
    {
        name: "Celery", // Added from requirements.txt
        logo: "https://docs.celeryq.dev/en/stable/_static/celery_512.png", // Found official logo
        description: "Manages background tasks and asynchronous operations.",
        category: "Backend",
    },
    {
        name: "NumPy",
        logo: "https://cdn.worldvectorlogo.com/logos/numpy-1.svg",
        description: "Supports numerical operations, especially for ML features.",
        category: "Backend", // Re-categorized as primarily backend computation tool
    },
    {
        name: "Scikit-learn (Sklearn)", // Expanded name
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Scikit_learn_logo_small.svg",
        description: "Provides tools for machine learning models and data analysis.",
        category: "Backend", // Re-categorized as primarily backend computation tool
    },

    // --- Database ---
    {
        name: "PostgreSQL",
        logo: "https://cdn.worldvectorlogo.com/logos/postgresql.svg",
        description: "Stores our relational data reliably.",
        category: "Database",
    },
    {
        name: "Redis", // Added from requirements.txt
        logo: "https://cdn.worldvectorlogo.com/logos/redis.svg",
        description: "Used for caching and potentially as a message broker for Celery.",
        category: "Database",
    },
    {
        name: "AWS RDS",
        logo: "https://cdn.worldvectorlogo.com/logos/aws-rds.svg",
        description: "Managed relational database service hosting our PostgreSQL.",
        category: "Cloud / Infrastructure", // Re-categorized
    },
    // --- Consider adding if still used ---
    /*
    {
        name: "MongoDB", // Was in requirements.txt (via mongoengine)
        logo: "https://cdn.worldvectorlogo.com/logos/mongodb-icon-1.svg",
        description: "Stores flexible, NoSQL data (if applicable).",
        category: "Database",
    }, */
    {
        name: "Elasticsearch", // Was in requirements.txt
        logo: "https://cdn.worldvectorlogo.com/logos/elasticsearch.svg",
        description: "Powers advanced search features (if applicable).",
        category: "Database",
    },

    // --- DevOps / Build ---
    {
        name: "Vite",
        logo: "https://cdn.worldvectorlogo.com/logos/vitejs.svg",
        description: "Fast frontend build tool and development server.",
        category: "DevOps / Build", // Consolidated category
    },
    {
        name: "Docker",
        logo: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/97_Docker_logo_logos-512.png",
        description: "Containerizes the application for consistent environments.",
        category: "DevOps / Build",
    },
    {
        name: "Alembic", // Added from requirements.txt
        logo: "https://avatars.githubusercontent.com/u/1066203?s=200&v=4", // Placeholder logo
        description: "Handles database schema migrations.",
        category: "DevOps / Build",
    },
    {
        name: "Uvicorn / Gunicorn", // Added from requirements.txt
        logo: "https://www.uvicorn.org/uvicorn.png", // Placeholder logo
        description: "ASGI/WSGI servers running the FastAPI application.",
        category: "DevOps / Build",
    },
];

export default technologies;
