import csv
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from io import StringIO
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from rapidfuzz import fuzz
from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload

def uid(): return str(uuid4())

class Base(DeclarativeBase): pass

class Medicine(Base):
    __tablename__ = "medicines"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    external_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    strength: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    unit: Mapped[str] = mapped_column(String(40), default="units")
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    locations: Mapped[list["Location"]] = relationship(back_populates="medicine")

class Location(Base):
    __tablename__ = "locations"
    __table_args__ = (UniqueConstraint("medicine_id", "rack", "shelf"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.id"))
    rack: Mapped[str] = mapped_column(String(40))
    shelf: Mapped[str] = mapped_column(String(40))
    medicine: Mapped[Medicine] = relationship(back_populates="locations")

engine = create_engine(os.getenv("DATABASE_URL", "postgresql+psycopg://medilocate:medilocate@localhost:5432/medilocate"), pool_pre_ping=True)
def get_db():
    with Session(engine) as db: yield db

@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        if not db.scalar(select(Medicine.id).limit(1)):
            db.add_all([
                Medicine(external_id="D001",name="Dolo 650",strength="650 mg",quantity=20,unit="strips"),
                Medicine(external_id="D002",name="Cetirizine 10 mg",strength="10 mg",quantity=15,unit="strips")])
            db.commit()
    yield

app = FastAPI(title="MediLocate AI", lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173"],allow_methods=["GET","POST"],allow_headers=["*"])

def to_dict(m):
    return dict(id=m.id,name=m.name,strength=m.strength,quantity=m.quantity,unit=m.unit,
                synced_at=m.synced_at.isoformat(),
                locations=[dict(rack=x.rack,shelf=x.shelf) for x in m.locations])

@app.get("/health")
def health(): return {"status":"ok"}

@app.get("/api/v1/medicines")
def medicines(q: str="",db: Session=Depends(get_db)):
    rows=db.scalars(select(Medicine).options(selectinload(Medicine.locations)).limit(5000)).all()
    if q.strip():
        term=q.strip().lower()
        rows=[m for m in rows if term in m.name.lower() or fuzz.WRatio(term,m.name.lower())>=72]
        rows.sort(key=lambda m:fuzz.WRatio(term,m.name.lower()),reverse=True)
    return [to_dict(m) for m in rows[:100]]

from pydantic import BaseModel, Field
class LocationInput(BaseModel):
    rack: str=Field(min_length=1,max_length=40)
    shelf: str=Field(min_length=1,max_length=40)

@app.post("/api/v1/medicines/{medicine_id}/locations",status_code=201)
def set_location(medicine_id:str,value:LocationInput,db:Session=Depends(get_db)):
    med=db.get(Medicine,medicine_id)
    if med is None: raise HTTPException(404,"Medicine not found")
    rack,shelf=value.rack.strip(),value.shelf.strip()
    if not rack or not shelf: raise HTTPException(422,"Rack and shelf required")
    existing=db.scalar(select(Location).where(Location.medicine_id==medicine_id,Location.rack==rack,Location.shelf==shelf))
    if existing is None:
        db.add(Location(medicine_id=medicine_id,rack=rack,shelf=shelf))
        db.commit()
    return {"status":"saved"}

@app.post("/api/v1/imports")
async def import_inventory(file:UploadFile=File(...),db:Session=Depends(get_db)):
    if not (file.filename or "").lower().endswith(".csv"): raise HTTPException(400,"CSV required")
    content=await file.read(2_000_001)
    if len(content)>2_000_000: raise HTTPException(413,"File too large")
    try:
        reader=csv.DictReader(StringIO(content.decode("utf-8-sig")))
        if not reader.fieldnames or not {"external_id","name"}.issubset(reader.fieldnames):
            raise ValueError("Required: external_id,name")
        rows=list(reader)
        if len(rows)>10000: raise ValueError("Too many rows")
        ids=[(r.get("external_id") or "").strip() for r in rows]
        if any(not i for i in ids) or len(ids)!=len(set(ids)): raise ValueError("Invalid or duplicate ID")
        parsed=[]
        for row in rows:
            name=(row.get("name") or "").strip()
            qty=int(row.get("quantity") or 0)
            if not name or qty<0: raise ValueError("Invalid name or quantity")
            parsed.append((row,name,qty))
    except (ValueError,UnicodeError,csv.Error) as exc:
        raise HTTPException(422,"Invalid CSV: "+str(exc)) from exc
    for row,name,qty in parsed:
        med=db.scalar(select(Medicine).where(Medicine.external_id==row["external_id"].strip()))
        if med is None:
            med=Medicine(external_id=row["external_id"].strip())
            db.add(med)
        med.name=name
        med.strength=row.get("strength") or None
        med.quantity=qty
        med.unit=row.get("unit") or "units"
        med.synced_at=datetime.now(timezone.utc)
    db.commit()
    return {"imported":len(parsed)}
