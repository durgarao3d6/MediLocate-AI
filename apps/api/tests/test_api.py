import os
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from app import main

main.engine.dispose()
from sqlalchemy import create_engine
main.engine = create_engine("sqlite+pysqlite:///:memory:",connect_args={"check_same_thread":False},poolclass=StaticPool)

def test_health_and_snapshot():
    with TestClient(main.app) as client:
        assert client.get("/health").json() == {"status":"ok"}
        response=client.get("/api/v1/catalog/snapshot")
        assert response.status_code==200
        payload=response.json()
        assert "items" in payload and "generated_at" in payload
        assert len(payload["items"])>=2

def test_search_and_location():
    with TestClient(main.app) as client:
        rows=client.get("/api/v1/medicines?q=dolo").json()
        assert rows
        med=rows[0]
        assert client.post("/api/v1/medicines/"+med["id"]+"/locations",json={"rack":"A3","shelf":"2"}).status_code==201
        updated=client.get("/api/v1/medicines?q=dolo").json()
        assert {"rack":"A3","shelf":"2"} in updated[0]["locations"]

def test_csv_import():
    with TestClient(main.app) as client:
        csv_data=b"external_id,name,strength,quantity,unit\nT100,Sample Tablet,5 mg,12,strips\n"
        response=client.post("/api/v1/imports",files={"file":("inventory.csv",csv_data,"text/csv")})
        assert response.status_code==200, response.text
        assert response.json()["imported"]==1
        assert any(x["name"]=="Sample Tablet" for x in client.get("/api/v1/catalog/snapshot").json()["items"])

def test_duplicate_ids_rejected():
    with TestClient(main.app) as client:
        csv_data=b"external_id,name\nA,One\nA,Two\n"
        response=client.post("/api/v1/imports",files={"file":("inventory.csv",csv_data,"text/csv")})
        assert response.status_code==422
