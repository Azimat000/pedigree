# backend/schemas.py
from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List
from datetime import date
from typing import Any

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "researcher"

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    role: str

    class Config:
        orm_mode = True

# Traits (черты / заболевания / мутации как отдельные записи)
class TraitCreate(BaseModel):
    name: str
    onset_age: Optional[int] = None
    details: Optional[str] = None

class TraitOut(TraitCreate):
    id: int
    patient_id: int

    class Config:
        orm_mode = True

# Базовые поля пациента (включая новые)
class PatientBase(BaseModel):
    given_name: str
    family_name: Optional[str] = None
    middle_name: Optional[str] = None  # отчество
    dob: Optional[date] = None
    baseline_visit_date: Optional[date] = None  # дата базового визита
    # Ограничиваем формат СНИЛС как строку; при желании можно добавить валидацию через regex
    snils: Optional[str] = None
    family_hyperchol: Optional[bool] = False
    # mutations — свободный текст (ручной ввод)
    mutations: Optional[str] = None
    smoking: Optional[bool] = False
    hypertension: Optional[bool] = False
    diabetes: Optional[bool] = False
    # масса и рост — числовые (можно хранить в кг и в см)
    weight: Optional[float] = None
    height: Optional[float] = None

    sex: Optional[str] = None
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    traits: Optional[List[TraitCreate]] = []

class PatientUpdate(PatientBase):
    # Для обновления поля необязательные, при serialize будем использовать exclude_unset=True
    traits: Optional[List[TraitCreate]] = None

# Для вывода пациента вместе с отношениями и трейтами
class RelationAsParentOut(BaseModel):
    child_id: int
    relationship_type: Optional[str] = None

    class Config:
        orm_mode = True

class RelationAsChildOut(BaseModel):
    parent_id: int
    relationship_type: Optional[str] = None

    class Config:
        orm_mode = True

class PatientOut(PatientBase):
    id: int
    created_by_id: Optional[int]
    traits: List[TraitOut] = []
    relations_as_parent: List[RelationAsParentOut] = []
    relations_as_child: List[RelationAsChildOut] = []

    class Config:
        orm_mode = True

class RelationCreate(BaseModel):
    parent_id: int
    child_id: int
    relationship_type: Optional[str] = "parent"

class RelationOut(RelationCreate):
    id: int

    class Config:
        orm_mode = True

class PatientLinkCreate(BaseModel):
    patient1_id: int
    patient2_id: int
    link_type: str  # sibling / spouse

class PatientLinkOut(PatientLinkCreate):
    id: int
    class Config:
        orm_mode = True



class PedigreeNode(BaseModel):
    id: int
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    middle_name: Optional[str] = None
    dob: Optional[date] = None
    snils: Optional[str] = None
    sex: Optional[str] = None
    generation: int
    is_proband: bool = False
    family_hyperchol: Optional[bool] = False

    class Config:
        orm_mode = True

class PedigreeLink(BaseModel):
    source: int
    target: int
    type: str  # vertical / horizontal / spouse / other

class PedigreeOut(BaseModel):
    nodes: List[PedigreeNode]
    links: List[PedigreeLink]