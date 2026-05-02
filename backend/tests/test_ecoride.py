"""EcoRide backend tests covering auth, rides, sustainability, chats, and websocket."""
import os
import time
import json
import asyncio
import pytest
import requests
import websockets

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://ce2f1b43-3007-48b7-ac6b-527fdbca1a9e.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

DRIVER = {"email": "sarah.driver@ecoride.app", "password": "password123"}
PASSENGER = {"email": "mike.rider@ecoride.app", "password": "password123"}


@pytest.fixture(scope="module")
def driver_token():
    r = requests.post(f"{API}/auth/login", json=DRIVER, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def passenger_token():
    r = requests.post(f"{API}/auth/login", json=PASSENGER, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_login_seed_driver(self):
        r = requests.post(f"{API}/auth/login", json=DRIVER, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "access_token" in body
        u = body["user"]
        assert u["email"] == DRIVER["email"]
        assert u["role"] == "driver"
        assert u["is_verified"] is True
        assert u.get("vehicle") is not None

    def test_login_seed_passenger(self):
        r = requests.post(f"{API}/auth/login", json=PASSENGER, timeout=15)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "passenger"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "sarah.driver@ecoride.app", "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_token(self, driver_token):
        r = requests.get(f"{API}/auth/me", headers=_h(driver_token))
        assert r.status_code == 200
        assert r.json()["email"] == DRIVER["email"]

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_register_and_login_new_user(self):
        email = f"TEST_user_{int(time.time())}@ecoride.app"
        payload = {"email": email, "password": "Passw0rd!", "name": "Test User", "role": "passenger"}
        r = requests.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        # verify GET /me persists
        me = requests.get(f"{API}/auth/me", headers=_h(token))
        assert me.status_code == 200
        assert me.json()["email"].lower() == email.lower()
        # duplicate registration should fail
        r2 = requests.post(f"{API}/auth/register", json=payload)
        assert r2.status_code == 400


# ---------- Rides ----------
class TestRides:
    def test_list_rides_seeded(self):
        r = requests.get(f"{API}/rides")
        assert r.status_code == 200
        rides = r.json()
        assert isinstance(rides, list)
        assert len(rides) >= 4, f"Expected >=4 seed rides, got {len(rides)}"
        # validate first ride shape
        ride = rides[0]
        for key in ["id", "driver_id", "driver_name", "origin", "destination",
                    "departure_time", "seats_available", "price_per_seat",
                    "distance_km", "co2_saved_kg"]:
            assert key in ride, f"missing {key}"

    def test_get_ride_detail(self):
        rides = requests.get(f"{API}/rides").json()
        rid = rides[0]["id"]
        r = requests.get(f"{API}/rides/{rid}")
        assert r.status_code == 200
        assert r.json()["id"] == rid

    def test_get_ride_404(self):
        r = requests.get(f"{API}/rides/nonexistent-xyz")
        assert r.status_code == 404

    def test_search_rides_by_origin(self):
        r = requests.get(f"{API}/rides", params={"q": "Berkeley"})
        assert r.status_code == 200
        results = r.json()
        assert any("Berkeley" in x["origin"] for x in results)

    def test_book_ride_persists_and_decrements_seats(self, passenger_token):
        rides = requests.get(f"{API}/rides").json()
        ride = rides[0]
        before_seats = ride["seats_available"]
        rid = ride["id"]

        r = requests.post(f"{API}/rides/{rid}/book", json={"seats": 1}, headers=_h(passenger_token))
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["chat_id"].startswith(rid + ":")

        # GET again to confirm seats decremented
        after = requests.get(f"{API}/rides/{rid}").json()
        assert after["seats_available"] == before_seats - 1


# ---------- Sustainability ----------
class TestSustainability:
    def test_sustainability_me_shape(self, passenger_token):
        r = requests.get(f"{API}/sustainability/me", headers=_h(passenger_token))
        assert r.status_code == 200
        body = r.json()
        for k in ["money_saved", "co2_saved_kg", "rides_count", "trees_equivalent"]:
            assert k in body
        assert isinstance(body["rides_count"], int)
        assert body["co2_saved_kg"] >= 0

    def test_sustainability_unauth(self):
        r = requests.get(f"{API}/sustainability/me")
        assert r.status_code == 401


# ---------- Chats ----------
class TestChats:
    def test_chats_after_booking(self, passenger_token):
        r = requests.get(f"{API}/chats", headers=_h(passenger_token))
        assert r.status_code == 200
        chats = r.json()
        assert isinstance(chats, list)
        assert len(chats) >= 1
        c = chats[0]
        for k in ["chat_id", "ride_id", "other_user", "ride_route", "last_message"]:
            assert k in c

    def test_post_and_get_messages(self, passenger_token):
        chats = requests.get(f"{API}/chats", headers=_h(passenger_token)).json()
        chat_id = chats[0]["chat_id"]
        text = f"TEST_msg_{int(time.time())}"
        r = requests.post(f"{API}/chats/{chat_id}/messages",
                          json={"text": text}, headers=_h(passenger_token))
        assert r.status_code == 200
        assert r.json()["text"] == text

        msgs = requests.get(f"{API}/chats/{chat_id}/messages", headers=_h(passenger_token)).json()
        assert any(m["text"] == text for m in msgs)


# ---------- WebSocket ----------
class TestWebSocket:
    def test_ws_broadcasts_rest_post(self, passenger_token):
        chats = requests.get(f"{API}/chats", headers=_h(passenger_token)).json()
        chat_id = chats[0]["chat_id"]
        ws_base = BASE.replace("https://", "wss://").replace("http://", "ws://")
        ws_path = f"{ws_base}/api/ws/chat/{chat_id}"

        async def runner():
            async with websockets.connect(ws_path, open_timeout=10) as ws:
                # post via REST
                text = f"TEST_ws_{int(time.time())}"
                requests.post(f"{API}/chats/{chat_id}/messages",
                              json={"text": text}, headers=_h(passenger_token))
                # wait for broadcast
                msg = await asyncio.wait_for(ws.recv(), timeout=10)
                data = json.loads(msg)
                assert data["text"] == text

        asyncio.get_event_loop().run_until_complete(runner())
