#!/bin/bash

# Define colors
CYAN='\e[1;36m'
GREEN='\e[1;32m'
YELLOW='\e[1;33m'
BLUE='\e[1;34m'
NC='\e[0m' # No Color

echo -e "${CYAN}========================================================${NC}"
echo -e "${GREEN}      Starting Sales Forecasting Dashboard Services${NC}"
echo -e "${CYAN}========================================================${NC}\n"

echo -e "${YELLOW}[1/3] Starting FastAPI Backend on Port 8000...${NC}"
(cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
P1=$!

echo -e "${YELLOW}[2/3] Starting Celery ML Worker...${NC}"
(cd backend && celery -A app.worker.celery_app worker --loglevel=info --pool=solo) &
P2=$!

echo -e "${YELLOW}[3/3] Starting Next.js Frontend on Port 3000...${NC}"
(cd frontend && npm run dev) &
P3=$!

echo -e "\n${GREEN}========================================================${NC}"
echo -e "${GREEN}   Success! All services launched in the background.${NC}"
echo -e "${CYAN}========================================================${NC}"
echo -e " - ${BLUE}Frontend URL:${NC} http://localhost:3000"
echo -e " - ${BLUE}Backend API:${NC}  http://localhost:8000/docs"
echo -e "\n${YELLOW}Logs are printing below. Press Ctrl+C to stop all services.${NC}\n"

# Trap Ctrl+C to kill all background processes gracefully
trap "echo -e '\n${YELLOW}Stopping all services...${NC}'; kill $P1 $P2 $P3; exit" SIGINT

# Wait for all background processes to finish
wait
