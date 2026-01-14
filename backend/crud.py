# backend/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash, verify_password
from datetime import datetime
from sqlalchemy import or_, func
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

# users
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed, full_name=user.full_name, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# patients
def create_patient(db: Session, patient: schemas.PatientCreate, creator_id: int):
    # если указан СНИЛС — проверяем уникальность заранее
    if patient.snils:
        existing = db.query(models.Patient).filter(models.Patient.snils == patient.snils).first()
        if existing:
            raise HTTPException(status_code=400, detail="Пациент с таким СНИЛС уже существует")

    # создаём пациента
    db_patient = models.Patient(
        given_name=patient.given_name,
        family_name=patient.family_name,
        middle_name=patient.middle_name,
        dob=patient.dob,
        baseline_visit_date=patient.baseline_visit_date,
        snils=patient.snils,
        sex=patient.sex,
        family_hyperchol=patient.family_hyperchol,
        mutations=patient.mutations,
        smoking=patient.smoking,
        hypertension=patient.hypertension,
        diabetes=patient.diabetes,
        weight=patient.weight,
        height=patient.height,
        notes=patient.notes,
        created_by_id=creator_id
    )
    db.add(db_patient)
    try:
        db.commit()
        db.refresh(db_patient)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ошибка уникальности СНИЛС")

    # добавляем traits (если есть)
    for t in patient.traits or []:
        trait = models.Trait(patient_id=db_patient.id, **t.dict())
        db.add(trait)

    db.commit()
    db.refresh(db_patient)
    return db_patient


def get_patient(db: Session, patient_id: int):
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()

def list_patients(db: Session, user, search: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Patient)

    # если не админ — фильтруем по created_by_id
    if user.role != "admin":
        query = query.filter(models.Patient.created_by_id == user.id)

    # поиск по ФИО и СНИЛС
    if search:
        like_pattern = f"%{search}%"
        query = query.filter(
            or_(
                func.concat(
                    models.Patient.family_name, ' ',
                    models.Patient.given_name, ' ',
                    func.coalesce(models.Patient.middle_name, '')
                ).ilike(like_pattern),
                models.Patient.snils.ilike(like_pattern)
            )
        )

    return query.order_by(models.Patient.id).offset(skip).limit(limit).all()

def update_patient(db: Session, patient_id: int, patient_in: schemas.PatientUpdate):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not db_patient:
        return None
    for field, value in patient_in.dict(exclude_unset=True).items():
        setattr(db_patient, field, value)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def get_patient_by_snils(db: Session, snils: str):
    if not snils:
        return None
    return db.query(models.Patient).filter(models.Patient.snils == snils).first()

def delete_patient(db: Session, patient_id: int):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not db_patient:
        return None
    db.delete(db_patient)
    db.commit()
    return True


# relations
def create_relation(db: Session, rel: schemas.RelationCreate):
    db_rel = models.Relation(parent_id=rel.parent_id, child_id=rel.child_id, relationship_type=rel.relationship_type)
    db.add(db_rel)
    db.commit()
    db.refresh(db_rel)
    return db_rel

def list_relations(db: Session):
    return db.query(models.Relation).all()

def create_patient_link(db: Session, link: schemas.PatientLinkCreate):
    db_link = models.PatientLink(
        patient1_id=link.patient1_id,
        patient2_id=link.patient2_id,
        link_type=link.link_type
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def list_patient_links(db: Session):
    return db.query(models.PatientLink).all()


# ---- pedigree builder ----
def build_pedigree(db: Session, patient_id: int, max_nodes: int = 2000):
    if not patient_id:
        return {"nodes": [], "links": []}

    relations = db.query(models.Relation).all()
    links = db.query(models.PatientLink).all()

    # --- строим общий граф связей ---
    from collections import defaultdict, deque

    adj = defaultdict(set)
    for r in relations:
        adj[r.parent_id].add(r.child_id)
        adj[r.child_id].add(r.parent_id)
    for l in links:
        adj[l.patient1_id].add(l.patient2_id)
        adj[l.patient2_id].add(l.patient1_id)

    # --- ищем всю компоненту связности ---
    component = set()
    q = deque([patient_id])
    component.add(patient_id)
    while q and len(component) < max_nodes:
        cur = q.popleft()
        for nb in adj[cur]:
            if nb not in component:
                component.add(nb)
                q.append(nb)

    # --- генерируем поколения от пробанда ---
    generation = {patient_id: 0}
    q = deque([patient_id])
    while q:
        cur = q.popleft()
        cur_gen = generation[cur]
        # родители = -1, дети = +1
        for r in relations:
            if r.child_id == cur and r.parent_id in component and r.parent_id not in generation:
                generation[r.parent_id] = cur_gen - 1
                q.append(r.parent_id)
            if r.parent_id == cur and r.child_id in component and r.child_id not in generation:
                generation[r.child_id] = cur_gen + 1
                q.append(r.child_id)
        # братья/сёстры/супруги = то же поколение
        for l in links:
            if l.patient1_id == cur and l.patient2_id in component and l.patient2_id not in generation:
                generation[l.patient2_id] = cur_gen
                q.append(l.patient2_id)
            if l.patient2_id == cur and l.patient1_id in component and l.patient1_id not in generation:
                generation[l.patient1_id] = cur_gen
                q.append(l.patient1_id)

    # --- достаём данные пациентов ---
    patients = db.query(models.Patient).filter(models.Patient.id.in_(component)).all()
    patient_by_id = {p.id: p for p in patients}

    nodes = []
    for pid in component:
        p = patient_by_id.get(pid)
        if not p:
            continue
        nodes.append({
            "id": p.id,
            "given_name": p.given_name,
            "family_name": p.family_name,
            "middle_name": p.middle_name,
            "dob": p.dob.isoformat() if p.dob else None,
            "snils": p.snils,
            "sex": p.sex,
            "generation": generation.get(pid, 0),
            "is_proband": (pid == patient_id),
            "family_hyperchol": p.family_hyperchol, 
        })

    # --- связи ---
    link_list = []
    for r in relations:
        if r.parent_id in component and r.child_id in component:
            link_list.append({"source": r.parent_id, "target": r.child_id, "type": "vertical"})
    for l in links:
        if l.patient1_id in component and l.patient2_id in component:
            lt = l.link_type.lower()
            if lt == "sibling":
                link_type = "horizontal"
            elif lt == "spouse":
                link_type = "spouse"
            else:
                link_type = lt
            link_list.append({"source": l.patient1_id, "target": l.patient2_id, "type": link_type})

    # --- убираем дубликаты ---
    seen, dedup = set(), []
    for link in link_list:
        typ = link["type"]
        a, b = link["source"], link["target"]
        if typ == "vertical":
            key = ("v", a, b)
        else:
            key = (typ, min(a, b), max(a, b))
        if key in seen:
            continue
        seen.add(key)
        dedup.append(link)

    return {"nodes": nodes, "links": dedup}

