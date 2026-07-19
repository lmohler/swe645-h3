# SWE 645 – Assignment 3: Full-Stack Student Survey App (React + FastAPI/SQLModel + MySQL + Helm)

**Author:** Lucas Mohler
**Course:** SWE 645 – Component-Based Software Development
**Institution:** George Mason University
**Live URL:** _fill in after `helm install` — see [Deploying to Kubernetes](#deploying-to-kubernetes)_

---

## What I Built

For HW3 I rebuilt my HW2 static survey form as a real full-stack app. The front end is a React single-page app, the back end is a FastAPI + SQLModel REST API, and everything gets persisted in MySQL. All four CRUD operations — create, view all, edit, and delete a survey — work end to end and are backed by a documented REST API. I containerized both halves with Docker and deploy them together with one Helm chart: a Pod for the frontend, a Pod for the backend, and a Pod for MySQL.

This particular folder, `Repo-v2`, is the version I actually pushed to GitHub and deployed from. It's the same source as my working copy, minus the local dev clutter (virtualenv, `node_modules`, a throwaway SQLite file) that has no business being in version control. See the setup guide for exactly how I got this onto my EC2 instance and running.

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

The browser only ever talks to the frontend's NodePort — nginx reverse-proxies the API calls back to the backend Service, so I don't have to deal with CORS in production, and the backend never needs its own exposed port.

### Repo Layout

```
Repo-v2/
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
│   │   └── components/{SurveyForm,SurveyList,SurveyResultsModal}.jsx
│   ├── nginx.conf           # serves the SPA + proxies /api, /docs to backend
│   └── Dockerfile
├── helm/student-survey/     # Helm chart (Chart.yaml, values.yaml, templates/)
├── postman/student-survey.postman_collection.json
└── README.md
```

### A note on why there's no React Router

The "New Survey" / "View Surveys" toggle in `App.jsx` is just a `useState` variable flipping between two components, not `react-router-dom`. I went back and forth on this, but with only two views and nothing that needs its own shareable URL, pulling in a router felt like adding a dependency for a problem I didn't have. If I ever add a dedicated URL per survey (say, for direct-linking to an edit form), `react-router-dom`'s `Link`/`useNavigate`/`useParams` would be the right call at that point.

### Survey Fields

These match the assignment spec exactly: first/last name, street address, city, state, zip, phone, email, and survey date (all required); "liked most about campus" as multi-select checkboxes (students, location, campus, atmosphere, dorm rooms, sports); referral source as a single choice (friends, television, internet, other); and recommendation likelihood as a single choice (Very Likely, Likely, Unlikely).

---

## How I Built & Pushed the Docker Images

I did this straight from my EC2 instance after cloning the repo there — see the setup guide for the full walkthrough. In short, from inside the cloned repo:

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

If you're following along with your own Docker Hub account, swap `lmohler` for your namespace everywhere, including `helm/student-survey/values.yaml` (`frontend.image.repository` / `backend.image.repository`).

To sanity-check either image on its own before touching Kubernetes:

```bash
docker run --rm -p 8000:8000 -e DATABASE_URL=sqlite:////tmp/local.db lmohler/survey-backend:1.0.0
docker run --rm -p 8080:80 lmohler/survey-frontend:1.0.0   # /api calls will 502 until a backend is reachable
```

---

## Deploying to Kubernetes

I'm running this on the same EC2 + Rancher/K3s cluster I set up for HW2, so `kubectl` and `helm` on that box are already pointed at it — no kubeconfig wrangling needed if you're doing everything from the EC2 instance like I did.

1. Confirm the cluster's reachable:

   ```bash
   kubectl get nodes
   ```

2. Open the new NodePort in the EC2 security group (this is in addition to the `30007` I already had open from HW2): inbound rule for TCP `30080` from `0.0.0.0/0`.

3. Install the chart:

   ```bash
   cd helm
   helm install student-survey ./student-survey \
     --set backend.image.tag=1.0.0 \
     --set frontend.image.tag=1.0.0
   ```

   I didn't leave the placeholder MySQL credentials in `values.yaml` for my actual deployment — I overrode them at install time instead:

   ```bash
   helm install student-survey ./student-survey \
     --set mysql.rootPassword=<strong-password> \
     --set mysql.password=<strong-password>
   ```

4. Check that it actually came up:

   ```bash
   kubectl get pods      # survey-frontend, survey-backend, survey-mysql should all be Running
   kubectl get svc survey-frontend   # confirm NodePort 30080
   ```

5. Then just browse to `http://<my-EC2-public-DNS>:30080`. Swagger docs live at the same host under `/docs`.

Rolling out a new image later is just:

```bash
helm upgrade student-survey ./student-survey --set backend.image.tag=1.0.1
```

`helm uninstall student-survey` tears the whole thing down, MySQL PVC claim included (whether the underlying data actually gets deleted depends on the PV's reclaim policy).

---

## Testing with Postman

I used my own `postman/student-survey.postman_collection.json` to verify the backend before wiring up the frontend. It has a `base_url` collection variable — point it at `http://<EC2-public-DNS>:30080` once deployed (nginx proxies `/api` through to the backend). The collection covers the health check plus full CRUD: create, list, get-by-id, update, delete.

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

FastAPI generates the full interactive docs (request/response schemas and all) at `/docs` automatically, so I didn't have to write that part up separately.

---

## What's in My Walkthrough Video

The assignment wants a voice-over video showing every part of the app working. I recorded mine in this order, which I'd recommend if you're doing the same:

1. `kubectl get pods` — all three Pods (frontend, backend, mysql) Running.
2. In the browser: submit a new survey through the "New Survey" tab, show the validation kicking in on empty/invalid fields, then a clean submission.
3. Switch to "View Surveys" and show the new row.
4. Edit that survey, change something, save, show the row updated.
5. Delete it and show it disappear from the list.
6. Open `/docs` (Swagger UI) and run a request directly against the API.
7. Open Postman and run through create/list/update/delete against the deployed NodePort URL.
8. Pull up the Helm chart directory for a few seconds and mention `helm install`/`helm upgrade` as how it actually got deployed.
