"""
Test script for the PrepEase AI Microservice
Run: python test_service.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_ingest():
    print("\n=== Testing Ingest Endpoint ===")
    payload = {
        "materialId": "test_material_1",
        "extractedText": """
        Artificial Intelligence (AI) is the simulation of human intelligence by machines.
        Machine learning is a subset of AI that enables systems to learn from data.
        Deep learning uses neural networks with multiple layers to process information.
        Natural Language Processing (NLP) allows computers to understand human language.
        Computer vision enables machines to interpret and understand visual information.
        """
    }
    response = requests.post(f"{BASE_URL}/ingest", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_chat():
    print("\n=== Testing Chat Endpoint ===")
    payload = {
        "materialId": "test_material_1",
        "question": "What is machine learning?"
    }
    response = requests.post(f"{BASE_URL}/chat", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test with unavailable information
    print("\n--- Testing unavailable information ---")
    payload2 = {
        "materialId": "test_material_1",
        "question": "What is quantum computing?"
    }
    response2 = requests.post(f"{BASE_URL}/chat", json=payload2)
    print(f"Status: {response2.status_code}")
    print(f"Response: {response2.json()}")
    
    return response.status_code == 200

def test_quiz():
    print("\n=== Testing Quiz Generation Endpoint ===")
    payload = {
        "materialId": "test_material_1",
        "difficulty": "medium",
        "questionCount": 3
    }
    response = requests.post(f"{BASE_URL}/generate-quiz", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Generated {len(result['questions'])} questions")
    
    for i, q in enumerate(result['questions'], 1):
        print(f"\nQuestion {i}: {q['question']}")
        print(f"Options: {q['options']}")
        print(f"Correct Answer Index: {q['correctAnswer']}")
    
    return response.status_code == 200

if __name__ == "__main__":
    print("=" * 50)
    print("PrepEase AI Microservice Tests")
    print("=" * 50)
    print("\nMake sure the service is running:")
    print("uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
    print("\n" + "=" * 50)
    
    try:
        results = {
            "Health Check": test_health(),
            "Ingest Material": test_ingest(),
            "Chat/QA": test_chat(),
            "Quiz Generation": test_quiz()
        }
        
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        for test_name, passed in results.items():
            status = "✓ PASSED" if passed else "✗ FAILED"
            print(f"{test_name}: {status}")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to service.")
        print("Please start the service with:")
        print("uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
