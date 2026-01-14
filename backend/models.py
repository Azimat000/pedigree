# backend/models.py
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from .database import Base

# association table for parent-child relationships
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="researcher")  # doctor, researcher, admin
    is_active = Column(Boolean, default=True)

    patients = relationship("Patient", back_populates="created_by")

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    given_name = Column(String, nullable=False)
    family_name = Column(String, nullable=True)
    middle_name = Column(String, nullable=True)  # отчество
    dob = Column(Date, nullable=True)
    baseline_visit_date = Column(Date, nullable=True)
    snils = Column(String, nullable=True, unique=True)
    family_hyperchol = Column(Boolean, default=False)
    mutations = Column(Text, nullable=True)  # свободный ввод
    smoking = Column(Boolean, default=False)
    hypertension = Column(Boolean, default=False)
    diabetes = Column(Boolean, default=False)
    weight = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    sex = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"))

    created_by = relationship("User", back_populates="patients")
    traits = relationship("Trait", back_populates="patient", cascade="all, delete-orphan")
    relations_as_parent = relationship("Relation", back_populates="parent", foreign_keys="Relation.parent_id", cascade="all, delete-orphan")
    relations_as_child = relationship("Relation", back_populates="child", foreign_keys="Relation.child_id", cascade="all, delete-orphan")


class Relation(Base):
    __tablename__ = "relations"
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("patients.id"))
    child_id = Column(Integer, ForeignKey("patients.id"))
    relationship_type = Column(String, default="parent")  # parent/other

    parent = relationship("Patient", foreign_keys=[parent_id], back_populates="relations_as_parent")
    child = relationship("Patient", foreign_keys=[child_id], back_populates="relations_as_child")

class Trait(Base):
    __tablename__ = "traits"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., disease name, mutation
    onset_age = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="traits")

class PatientLink(Base):
    __tablename__ = "patient_links"
    id = Column(Integer, primary_key=True, index=True)
    patient1_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    patient2_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    link_type = Column(String, nullable=False)  # sibling / spouse

    patient1 = relationship("Patient", foreign_keys=[patient1_id])
    patient2 = relationship("Patient", foreign_keys=[patient2_id])

