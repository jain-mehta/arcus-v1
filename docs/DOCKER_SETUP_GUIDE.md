# Docker Setup Guide for Arcus v1

**Last Updated:** October 26, 2025
**Platform:** Docker Desktop (Windows/Mac/Linux)
**Services:** PostgreSQL, Redis, MinIO (S3), Next.js App

---

## 🎯 Objective

Set up local development environment using Docker Compose with all required services.

---

## 📋 Prerequisites

- ✅ Docker Desktop installed
- ✅ 2GB free disk space
- ✅ 4GB RAM available

---

## ✅ Step 1: Verify Docker Installation

Open PowerShell and run:

```powershell
docker --version
docker ps
docker images
```

**Expected Output:**
```
Docker version 24.0.0 (or higher)
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
(empty - no containers running yet)
```

If you see errors, install Docker Desktop from https://www.docker.com/products/docker-desktop

---

## 📦 Step 2: Review Docker Compose File

The project should have `docker-compose.dev.yml` in the root. If not, we'll create it.

**Key Services:**
1. **PostgreSQL** - Control-plane database (port 5432)
2. **PostgreSQL (Tenant)** - Tenant database template (port 5433)
3. **Redis** - Caching & sessions (port 6379)
4. **MinIO** - S3-compatible storage (port 9000)
5. **Next.js App** - Your application (port 3000)

---

## 🚀 Step 3: Start Docker Compose

Navigate to project root:

```powershell
cd c:\Users\saksh\OneDrive\Desktop\Bobs_Firebase
```

Start all services:

```powershell
docker-compose -f docker-compose.dev.yml up -d
```

**What This Does:**
- Pulls images from Docker Hub (first run only, ~5 min)
- Creates containers
- Starts services
- Returns to prompt (-d = detached mode)

---

## 📊 Step 4: Monitor Startup

Check status of all containers:

```powershell
docker-compose -f docker-compose.dev.yml ps
```

**Expected Output:**
```
NAME                      STATUS              PORTS
bobs_firebase_postgres    Up 2 minutes        0.0.0.0:5432->5432/tcp
bobs_firebase_tenant_db   Up 2 minutes        0.0.0.0:5433->5433/tcp
bobs_firebase_redis       Up 2 minutes        0.0.0.0:6379->6379/tcp
bobs_firebase_minio       Up 2 minutes        0.0.0.0:9000->9000/tcp
bobs_firebase_app         Up 30 seconds       0.0.0.0:3000->3000/tcp
```

---

## 🔍 Step 5: Verify Each Service

### **5.1 PostgreSQL (Control Plane)**

```powershell
docker exec bobs_firebase_postgres psql -U postgres -d arcus_control -c "SELECT 1;"
```

**Expected Output:**
```
 ?column?
----------
        1
(1 row)
```

### **5.2 Redis**

```powershell
docker exec bobs_firebase_redis redis-cli ping
```

**Expected Output:**
```
PONG
```

### **5.3 MinIO (S3)**

Access MinIO console at: **http://localhost:9000**
- **Login:** `minioadmin` / `minioadmin`
- Should see S3 bucket list

### **5.4 Application Logs**

```powershell
docker-compose -f docker-compose.dev.yml logs -f bobs_firebase_app
```

**Look for:**
- ✅ "ready - started server on 0.0.0.0:3000"
- ❌ Any errors (will show in red)

Press `Ctrl+C` to stop viewing logs

---

## 🗄️ Step 6: Initialize Databases

### **6.1 Create Control-Plane Tables**

```powershell
docker exec bobs_firebase_postgres psql -U postgres -d arcus_control -f /app/migrations/control/20251026_init_control_tables.sql
```

**Expected Output:**
```
CREATE TABLE
(similar for each table)
```

### **6.2 Create Default Tenant Tables (Template)**

```powershell
docker exec bobs_firebase_tenant_db psql -U postgres -d tenant_template -f /app/migrations/domain/20251028_create_domain_tables.sql
```

---

## 📝 Step 7: Verify Database Setup

### **Check Control-Plane Tables**

```powershell
docker exec bobs_firebase_postgres psql -U postgres -d arcus_control -c "\dt"
```

