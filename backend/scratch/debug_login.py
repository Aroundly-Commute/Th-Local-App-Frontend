import requests
import json

def test_login():
    url = "http://localhost:8000/api/auth/login"
    payload = {
        "email": "sarah.driver@ecoride.app",
        "password": "password123"
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        print(f"STATUS: {r.status_code}")
        print(f"RESPONSE: {r.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_login()
