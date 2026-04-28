#!/usr/bin/env bash
# ============================================================
# RapidBase — Kubernetes Deploy Script for local kind cluster
# ============================================================
# Usage:
#   ./kubernetes/deploy.sh          → full deploy (create cluster + apply all)
#   ./kubernetes/deploy.sh apply    → apply manifests only (cluster must exist)
#   ./kubernetes/deploy.sh delete   → tear down everything
#   ./kubernetes/deploy.sh status   → show pod/service/ingress status
# ============================================================

set -euo pipefail

CLUSTER_NAME="rapidbase"
NAMESPACE="rapidbase"
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$K8S_DIR")"
CMD="${1:-full}"

# ── colours ────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERR]${NC}   $*"; exit 1; }

# ── pre-flight checks ───────────────────────────────────────
check_deps() {
  for bin in kind kubectl; do
    command -v "$bin" &>/dev/null || error "'$bin' not found. Please install it first."
  done
}

# ── cluster creation ────────────────────────────────────────
create_cluster() {
  if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    warn "kind cluster '${CLUSTER_NAME}' already exists — skipping creation."
  else
    info "Creating kind cluster '${CLUSTER_NAME}'..."
    kind create cluster \
      --name "$CLUSTER_NAME" \
      --config "$K8S_DIR/kind/config.yml"
    info "Cluster created."
  fi
  kubectl cluster-info --context "kind-${CLUSTER_NAME}"
}

# ── ingress-nginx controller ────────────────────────────────
install_ingress_nginx() {
  if kubectl get ns ingress-nginx &>/dev/null; then
    warn "ingress-nginx namespace already exists — skipping install."
    return
  fi
  info "Installing ingress-nginx controller (kind build)..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
  info "Waiting for ingress-nginx to be ready (up to 120s)..."
  kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=120s
  info "ingress-nginx is ready."
}

# ── namespace ───────────────────────────────────────────────
apply_namespace() {
  info "Applying namespace..."
  kubectl apply -f "$K8S_DIR/namespace.yml"
}

# ── postgres init-sql ConfigMap ─────────────────────────────
apply_postgres_init_sql() {
  local SQL_FILE="$ROOT_DIR/docker/postgres/init.sql"
  if [[ ! -f "$SQL_FILE" ]]; then
    warn "init.sql not found at $SQL_FILE — skipping postgres-init-sql ConfigMap."
    warn "Postgres will start without the init script."
    return
  fi
  info "Creating postgres-init-sql ConfigMap from $SQL_FILE..."
  kubectl create configmap postgres-init-sql \
    --from-file=init.sql="$SQL_FILE" \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -
}