**Expected Tables:**
```
              List of relations
 Schema |        Name        | Type  | Owner
--------+--------------------+-------+----------
 public | sessions           | table | postgres
 public | user_mappings      | table | postgres
 public | tenant_metadata    | table | postgres
 public | policy_sync_logs   | table | postgres
```

### **Check Tenant Templates**

```powershell
docker exec bobs_firebase_tenant_db psql -U postgres -d tenant_template -c "\dt"
```

**Expected Tables:**
```
 Schema |      Name       | Type  | Owner
--------+-----------------+-------+----------
 public | vendors         | table | postgres
 public | products        | table | postgres
 public | purchase_orders | table | postgres
 public | sales_orders    | table | postgres
 public | inventory       | table | postgres
 public | employees       | table | postgres
```

---

## 🧪 Step 8: Test Application Access

### **Access Web Application**

Open browser: **http://localhost:3000**

**Expected:**
- Login page loads
- No console errors
- Can access endpoints

### **Test API Endpoint**

```powershell
$headers = @{
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Headers $headers -Method Get
```

**Expected Output:**
```
StatusCode        : 200
StatusDescription : OK
Content           : {"status":"healthy"}
```

---

## 🛑 Step 9: Cleanup & Restart

### **Stop All Services**

```powershell
docker-compose -f docker-compose.dev.yml down
```

### **Stop AND Remove Volumes** (Clean slate)

```powershell
docker-compose -f docker-compose.dev.yml down -v
```

### **View Logs (Historical)**

```powershell
docker-compose -f docker-compose.dev.yml logs bobs_firebase_app --tail 100
```

### **Restart Services**

```powershell
docker-compose -f docker-compose.dev.yml restart
```

---

## 📋 Verification Checklist

- [ ] Docker Desktop installed and running
- [ ] `docker --version` works
- [ ] `docker-compose up -d` completes
- [ ] `docker-compose ps` shows all 5 services "Up"
- [ ] PostgreSQL responds to psql commands
- [ ] Redis responds to ping
- [ ] MinIO console accessible at :9000
- [ ] Application logs show "ready - started server"
- [ ] http://localhost:3000 loads
- [ ] API health check returns 200

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Docker daemon is not running" | Start Docker Desktop application |
| "Port 3000 already in use" | `docker-compose down` or kill process on port 3000 |
| "Unable to find image postgres:15" | Check internet, Docker will auto-pull |
| "connection refused" | Wait 30 seconds for DB to initialize, retry |
| "psql: command not found" | Use `docker exec` syntax shown above |
| Container exits immediately | Check logs: `docker logs container_name` |
| "Out of memory" | Increase Docker Desktop memory to 4GB+ |

---

## 🔗 Useful Commands Reference

```powershell
# Start services
docker-compose -f docker-compose.dev.yml up -d

# View status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Access PostgreSQL CLI
docker exec -it bobs_firebase_postgres psql -U postgres -d arcus_control

# Access Redis CLI
docker exec -it bobs_firebase_redis redis-cli

# Rebuild container
docker-compose -f docker-compose.dev.yml up --build

# Full reset (delete all data)
docker-compose -f docker-compose.dev.yml down -v
docker volume prune
```

---

## 📱 Accessing Services from Outside Docker

| Service | URL | Credentials |
|---------|-----|-------------|
| Next.js App | http://localhost:3000 | N/A |
| PostgreSQL | localhost:5432 | user: postgres, pass: postgres |
| Redis | localhost:6379 | N/A |
| MinIO Console | http://localhost:9000 | minioadmin / minioadmin |
| MinIO S3 API | http://localhost:9000 | (same credentials) |

---

## 🎓 Next Steps

1. ✅ Verify Docker setup with checklist above
2. ✅ Return to agent to continue development
3. ✅ Agent will use Docker containers for local testing
4. ✅ All database migrations will run in containers
5. ✅ Tests will use Docker Postgres

---

**Document Status:** ✅ Complete Docker Setup Guide
**Time to Complete:** ~10 minutes
**Next Step:** Verify all services are running, then signal agent to proceed
