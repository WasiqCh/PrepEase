#!/bin/bash

echo "======================================"
echo "PrepEase AI Microservice Startup"
echo "======================================"

# Check if virtual environment exists
if [ ! -d "../.venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv ../.venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source ../.venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --quiet --upgrade pip
pip install -r requirements.txt

echo ""
echo "======================================"
echo "Starting FastAPI service on port 8000"
echo "======================================"
echo "Backend (Node.js) should run on port 5001"
echo ""

# Start the service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
