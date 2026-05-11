#!/bin/bash

echo "=========================================="
echo "PrepEase AI Study Buddy Service"
echo "=========================================="

PYTHON=python3.11

echo "Python version:"
$PYTHON --version

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "=========================================="
echo "Starting AI Service on port 8000"
echo "=========================================="
echo ""
echo "⚠️  First run will download models (~2GB)"
echo "   This may take 5-10 minutes"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000