# ── apply all manifests in dependency order ─────────────────
apply_all() {
  info "=== Applying RapidBase Kubernetes manifests ==="

  # 1. Namespace
  apply_namespace

  # 2. PostgreSQL
  info "[1/9] PostgreSQL..."
  apply_postgres_init_sql
  kubectl apply -f "$K8S_DIR/postgreDB/secrets.yml"
  kubectl apply -f "$K8S_DIR/postgreDB/configmap.yml"
  kubectl apply -f "$K8S_DIR/postgreDB/PersistentVolume.yml"
  kubectl apply -f "$K8S_DIR/postgreDB/PersistentVolumeClaims.yml"
  kubectl apply -f "$K8S_DIR/postgreDB/deployment.yml"
  kubectl apply -f "$K8S_DIR/postgreDB/service.yml"

  # 3. Redis
  info "[2/9] Redis..."
  kubectl apply -f "$K8S_DIR/redies/secrets.yml"
  kubectl apply -f "$K8S_DIR/redies/configmap.yml"
  kubectl apply -f "$K8S_DIR/redies/PersistentVolume.yml"
  kubectl apply -f "$K8S_DIR/redies/PersistentVolumeClaims.yml"
  kubectl apply -f "$K8S_DIR/redies/deployment.yml"
  kubectl apply -f "$K8S_DIR/redies/service.yml"

  # 4. Wait for Postgres and Redis to be ready before deploying services
  info "Waiting for postgres pod to be ready (up to 120s)..."
  kubectl wait --namespace="$NAMESPACE" \
    --for=condition=ready pod \
    --selector=app=postgres \
    --timeout=120s

  info "Waiting for redis pod to be ready (up to 60s)..."
  kubectl wait --namespace="$NAMESPACE" \
    --for=condition=ready pod \
    --selector=app=redis \
    --timeout=60s

  # 5. PostgREST
  info "[3/9] PostgREST..."
  kubectl apply -f "$K8S_DIR/postgrest/secrets.yml"
  kubectl apply -f "$K8S_DIR/postgrest/configmap.yml"
  kubectl apply -f "$K8S_DIR/postgrest/deployment.yml"
  kubectl apply -f "$K8S_DIR/postgrest/service.yml"

  # 6. Auth Service
  info "[4/9] Auth Service..."
  kubectl apply -f "$K8S_DIR/auth-service/secrets.yml"
  kubectl apply -f "$K8S_DIR/auth-service/configmap.yml"
  kubectl apply -f "$K8S_DIR/auth-service/deployment.yml"
  kubectl apply -f "$K8S_DIR/auth-service/service.yml"

  # 7. Project Service
  info "[5/9] Project Service..."
  kubectl apply -f "$K8S_DIR/project-service/secrets.yml"
  kubectl apply -f "$K8S_DIR/project-service/configmap.yml"
  kubectl apply -f "$K8S_DIR/project-service/deployment.yml"
  kubectl apply -f "$K8S_DIR/project-service/service.yml"

  # 8. Database Service
  info "[6/9] Database Service..."
  kubectl apply -f "$K8S_DIR/database-service/secrets.yml"
  kubectl apply -f "$K8S_DIR/database-service/configmap.yml"
  kubectl apply -f "$K8S_DIR/database-service/deployment.yml"
  kubectl apply -f "$K8S_DIR/database-service/service.yml"

  # 9. Analytics Service
  info "[7/9] Analytics Service..."
  kubectl apply -f "$K8S_DIR/analytics-service/secrets.yml"
  kubectl apply -f "$K8S_DIR/analytics-service/configmap.yml"
  kubectl apply -f "$K8S_DIR/analytics-service/deployment.yml"
  kubectl apply -f "$K8S_DIR/analytics-service/service.yml"

  # 10. Frontend
  info "[8/9] Frontend..."
  kubectl apply -f "$K8S_DIR/frontend/deployment.yml"
  kubectl apply -f "$K8S_DIR/frontend/service.yml"

  # 11. Nginx Gateway
  info "[9/9] Nginx Gateway..."
  kubectl apply -f "$K8S_DIR/nginx-gateway/deployment.yml"
  kubectl apply -f "$K8S_DIR/nginx-gateway/service.yml"

  # 12. Ingress
  info "Applying Ingress..."
  kubectl apply -f "$K8S_DIR/ingress.yml"

  info ""
  info "✅ All manifests applied."
}

# ── delete everything ───────────────────────────────────────
delete_all() {
  warn "Deleting kind cluster '${CLUSTER_NAME}'..."
  kind delete cluster --name "$CLUSTER_NAME" && info "Cluster deleted."
}

# ── status ──────────────────────────────────────────────────
show_status() {
  info "=== Pods ==="
  kubectl get pods -n "$NAMESPACE" -o wide

  info "=== Services ==="
  kubectl get svc -n "$NAMESPACE"

  info "=== Ingress ==="
  kubectl get ingress -n "$NAMESPACE"

  info "=== PVCs ==="
  kubectl get pvc -n "$NAMESPACE"
}

# ── main ────────────────────────────────────────────────────
check_deps

case "$CMD" in
  full)
    create_cluster
    install_ingress_nginx
    apply_all
    show_status
    info ""
    info "🚀 RapidBase is running. Open http://localhost in your browser."
    ;;
  apply)
    apply_all
    show_status
    ;;
  delete)
    delete_all
    ;;
  status)
    show_status
    ;;
  *)
    echo "Usage: $0 [full|apply|delete|status]"
    exit 1
    ;;
esac
