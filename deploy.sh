#!/bin/bash
# J's Room AI — Automated Cloud Deployment Script
# Deploys the Next.js frontend to Google Cloud Run
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Docker installed and running
#   - Environment variables set (or passed as args)
#
# Usage:
#   ./deploy.sh
#   # or with custom project:
#   GCP_PROJECT=my-project ./deploy.sh

set -euo pipefail

# ── Configuration ──
GCP_PROJECT="${GCP_PROJECT:-js-room-ai-490217}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="js-room-ai"
REPO_NAME="js-room-ai"
IMAGE_NAME="app"

# Full image path
IMAGE_URI="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${REPO_NAME}/${IMAGE_NAME}:latest"

echo "=== J's Room AI — Cloud Deployment ==="
echo "Project:  ${GCP_PROJECT}"
echo "Region:   ${GCP_REGION}"
echo "Image:    ${IMAGE_URI}"
echo ""

# ── Step 1: Ensure gcloud is configured ──
echo "[1/6] Configuring gcloud..."
gcloud config set project "${GCP_PROJECT}" --quiet

# ── Step 2: Enable required APIs ──
echo "[2/6] Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --quiet

# ── Step 3: Create Artifact Registry repo (if not exists) ──
echo "[3/6] Ensuring Artifact Registry repository..."
gcloud artifacts repositories describe "${REPO_NAME}" \
  --location="${GCP_REGION}" --quiet 2>/dev/null || \
gcloud artifacts repositories create "${REPO_NAME}" \
  --repository-format=docker \
  --location="${GCP_REGION}" \
  --quiet

# Configure Docker auth
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

# ── Step 4: Build Docker image ──
echo "[4/6] Building Docker image..."
cd frontend
docker build \
  --build-arg NEXT_PUBLIC_GEMINI_API_KEY="${NEXT_PUBLIC_GEMINI_API_KEY}" \
  -t "${IMAGE_URI}" \
  .

# ── Step 5: Push to Artifact Registry ──
echo "[5/6] Pushing image to Artifact Registry..."
docker push "${IMAGE_URI}"

# ── Step 6: Deploy to Cloud Run ──
echo "[6/6] Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_URI}" \
  --region "${GCP_REGION}" \
  --allow-unauthenticated \
  --set-env-vars "\
NEXT_PUBLIC_GEMINI_API_KEY=${NEXT_PUBLIC_GEMINI_API_KEY},\
SERPAPI_KEY=${SERPAPI_KEY},\
UNSPLASH_ACCESS_KEY=${UNSPLASH_ACCESS_KEY}" \
  --memory 512Mi \
  --port 8080 \
  --quiet

# ── Done ──
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${GCP_REGION}" \
  --format "value(status.url)")

echo ""
echo "=== Deployment Complete ==="
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "To redeploy after code changes, just run: ./deploy.sh"
