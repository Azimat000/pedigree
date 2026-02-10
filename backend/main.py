# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from . import models, schemas, crud, auth
from .database import SessionLocal, engine, Base
from datetime import datetime, timedelta
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Path
from typing import Optional
from fastapi import Query
from fastapi.responses import JSONResponse
import uvicorn

# create tables if not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pedigree MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # На время тестирования
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Корневой эндпоинт
@app.get("/")
def read_root():
    return {
        "message": "Pedigree MVP API",
        "version": "1.0.0",
        "service": "backend",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "endpoints": {
            "auth": {
                "register": "POST /register",
                "login": "POST /token",
                "current_user": "GET /users/me"
            },
            "patients": {
                "list": "GET /patients",
                "create": "POST /patients",
                "get": "GET /patients/{id}",
                "update": "PUT /patients/{id}",
                "delete": "DELETE /patients/{id}"
            },
            "pedigree": "GET /pedigree/{patient_id}"
        }
    }

# Health check для Render
@app.get("/health")
def health_check():
    try:
        # Проверяем подключение к базе данных
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "pedigree-backend",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "production")
    }

@app.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db, user_in)
    return user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")))
    token = auth.create_access_token(data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires)
    return {"access_token": token, "token_type": "bearer"}

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    token_data = auth.decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    user = crud.get_user_by_email(db, token_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(role: str):
    def dep(user = Depends(get_current_user)):
        if user.role != role and user.role != "admin":
            raise HTTPException(status_code=403, detail="Insufficient privileges")
        return user
    return dep

# User endpoints
@app.get("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user = Depends(get_current_user)):
    return current_user

# Patients
@app.post("/patients", response_model=schemas.PatientOut)
def create_patient(patient_in: schemas.PatientCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.create_patient(db, patient_in, current_user.id)

@app.get("/patients", response_model=List[schemas.PatientOut])
def get_patients(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Поиск по ФИО или СНИЛС"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.list_patients(db, current_user, search=search, skip=skip, limit=limit)

@app.get("/patients/{patient_id}", response_model=schemas.PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    p = crud.get_patient(db, patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p

@app.put("/patients/{patient_id}", response_model=schemas.PatientOut)
def update_patient(patient_id: int, patient_in: schemas.PatientUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_patient = crud.update_patient(db, patient_id, patient_in)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@app.delete("/patients/{patient_id}", status_code=204)
def delete_patient(patient_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    deleted = crud.delete_patient(db, patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Patient not found")
    return None


# Relations
@app.post("/relations", response_model=schemas.RelationOut)
def create_relation(rel_in: schemas.RelationCreate, db: Session = Depends(get_db), current_user=Depends(require_role("researcher"))):
    # simple validation to avoid cycles etc is omitted in MVP
    return crud.create_relation(db, rel_in)

@app.get("/relations", response_model=List[schemas.RelationOut])
def get_relations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.list_relations(db)

@app.post("/links", response_model=schemas.PatientLinkOut)
def create_link(link_in: schemas.PatientLinkCreate, db: Session = Depends(get_db), current_user=Depends(require_role("researcher"))):
    return crud.create_patient_link(db, link_in)

@app.get("/links", response_model=List[schemas.PatientLinkOut])
def get_links(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.list_patient_links(db)

@app.get("/pedigree/{patient_id}", response_model=schemas.PedigreeOut)
def get_pedigree(patient_id: int = Path(..., description="ID proband"), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    p = crud.get_patient(db, patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    pedigree = crud.build_pedigree(db, patient_id)
    return pedigree
