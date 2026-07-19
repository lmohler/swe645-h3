# SWE 645 – Assignment 3: Full-Stack Student Survey App (React + FastAPI/SQLModel + MySQL + Helm)

**Author:** Lucas Mohler
**Course:** SWE 645 – Component-Based Software Development
**Institution:** George Mason University
**Live URL:** _fill in after `helm install` — see [Deploying to Kubernetes](#deploying-to-kubernetes)_

---

## What Was Built

A full-stack rebuild of the HW2 static survey form: a React single-page app talks to a FastAPI + SQLModel REST API, which persists submissions in MySQL. All CRUD operations (create, view all, edit, delete a survey) are implemented end-to-end and exposed through a documented REST API. Everything is containerized with Docker and deployed to Kubernetes with a single Helm chart — one Pod for the frontend, one for the backend, one for MySQL.

### Architecture

```
Browser
  │  HTTP (NodePort 30080)
  ▼
[frontend Pod: nginx serving the built React app]
  │  proxies /api/, /docs, /openapi.json  (in-cluster, ClusterIP)
  ▼
[backend Pod: FastAPI + SQLModel + Uvicorn]
  │  mysql+pymysql:// (ClusterIP survey-mysql:3306)
  ▼
[mysql Pod: MySQL 8.4 + PersistentVolumeClaim]
```

The browser only ever talks to the frontend's NodePort — nginx reverse-proxies API calls to the backend Service, so there's no CORS to configure in production and no separately-exposed backend port.

### Repository Structure

```
Repo/
├── backend/                # FastAPI + SQLModel REST API
│   ├── app/
│   │   ├── main.py         # app setup, CORS, DB-ready retry, /health
│   │   ├── database.py     # engine + session dependency
│   │   ├── models.py       # Survey SQLModel table
│   │   ├── schemas.py      # SurveyCreate/Update/Read
│   │   └── routers/surveys.py  # CRUD endpoints
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # React (Vite) SPA
│   ├── src/
│   │   ├── App.jsx, api.js, options.js
│   │   └── components/{SurveyForm,SurveyList}.jsx
│   ├── nginx.conf           # serves the SPA + proxies /api, /docs to backend
│   └── Dockerfile
├── helm/student-survey/     # Helm chart (Chart.yaml, values.yaml, templates/)
├── postman/student-survey.postman_collection.json
└── README.md
```

### Design Note: Navigation

The "New Survey" / "View Surveys" toggle in `App.jsx` is a plain `useState` tab switcher rather than `react-router-dom`. With only two views and no shareable per-record URLs required by the assignment, a router added a dependency without adding capability. `react-router-dom` is the more scalable choice for this app if it ever grows past two views (e.g. a distinct URL per survey for editing) — see `Link`/`useNavigate`/`useParams` in the React Router docs.

### Student Survey Fields

Matches the assignment spec exactly: first/last name, street address, city, state, zip, phone, email, and survey date (all required); "liked most about campus" as multi-select checkboxes (students, location, campus, atmosphere, dorm rooms, sports); referral source as a single choice (friends, television, internet, other); and recommendation likelihood as a single choice (Very Likely, Likely, Unlikely).

---

## Local Development (no Docker/Kubernetes required)

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt

# Quick smoke test with SQLite instead of MySQL:
set DATABASE_URL=sqlite:///./local.db      # Windows cmd; use `export` on bash/macOS
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive Swagger docs, or `http://localhost:8000/health` for a liveness check.

To run against a real local MySQL instead of SQLite, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` instead of `DATABASE_URL`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. The Vite dev server proxies `/api` to `http://127.0.0.1:8000`, so the backend above must be running first.

Both the backend CRUD endpoints and the frontend-through-proxy flow were verified locally (create → list → update → delete) before containerizing.

---

## Building & Pushing the Docker Images

```bash
# Backend
cd backend
docker build -t lmohler/survey-backend:1.0.0 .
docker push lmohler/survey-backend:1.0.0

# Frontend
cd ../frontend
docker build -t lmohler/survey-frontend:1.0.0 .
docker push lmohler/survey-frontend:1.0.0
```

Replace `lmohler` with your own Docker Hub namespace if you fork this, and update `helm/student-survey/values.yaml` (`frontend.image.repository` / `backend.image.repository`) to match.

To test either image standalone before deploying:

```bash
docker run --rm -p 8000:8000 -e DATABASE_URL=sqlite:////tmp/local.db lmohler/survey-backend:1.0.0
docker run --rm -p 8080:80 lmohler/survey-frontend:1.0.0   # /api calls will 502 until a backend is reachable
```

---

## Deploying to Kubernetes

This chart targets the same AWS EC2 + Rancher/K3s cluster used for HW2.

1. Point `kubectl`/`helm` at that cluster:

   ```bash
   export KUBECONFIG=/path/to/my-k8s-cluster.yaml   # from the HW2 submission
   kubectl get nodes                                 # sanity check
   ```

2. Open the new NodePort in the EC2 security group (alongside the existing `30007` from HW2): add an inbound rule for TCP `30080` from `0.0.0.0/0`.

3. Install the chart:

   ```bash
   cd helm
   helm install student-survey ./student-survey \
     --set backend.image.tag=1.0.0 \
     --set frontend.image.tag=1.0.0
   ```

   For production-style credentials, don't rely on the defaults in `values.yaml` — override them:

   ```bash
   helm install student-survey ./student-survey \
     --set mysql.rootPassword=<strong-password> \
     --set mysql.password=<strong-password>
   ```

4. Verify:

   ```bash
   kubectl get pods      # expect survey-frontend, survey-backend, survey-mysql all Running
   kubectl get svc survey-frontend   # confirm NodePort 30080
   ```

5. Browse to `http://<EC2-public-DNS>:30080`. Swagger docs are at the same host under `/docs`.

To roll out a new image after making changes:

```bash
helm upgrade student-survey ./student-survey --set backend.image.tag=1.0.1
```

`helm uninstall student-survey` tears the whole app down, including the MySQL PVC's claim (the underlying PV's reclaim policy determines whether the data is actually deleted).

