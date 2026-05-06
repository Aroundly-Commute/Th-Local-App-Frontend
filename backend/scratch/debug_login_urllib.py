import urllib.request
import urllib.parse
import json

def test_login():
    url = "http://localhost:8000/api/auth/login"
    data = json.dumps({
        "email": "sarah.driver@ecoride.app",
        "password": "password123"
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req, timeout=10) as f:
            print(f"STATUS: {f.status}")
            print(f"RESPONSE: {f.read().decode('utf-8')}")
    except Exception as e:
        print(f"ERROR: {e}")
        if hasattr(e, 'read'):
            print(f"RESPONSE: {e.read().decode('utf-8')}")

if __name__ == "__main__":
    test_login()
