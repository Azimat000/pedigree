# backend/tests/test_main.py
import pytest
from fastapi.testclient import TestClient
from ..main import app
from ..database import Base, engine, SessionLocal
from .. import models
from sqlalchemy.orm import Session

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # WARNING: This will use the real configured DB; in production use a test DB.
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup is omitted here on purpose.

def test_register_and_login():
    email = "testuser@example.com"
    password = "testpass123"
    r = client.post("/register", json={"email": email, "password": password, "full_name": "Tester", "role": "researcher"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == email

    r2 = client.post("/token", data={"username": email, "password": password})
    assert r2.status_code == 200
    tok = r2.json()
    assert "access_token" in tok

def test_create_patient_and_relations():
    # login
    email = "testuser@example.com"
    password = "testpass123"
    r = client.post("/token", data={"username": email, "password": password})
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    p1 = client.post("/patients", json={"given_name": "John", "family_name": "Doe"}, headers=headers)
    assert p1.status_code == 200
    p2 = client.post("/patients", json={"given_name": "Jane", "family_name": "Doe"}, headers=headers)
    assert p2.status_code == 200
    id1 = p1.json()["id"]
    id2 = p2.json()["id"]
    r = client.post("/relations", json={"parent_id": id1, "child_id": id2}, headers=headers)
    assert r.status_code == 200
    rels = client.get("/relations", headers=headers)
    assert rels.status_code == 200
    assert isinstance(rels.json(), list)