---

## Testing with Postman

Import `postman/student-survey.postman_collection.json`. It defines a `base_url` collection variable — set it to `http://localhost:8000` while developing locally, or `http://<EC2-public-DNS>:30080` once deployed (nginx proxies `/api` through to the backend either way). The collection covers health check, create, list, get-by-id, update, and delete.

---

## REST API Reference

| Method | Path                    | Description                     |
| ------ | ----------------------- | -------------------------------- |
| GET    | `/health`               | Liveness/readiness check         |
| POST   | `/api/surveys`          | Create a survey                  |
| GET    | `/api/surveys`          | List all surveys                 |
| GET    | `/api/surveys/{id}`     | Get one survey                   |
| PUT    | `/api/surveys/{id}`     | Update a survey                  |
| DELETE | `/api/surveys/{id}`     | Delete a survey                  |

Full interactive documentation (request/response schemas) is auto-generated by FastAPI at `/docs`.

---

## Video Recording Checklist

The assignment requires a voice-over video demonstrating every part of the app. Suggested walkthrough order:

1. `kubectl get pods` — show all three Pods (frontend, backend, mysql) Running.
2. Browser: submit a new survey through the "New Survey" tab, showing client-side validation on empty/invalid fields, then a successful submission.
3. Switch to "View Surveys" — show the new row.
4. Edit that survey, change a field, save, and show the updated row.
5. Delete the survey and show it disappear from the list.
6. Open `/docs` (Swagger UI) and execute a request directly against the API.
7. Open Postman, run through the collection (create/list/update/delete) against the deployed NodePort URL.
8. Briefly show the Helm chart directory and mention `helm install`/`helm upgrade` as the deployment mechanism.
