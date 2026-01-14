-- create_tables.sql

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'researcher',
    is_active BOOLEAN DEFAULT TRUE
);

-- Таблица пациентов
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    given_name VARCHAR(255) NOT NULL,
    family_name VARCHAR(255),
    middle_name VARCHAR(255),              -- отчество
    dob DATE,                              -- дата рождения
    baseline_visit_date DATE,              -- дата базового визита
    snils VARCHAR(20) UNIQUE,              -- СНИЛС (опционально уникальный)
    sex VARCHAR(10),
    family_hyperchol BOOLEAN DEFAULT FALSE, -- семейная гиперхолестеролемия (да/нет)
    mutations TEXT,                         -- свободный ввод: мутации
    smoking BOOLEAN DEFAULT FALSE,          -- курение
    hypertension BOOLEAN DEFAULT FALSE,     -- гипертония
    diabetes BOOLEAN DEFAULT FALSE,         -- сахарный диабет
    weight NUMERIC(7,2),                    -- масса тела (кг), точность: 2 знака
    height NUMERIC(7,2),                    -- рост (см), точность: 2 знака
    notes TEXT,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Таблица отношений (родитель-ребенок)
CREATE TABLE IF NOT EXISTS relations (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'parent'
);

-- Горизонтальные(братья/сестры) и супружеские связи
CREATE TABLE IF NOT EXISTS patient_links (
    id SERIAL PRIMARY KEY,
    patient1_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient2_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL, -- sibling / spouse
    UNIQUE(patient1_id, patient2_id, link_type)
);


-- Таблица черт/трейтов (заболевания, мутации и др.)
CREATE TABLE IF NOT EXISTS traits (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    onset_age INTEGER,
    details TEXT
);
