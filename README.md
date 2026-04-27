ISTE-422 Build & Deployment Pipeline Project

Overview:
    This project focuses on setting up a full build and deployment pipeline for a web application. The goal was to automate everything from code quality checks to deployment, while making sure the app runs reliably.

    The application itself pulls address data from an external API based on user input like city, state, or zipcode.

Features:
- Address lookup using an external API
- Input validation for required fields
- Pagination support: API returns up to 1000 results per request
- Automated CI/CD pipeline
- Linting (static analysis) with failure blocking
- Unit testing with failure blocking
- Dockerized production build using nginx
- Automated deployment + health check

Tech Used:
Node.js 
npm
Docker
nginx
GitHub Actions


API URL:
https://ischool.gccis.rit.edu/addresses/

Requirements: Requests must include at least one
- city
- state
- zipcode

Getting Started (Local Development)

Installing Dependencies:
- npm install

Run the App
- npm run dev

App runs at:
http://localhost:5173

Running Tests: 
- npm test

Static Analysis (Linting):
- npm run lint

Build Project:
- The production build gets output to the /dist folder
- This is what gets deployed
    - npm run build

Docker Setup & Deployment
Build and Run
- docker-compose up --build

Access the App:
http://localhost:8080

Docker is Set Up

This project uses a multi-stage build:

Builder Stage
Uses node:18-alpine
Installs dependencies
Runs the build
Outputs files to /dist
Production Stage
Uses nginx:alpine
Copies /dist into nginx
Serves the app

CI/CD Pipeline
- The pipeline is set up to run automatically on pushes and pull requests.

What it does:
- Runs linting
    - If this fails, everything stops
- Runs unit tests
    - If tests fail, the build stops
- Builds the project
    - npm run build
- Deploys using Docker
- Run a curl command:
    - curl http://localhost:8080
    - If the curl fails, deployment is considered unsuccessful.

 
Code Documentation:
- Functions and components are commented where needed
- Any non-obvious logic is explained
- API handling and validation are documented