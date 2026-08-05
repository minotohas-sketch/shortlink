#!/bin/bash
set -e

# ─── Couleurs ──────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Configuration ─────────────────────────────────────
ENVIRONMENT="${1:-staging}"

if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ Usage: $0 <staging|production>${NC}"
    exit 1
fi

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 Déploiement Peage - ${ENVIRONMENT}${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# ─── Vérifications ─────────────────────────────────────
echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm n'est pas installé${NC}"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler n'est pas installé, installation...${NC}"
    npm install -g wrangler
fi

# ─── Tests ─────────────────────────────────────────────
echo -e "${YELLOW}🧪 Exécution des tests...${NC}"
pnpm test || {
    echo -e "${RED}❌ Tests échoués${NC}"
    exit 1
}

# ─── Lint ──────────────────────────────────────────────
echo -e "${YELLOW}🔍 Vérification du code...${NC}"
pnpm lint || {
    echo -e "${RED}❌ Lint échoué${NC}"
    exit 1
}

# ─── TypeCheck ─────────────────────────────────────────
echo -e "${YELLOW}📝 Vérification des types...${NC}"
pnpm typecheck || {
    echo -e "${RED}❌ TypeCheck échoué${NC}"
    exit 1
}

# ─── Build ─────────────────────────────────────────────
echo -e "${YELLOW}🔨 Build...${NC}"
pnpm build || {
    echo -e "${RED}❌ Build échoué${NC}"
    exit 1
}

# ─── Database Migration ────────────────────────────────
echo -e "${YELLOW}🗄️  Migration base de données...${NC}"
cd apps/api
wrangler d1 migrations apply peage-db --env "$ENVIRONMENT" || {
    echo -e "${RED}❌ Migration échouée${NC}"
    exit 1
}
cd ../..

# ─── Déploiement API ───────────────────────────────────
echo -e "${YELLOW}📦 Déploiement API...${NC}"
cd apps/api
wrangler deploy --env "$ENVIRONMENT" || {
    echo -e "${RED}❌ Déploiement API échoué${NC}"
    exit 1
}
cd ../..

# ─── Déploiement Redirect Worker ───────────────────────
echo -e "${YELLOW}🔄 Déploiement Redirect Worker...${NC}"
cd workers/redirect-worker
wrangler deploy --env "$ENVIRONMENT" || {
    echo -e "${RED}❌ Déploiement Redirect Worker échoué${NC}"
    exit 1
}
cd ../..

# ─── Health Check ──────────────────────────────────────
echo -e "${YELLOW}🏥 Health check...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    API_URL="https://api.peage.io"
else
    API_URL="https://api-staging.peage.io"
fi

sleep 10

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Health check OK${NC}"
else
    echo -e "${RED}❌ Health check échoué (HTTP $HEALTH_CHECK)${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Déploiement ${ENVIRONMENT} terminé!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
