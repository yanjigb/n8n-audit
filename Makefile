# --- Makefile for audit-n8n (Node.js / Next.js) ---
# Usage: make [target]   — run `make help` for the target list

SHELL := bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c
.DELETE_ON_ERROR:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

# --- Project ---
PROJECT  ?= $(shell node -p "require('./package.json').name" 2>/dev/null || basename $(CURDIR))
NODE_ENV ?= development

# --- Git ---
# Repo may have no tags/commits yet — fallbacks keep --warn-undefined-variables quiet.
VERSION    ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT     ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME := $(shell date -u '+%Y-%m-%dT%H:%M:%SZ')

# --- Package Manager Detection (repo ships package-lock.json → npm) ---
# Override: make PM=pnpm [target]
PM ?= $(shell \
	if [ -f bun.lockb ]; then echo "bun"; \
	elif [ -f pnpm-lock.yaml ]; then echo "pnpm"; \
	elif [ -f yarn.lock ]; then echo "yarn"; \
	else echo "npm"; fi)

PMX := $(shell \
	if [ "$(PM)" = "bun" ]; then echo "bunx"; \
	elif [ "$(PM)" = "pnpm" ]; then echo "pnpm exec"; \
	elif [ "$(PM)" = "yarn" ]; then echo "yarn"; \
	else echo "npx"; fi)

# --- Docker (image published as yanji2510/audit-n8n — see docker-compose.yml) ---
DOCKER_IMAGE ?= yanji2510/audit-n8n
DOCKER_TAG   ?= $(VERSION)
# Container port (Dockerfile EXPOSE 3000); dev server runs on 3002 locally
CONTAINER_PORT ?= 3000

# ============================================================================
.DEFAULT_GOAL := help

##@ Development

.PHONY: install
install: ## Install dependencies reproducibly from the lockfile (npm ci)
	$(PM) ci

.PHONY: dev
dev: ## Start development server (http://localhost:3002)
	$(PM) run dev

.PHONY: build
build: ## Build for production (Next.js)
	NODE_ENV=production $(PM) run build

.PHONY: start
start: ## Start production server
	NODE_ENV=production $(PM) run start

##@ Code Quality
# No test suite exists — lint + typecheck are the verification gates.

.PHONY: lint
lint: ## Run ESLint
	$(PM) run lint

.PHONY: typecheck
typecheck: ## Run TypeScript type checking (must be 0 errors)
	$(PMX) tsc --noEmit

.PHONY: check
check: lint typecheck ## Run all quality gates (lint + typecheck)

##@ Docker

.PHONY: docker-build
docker-build: ## Build production Docker image (multi-stage)
	docker build \
		-t $(DOCKER_IMAGE):$(DOCKER_TAG) \
		-t $(DOCKER_IMAGE):latest \
		.

.PHONY: docker-run
docker-run: ## Run the built image locally on port 3000
	docker run --rm -p $(CONTAINER_PORT):$(CONTAINER_PORT) $(DOCKER_IMAGE):$(DOCKER_TAG)

.PHONY: docker-push
docker-push: ## Push Docker image to the registry
	docker push $(DOCKER_IMAGE):$(DOCKER_TAG)
	docker push $(DOCKER_IMAGE):latest

.PHONY: docker-clean
docker-clean: ## Remove dangling images and stopped containers
	docker container prune -f
	docker image prune -f

##@ Docker — Compose (uses the published image)

.PHONY: docker-dev
docker-dev: ## Start services via docker compose (detached)
	docker compose up -d

.PHONY: docker-dev-down
docker-dev-down: ## Stop docker compose services
	docker compose down

.PHONY: docker-logs
docker-logs: ## Tail docker compose logs
	docker compose logs -f

##@ CI

.PHONY: ci
ci: install lint typecheck build ## Run full pipeline: install → lint → typecheck → build

##@ Cleanup

.PHONY: clean
clean: ## Remove build artifacts and caches
	rm -rf .next/ out/ coverage/ .turbo/ node_modules/.cache

.PHONY: clean-all
clean-all: clean ## Remove everything including node_modules
	rm -rf node_modules/

##@ Help

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make \033[36m<target>\033[0m\n"} \
		/^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2} \
		/^##@/ {printf "\n\033[1m%s\033[0m\n", substr($$0, 5)}' $(MAKEFILE_LIST)
