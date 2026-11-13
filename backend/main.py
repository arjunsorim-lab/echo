from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict
import sqlite3
import json
from datetime import datetime, date
import os
import shutil
import io
import uuid
import secrets
import re
from urllib.parse import quote
from email.parser import BytesParser
from email.policy import default as email_policy

app = FastAPI(title="Echo AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use the bundled database locally and a persistent-disk path on Render.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'echo.db')
DB_PATH = os.environ.get('DB_PATH', DEFAULT_DB_PATH)
UPLOADS_DIR = os.environ.get('UPLOADS_DIR', os.path.join(BASE_DIR, 'uploads'))
FRONTEND_DIST = os.environ.get(
    'FRONTEND_DIST',
    os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend', 'dist')),
)

def prepare_runtime_storage():
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    if DB_PATH != DEFAULT_DB_PATH and not os.path.exists(DB_PATH):
        shutil.copy2(DEFAULT_DB_PATH, DB_PATH)

class SQLiteConn:
    def __init__(self, path, timeout=60.0):
        self._conn = sqlite3.connect(path, timeout=timeout)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute('PRAGMA busy_timeout=30000')

    def cursor(self):
        return self._conn.cursor()

    def execute(self, sql, parameters=()):
        return self._conn.execute(sql, parameters)

    def executemany(self, sql, seq_of_parameters):
        return self._conn.executemany(sql, seq_of_parameters)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        try:
            self._conn.rollback()
        except Exception:
            pass

    def close(self):
        try:
            self._conn.close()
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        self.close()

    def __del__(self):
        self.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)

def get_db():
    return SQLiteConn(DB_PATH, timeout=60.0)

# Unified Database Initialization
def init_db():
    conn = SQLiteConn(DB_PATH, timeout=60.0)
    try:
        conn.execute('PRAGMA journal_mode=WAL')
    except Exception:
        pass
    c = conn.cursor()
    
    # 1. Patients table
    c.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT UNIQUE,
            salutation TEXT,
            first_name TEXT,
            middle_name TEXT,
            last_name TEXT,
            gender TEXT,
            age TEXT,
            age_unit TEXT DEFAULT 'Years',
            dob TEXT,
            mobile TEXT,
            phone1 TEXT,
            phone2 TEXT,
            email TEXT,
            address TEXT,
            street TEXT,
            area TEXT,
            area_po TEXT,
            taluk TEXT,
            city TEXT,
            district_city TEXT,
            state TEXT,
            pincode TEXT,
            zip_code TEXT,
            country TEXT,
            ethnic_origin TEXT,
            aadhar_number TEXT,
            abha_number TEXT,
            blood_group TEXT,
            marital_status TEXT,
            occupation TEXT,
            religion TEXT,
            nationality TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            emergency_contact_relation TEXT,
            fax TEXT,
            family_doctor TEXT,
            referred_by TEXT,
            registration_date TEXT,
            referred_by_doctor_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Keep existing seeded and Render databases compatible with the current
    # patient forms. CREATE TABLE IF NOT EXISTS does not add newly introduced
    # columns to an older database, so apply additive migrations explicitly.
    patient_columns = {
        'middle_name': 'TEXT',
        'street': 'TEXT',
        'area': 'TEXT',
        'area_po': 'TEXT',
        'taluk': 'TEXT',
        'district_city': 'TEXT',
        'zip_code': 'TEXT',
        'country': "TEXT DEFAULT 'India'",
        'ethnic_origin': 'TEXT',
        'fax': 'TEXT',
        'family_doctor': 'TEXT',
        'age_unit': "TEXT DEFAULT 'Years'",
    }
    existing_patient_columns = {
        row[1] for row in c.execute('PRAGMA table_info(patients)').fetchall()
    }
    for column, definition in patient_columns.items():
        if column not in existing_patient_columns:
            c.execute(f'ALTER TABLE patients ADD COLUMN {column} {definition}')
    
    # 2. Visits table
    c.execute('''
        CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            visit_date TEXT,
            visit_type TEXT,
            report_template_id INTEGER,
            doctor_id INTEGER,
            diagnosis TEXT,
            notes TEXT,
            referral_doctor TEXT,
            image_count INTEGER DEFAULT 0,
            avi INTEGER DEFAULT 0,
            pregnancy INTEGER DEFAULT 0,
            ob TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    ''')
    visit_columns = {row[1] for row in c.execute('PRAGMA table_info(visits)').fetchall()}
    if 'report_template_id' not in visit_columns:
        c.execute('ALTER TABLE visits ADD COLUMN report_template_id INTEGER')
    
    # 3. Scans table
    c.execute('''
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            patient_display_id TEXT,
            visit_id INTEGER,
            scan_type TEXT NOT NULL,
            scan_date TEXT,
            findings TEXT,
            conclusion TEXT,
            status TEXT DEFAULT 'pending',
            abnormal BOOLEAN DEFAULT 0,
            ambiguity BOOLEAN DEFAULT 0,
            growthAbnormality BOOLEAN DEFAULT 0,
            normal BOOLEAN DEFAULT 1,
            normalVariant BOOLEAN DEFAULT 0,
            indication TEXT,
            diagnosis TEXT,
            referralDoctor TEXT,
            primaryConsultant TEXT,
            signedByLeft TEXT,
            signedByRight TEXT,
            typedBy TEXT,
            reviewedBy TEXT,
            icdCode TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    ''')

    # Keep older seeded and Render databases compatible with the current scan
    # editor. Existing databases only contain the original core scan columns,
    # and CREATE TABLE IF NOT EXISTS does not add the newer workflow fields.
    scan_columns = {
        'patient_display_id': 'TEXT',
        'visit_id': 'INTEGER',
        'abnormal': 'BOOLEAN DEFAULT 0',
        'ambiguity': 'BOOLEAN DEFAULT 0',
        'growthAbnormality': 'BOOLEAN DEFAULT 0',
        'normal': 'BOOLEAN DEFAULT 1',
        'normalVariant': 'BOOLEAN DEFAULT 0',
        'indication': 'TEXT',
        'diagnosis': 'TEXT',
        'referralDoctor': 'TEXT',
        'primaryConsultant': 'TEXT',
        'signedByLeft': 'TEXT',
        'signedByRight': 'TEXT',
        'typedBy': 'TEXT',
        'reviewedBy': 'TEXT',
        'icdCode': 'TEXT',
    }
    existing_scan_columns = {
        row[1] for row in c.execute('PRAGMA table_info(scans)').fetchall()
    }
    for column, definition in scan_columns.items():
        if column not in existing_scan_columns:
            c.execute(f'ALTER TABLE scans ADD COLUMN {column} {definition}')

    placeholder_scan_count = c.execute(
        "SELECT COUNT(*) FROM scans WHERE patient_id = 'patient_id'"
    ).fetchone()[0]
    total_scan_count = c.execute('SELECT COUNT(*) FROM scans').fetchone()[0]
    if placeholder_scan_count == 136 and total_scan_count == 136:
        seeded_scan_patient_ids = [
            1, 2, 2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 10, 11, 11, 12, 12,
            13, 14, 15, 15, 16, 17, 17, 18, 18, 19, 20, 21, 21, 22, 23,
            24, 24, 25, 25, 26, 27, 28, 29, 29, 30, 30, 31, 32, 32, 33,
            34, 35, 36, 37, 38, 39, 39, 40, 41, 42, 43, 43, 44, 45, 45,
            46, 47, 48, 49, 50, 51, 52, 53, 54, 54, 55, 55, 56, 57, 57,
            58, 59, 60, 61, 62, 62, 63, 64, 65, 65, 66, 67, 68, 68, 69,
            70, 70, 71, 72, 73, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
            83, 84, 84, 85, 86, 86, 87, 87, 88, 88, 89, 89, 90, 91, 91,
            92, 93, 93, 94, 94, 95, 96, 97, 98, 98, 99, 99, 100,
        ]
        c.executemany(
            'UPDATE scans SET patient_id = ? WHERE id = ?',
            [(patient_id, index) for index, patient_id in enumerate(seeded_scan_patient_ids, start=1)],
        )

    c.execute('''
        UPDATE scans
        SET patient_display_id = (
            SELECT patients.patient_id
            FROM patients
            WHERE patients.id = scans.patient_id
        )
        WHERE (patient_display_id IS NULL OR patient_display_id = '' OR patient_display_id = 'patient_display_id')
          AND patient_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM patients
            WHERE patients.id = scans.patient_id
          )
    ''')
    
    # 4. Referral doctors table
    c.execute('''
        CREATE TABLE IF NOT EXISTS referral_doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            qualification TEXT,
            specialty TEXT,
            hospital TEXT,
            clinic_address TEXT,
            phone TEXT,
            email TEXT,
            registration_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 5. Custom options table
    c.execute('''
        CREATE TABLE IF NOT EXISTS custom_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            field TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 6. Lookup options table
    c.execute('''
        CREATE TABLE IF NOT EXISTS lookup_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 7. Settings table
    c.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            company_name TEXT,
            short_name TEXT,
            registration_no TEXT,
            tax_id TEXT,
            comments TEXT,
            inactive BOOLEAN DEFAULT 0,
            street TEXT,
            area TEXT,
            area_po TEXT,
            zip_code TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            phone TEXT,
            mobile TEXT,
            fax TEXT,
            email TEXT,
            id_mode TEXT DEFAULT 'Manual ID',
            prefix TEXT DEFAULT 'PAT',
            next_number INTEGER DEFAULT 1,
            pad_length INTEGER DEFAULT 6,
            auto_start BOOLEAN DEFAULT 0,
            auto_backup BOOLEAN DEFAULT 0,
            centre_name TEXT DEFAULT 'Echo Cardiology & Diagnostic Centre',
            date_format TEXT DEFAULT 'DD/MM/YYYY',
            font TEXT DEFAULT 'Arial',
            font_size TEXT DEFAULT '10',
            report_type TEXT DEFAULT 'Report only',
            normal_comments TEXT,
            imageConfig TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    settings_columns = {
        'imageConfig': 'TEXT',
    }
    existing_settings_columns = {
        row[1] for row in c.execute('PRAGMA table_info(settings)').fetchall()
    }
    for column, definition in settings_columns.items():
        if column not in existing_settings_columns:
            c.execute(f'ALTER TABLE settings ADD COLUMN {column} {definition}')
    
    # 8. Report templates table
    c.execute('''
        CREATE TABLE IF NOT EXISTS report_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            scan_type TEXT,
            layout TEXT,
            views TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 9. Clinical reports table
    c.execute('''
        CREATE TABLE IF NOT EXISTS clinical_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            visit_id TEXT,
            scan_id INTEGER,
            scan_type TEXT,
            report_title TEXT,
            findings TEXT,
            conclusion TEXT,
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    report_columns = {row[1] for row in c.execute('PRAGMA table_info(clinical_reports)').fetchall()}
    if 'visit_id' not in report_columns:
        c.execute('ALTER TABLE clinical_reports ADD COLUMN visit_id TEXT')

    c.execute('''
        CREATE TABLE IF NOT EXISTS clinical_report_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL,
            field_path TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            changed_by TEXT,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES clinical_reports(id) ON DELETE CASCADE
        )
    ''')
    
    # 10. Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            middle_name TEXT,
            initials TEXT,
            user_name TEXT UNIQUE,
            password TEXT,
            designation TEXT,
            registration_no TEXT,
            user_type TEXT DEFAULT 'Sonographer',
            mobile TEXT,
            email TEXT,
            inactive BOOLEAN DEFAULT 0,
            set_default BOOLEAN DEFAULT 0,
            signature TEXT,
            roles TEXT,
            rights TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 11. Media records table
    c.execute('''
        CREATE TABLE IF NOT EXISTS media_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            visit_id TEXT,
            name TEXT,
            type TEXT,
            size INTEGER,
            status TEXT,
            url TEXT,
            data_url TEXT,
            modality TEXT,
            sop_instance_uid TEXT,
            number_of_frames INTEGER DEFAULT 1,
            metadata TEXT,
            storage_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    media_columns = {row[1] for row in c.execute('PRAGMA table_info(media_records)').fetchall()}
    for column, definition in {
        'modality': 'TEXT',
        'sop_instance_uid': 'TEXT',
        'number_of_frames': 'INTEGER DEFAULT 1',
        'metadata': 'TEXT',
        'storage_path': 'TEXT',
    }.items():
        if column not in media_columns:
            c.execute(f'ALTER TABLE media_records ADD COLUMN {column} {definition}')

    # 12. Saved queries table
    c.execute('''
        CREATE TABLE IF NOT EXISTS saved_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            query TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup():
    prepare_runtime_storage()
    init_db()

@app.get('/api/health')
def health():
    return {"message": "Echo AI Cardiology API Server", "status": "online", "version": "1.0.0"}

# Helper Patient Data Mapper
def _map_patient_row(row):
    if not row:
        return None
    patient = dict(row)
    # Ensure bidirectional compatibility between frontend & DB fields
    patient['aadhaar_no'] = patient.get('aadhar_number') or patient.get('aadhaar_no') or ''
    patient['aadhar_number'] = patient['aadhaar_no']
    
    patient['zip_code'] = patient.get('pincode') or patient.get('zip_code') or ''
    patient['pincode'] = patient['zip_code']
    
    patient['district_city'] = patient.get('city') or patient.get('district_city') or ''
    patient['city'] = patient['district_city']
    
    patient['street'] = patient.get('address') or patient.get('street') or ''
    patient['address'] = patient['street']

    patient['middle_name'] = patient.get('middle_name') or ''
    patient['area'] = patient.get('area') or ''
    patient['area_po'] = patient.get('area_po') or ''
    patient['taluk'] = patient.get('taluk') or ''
    patient['ethnic_origin'] = patient.get('ethnic_origin') or ''
    patient['country'] = patient.get('country') or 'India'
    patient['fax'] = patient.get('fax') or ''
    patient['family_doctor'] = patient.get('family_doctor') or ''
    patient['age_unit'] = patient.get('age_unit') or 'Years'
    patient['visit_count'] = patient.get('visit_count', 0)

    return patient

# Dashboard Stats Endpoint
@app.get('/api/dashboard/stats')
def get_dashboard_stats():
    conn = get_db()
    c = conn.cursor()
    
    total_patients = c.execute('SELECT COUNT(*) FROM patients').fetchone()[0]
    total_scans = c.execute('SELECT COUNT(*) FROM scans').fetchone()[0]
    total_visits = c.execute('SELECT COUNT(*) FROM visits').fetchone()[0]
    adult_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Adult Echo"').fetchone()[0]
    fetal_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Fetal Echo"').fetchone()[0]
    pediatric_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Pediatric Echo"').fetchone()[0]
    ultrasound = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Ultrasound"').fetchone()[0]
    
    today_str = date.today().isoformat()
    todays_visits = c.execute('SELECT COUNT(*) FROM visits WHERE visit_date LIKE ?', (f"{today_str}%",)).fetchone()[0]
    upcoming_visits = c.execute('SELECT COUNT(*) FROM visits WHERE date(visit_date) > date("now")', ()).fetchone()[0]
    
    conn.close()
    
    return {
        "success": True,
        "data": {
            "total_patients": total_patients,
            "total_scans": total_scans,
            "total_visits": total_visits,
            "adult_echo": adult_echo,
            "fetal_echo": fetal_echo,
            "pediatric_echo": pediatric_echo,
            "ultrasound": ultrasound,
            "todays_visits": todays_visits,
            "upcoming_visits": upcoming_visits,
        }
    }


# Patient Endpoints
@app.get('/api/patients')
def get_patients():
    conn = get_db()
    patients = conn.execute('SELECT * FROM patients ORDER BY id DESC').fetchall()
    visit_counts = {}
    for r in conn.execute('SELECT patient_id, COUNT(*) as c FROM visits GROUP BY patient_id').fetchall():
        visit_counts[str(r['patient_id'])] = r['c']

    result = []
    for p in patients:
        row_dict = _map_patient_row(p)
        c1 = visit_counts.get(str(p['id']), 0)
        c2 = visit_counts.get(str(p['patient_id']), 0)
        row_dict['visit_count'] = c1 if str(p['id']) == str(p['patient_id']) else (c1 + c2)
        result.append(row_dict)
    conn.close()
    return {"success": True, "data": result}

@app.get('/api/patient-id-availability')
def check_patient_id_availability(patient_id: str):
    patient_id = patient_id.strip()
    if not patient_id:
        raise HTTPException(status_code=400, detail="Patient ID is required")
    conn = get_db()
    try:
        exists = conn.execute('SELECT 1 FROM patients WHERE patient_id = ?', (patient_id,)).fetchone() is not None
        return {"available": not exists}
    finally:
        conn.close()

@app.get('/api/patients/{patient_id}')
def get_patient(patient_id: str):
    conn = get_db()
    if patient_id.isdigit():
        patient = conn.execute('SELECT * FROM patients WHERE id = ? OR patient_id = ?', (int(patient_id), patient_id)).fetchone()
    else:
        patient = conn.execute('SELECT * FROM patients WHERE patient_id = ?', (patient_id,)).fetchone()
    conn.close()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "data": _map_patient_row(patient)}

def _create_patient(data: dict, conn=None):
    own_connection = conn is None
    conn = conn or get_db()
    cursor = conn.cursor()
    
    patient_id = str(data.get('patient_id') or '').strip()
    if not patient_id:
        if own_connection: conn.close()
        raise HTTPException(status_code=400, detail="Patient ID is required")
    for field, label in [('first_name', 'First name'), ('mobile', 'Mobile number'), ('email', 'Email')]:
        if not str(data.get(field) or '').strip():
            if own_connection: conn.close()
            raise HTTPException(status_code=400, detail=f"{label} is required")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", str(data['email']).strip()):
        if own_connection: conn.close()
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    duplicate = conn.execute('SELECT 1 FROM patients WHERE patient_id = ?', (patient_id,)).fetchone()
    if duplicate:
        if own_connection: conn.close()
        raise HTTPException(status_code=400, detail="Patient ID already exists")
    if not data.get('dob'):
        if own_connection: conn.close()
        raise HTTPException(status_code=400, detail="Date of birth is required")
    if data.get('dob'):
        try:
            dob_date = datetime.strptime(str(data['dob']), '%Y-%m-%d').date()
        except ValueError:
            if own_connection: conn.close()
            raise HTTPException(status_code=400, detail="Enter a valid date of birth")
        if dob_date > date.today():
            if own_connection: conn.close()
            raise HTTPException(status_code=400, detail="Date of birth cannot be in the future")
    if data.get('age') not in (None, ''):
        try:
            if float(data['age']) < 0:
                raise ValueError
        except (TypeError, ValueError):
            if own_connection: conn.close()
            raise HTTPException(status_code=400, detail="Age must be a non-negative number")
    
    salutation = data.get('salutation', '')
    first_name = data.get('first_name', '')
    middle_name = data.get('middle_name', '')
    last_name = data.get('last_name', '')
    gender = data.get('gender', 'M')
    age = int(data.get('age')) if data.get('age') and str(data.get('age')).isdigit() else None
    if data.get('age') not in (None, '') and age is None:
        age = str(data.get('age')).strip()
    age_unit = data.get('age_unit') or 'Years'
    dob = data.get('dob', '')
    mobile = data.get('mobile', '')
    phone1 = data.get('phone1', '')
    phone2 = data.get('phone2', '')
    email = data.get('email', '')
    street = data.get('street') or data.get('address') or ''
    area = data.get('area', '')
    area_po = data.get('area_po', '')
    taluk = data.get('taluk', '')
    city = data.get('district_city') or data.get('city') or ''
    state = data.get('state', '')
    pincode = data.get('zip_code') or data.get('pincode') or ''
    country = data.get('country', 'India')
    ethnic_origin = data.get('ethnic_origin', '')
    aadhar_number = data.get('aadhaar_no') or data.get('aadhar_number') or ''
    abha_number = data.get('abha_number', '')
    blood_group = data.get('blood_group', '')
    marital_status = data.get('marital_status', '')
    occupation = data.get('occupation', '')
    religion = data.get('religion', '')
    nationality = data.get('nationality', 'Indian')
    emergency_contact_name = data.get('emergency_contact_name', '')
    emergency_contact_phone = data.get('emergency_contact_phone', '')
    emergency_contact_relation = data.get('emergency_contact_relation', '')
    fax = data.get('fax', '')
    family_doctor = data.get('family_doctor', '')
    referred_by = data.get('referred_by', '')
    registration_date = data.get('registration_date') or datetime.now().strftime("%Y-%m-%d")
    referred_by_doctor_id = data.get('referred_by_doctor_id')
    
    try:
        cursor.execute('''
            INSERT INTO patients (
                patient_id, salutation, first_name, middle_name, last_name, gender, age, age_unit, dob,
                mobile, phone1, phone2, email, address, street, area, area_po, taluk,
                city, district_city, state, pincode, zip_code, country, ethnic_origin,
                aadhar_number, abha_number, blood_group, marital_status, occupation,
                religion, nationality, emergency_contact_name, emergency_contact_phone,
                emergency_contact_relation, fax, family_doctor, referred_by, registration_date, referred_by_doctor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patient_id, salutation, first_name, middle_name, last_name, gender, age, age_unit, dob,
            mobile, phone1, phone2, email, street, street, area, area_po, taluk,
            city, city, state, pincode, pincode, country, ethnic_origin,
            aadhar_number, abha_number, blood_group, marital_status, occupation,
            religion, nationality, emergency_contact_name, emergency_contact_phone,
            emergency_contact_relation, fax, family_doctor, referred_by, registration_date, referred_by_doctor_id
        ))
        
        new_id = cursor.lastrowid
        if own_connection: conn.commit()
        
        inserted = conn.execute('SELECT * FROM patients WHERE id = ?', (new_id,)).fetchone()
        if own_connection: conn.close()
        return {"success": True, "data": _map_patient_row(inserted)}
    except sqlite3.IntegrityError:
        if own_connection: conn.close()
        raise HTTPException(status_code=400, detail="Patient ID already exists")

@app.post('/api/patients')
def create_patient(data: dict):
    return _create_patient(data)

@app.post('/api/patient-registration')
def create_patient_registration(data: dict):
    request_id = str(data.get('request_id') or '').strip()
    visits = data.get('visits', [])
    if not request_id or not isinstance(visits, list):
        raise HTTPException(status_code=400, detail="Invalid registration request")
    conn = get_db()
    try:
        conn.execute('BEGIN IMMEDIATE')
        conn.execute('CREATE TABLE IF NOT EXISTS patient_registration_requests (request_id TEXT PRIMARY KEY, response TEXT NOT NULL)')
        existing = conn.execute('SELECT response FROM patient_registration_requests WHERE request_id = ?', (request_id,)).fetchone()
        if existing:
            conn.commit()
            return json.loads(existing['response'])
        patient = _create_patient(data.get('patient') or {}, conn)['data']
        created_visits = []
        for visit in visits:
            if not isinstance(visit, dict) or not visit.get('visit_date'):
                raise HTTPException(status_code=400, detail="Each visit must have a date")
            scan_type = visit.get('scan_type') or ''
            if not scan_type or scan_type not in ('Adult Echo', 'Fetal Echo', 'Pediatric Echo', 'Ultrasound'):
                raise HTTPException(status_code=400, detail="Each visit requires a valid scan type")
            if not str(visit.get('referral_doctor') or '').strip():
                raise HTTPException(status_code=400, detail="Each visit requires a referral doctor or institute")
            if not visit.get('report_template_id'):
                raise HTTPException(status_code=400, detail="Each visit requires a report template")
            template = conn.execute('SELECT scan_type FROM report_templates WHERE id = ?', (visit['report_template_id'],)).fetchone()
            if not template or (template['scan_type'] and template['scan_type'] != scan_type):
                raise HTTPException(status_code=400, detail="Select a valid report template for the scan type")
            cursor = conn.execute('INSERT INTO visits (patient_id, visit_date, visit_type, report_template_id, notes, referral_doctor) VALUES (?, ?, ?, ?, ?, ?)',
                (patient['id'], visit['visit_date'], visit.get('visit_type') or 'Consultation', visit.get('report_template_id') or None, visit.get('notes') or '', visit.get('referral_doctor') or ''))
            visit_id = cursor.lastrowid
            created_visits.append(dict(conn.execute('SELECT * FROM visits WHERE id = ?', (visit_id,)).fetchone()))
            if scan_type:
                conn.execute('INSERT INTO scans (patient_id, patient_display_id, visit_id, scan_type, scan_date, findings, conclusion, status, abnormal, ambiguity, growthAbnormality, normal, normalVariant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (patient['id'], patient['patient_id'], visit_id, scan_type, datetime.now().isoformat(), '', '', 'draft', 0, 0, 0, 1, 0))
        response = {'success': True, 'data': patient, 'visits': created_visits}
        conn.execute('INSERT INTO patient_registration_requests (request_id, response) VALUES (?, ?)', (request_id, json.dumps(response)))
        conn.commit()
        return response
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

@app.put('/api/patients/{patient_id}')
def update_patient(patient_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    existing = conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient not found")
    requested_patient_id = str(data.get('patient_id') or existing['patient_id']).strip()
    duplicate = conn.execute('SELECT 1 FROM patients WHERE patient_id = ? AND id != ?', (requested_patient_id, patient_id)).fetchone()
    if duplicate:
        conn.close()
        raise HTTPException(status_code=400, detail="Patient ID already exists")
    if data.get('dob'):
        try:
            dob_date = datetime.strptime(str(data['dob']), '%Y-%m-%d').date()
        except ValueError:
            conn.close()
            raise HTTPException(status_code=400, detail="Enter a valid date of birth")
        if dob_date > date.today():
            conn.close()
            raise HTTPException(status_code=400, detail="Date of birth cannot be in the future")
    
    street = data.get('street') or data.get('address') or ''
    city = data.get('district_city') or data.get('city') or ''
    pincode = data.get('zip_code') or data.get('pincode') or ''
    aadhar_number = data.get('aadhaar_no') or data.get('aadhar_number') or ''
    age = int(data.get('age')) if data.get('age') and str(data.get('age')).isdigit() else None
    if data.get('age') not in (None, '') and age is None:
        age = str(data.get('age')).strip()
    age_unit = data.get('age_unit') or 'Years'
    
    try:
        cursor.execute('''
            UPDATE patients SET
                patient_id = ?, salutation = ?, first_name = ?, middle_name = ?, last_name = ?, gender = ?,
                age = ?, age_unit = ?, dob = ?, mobile = ?, phone1 = ?, phone2 = ?, email = ?,
                address = ?, street = ?, area = ?, area_po = ?, taluk = ?, city = ?, district_city = ?,
                state = ?, pincode = ?, zip_code = ?, country = ?, ethnic_origin = ?, aadhar_number = ?,
                abha_number = ?, blood_group = ?, marital_status = ?, occupation = ?,
                religion = ?, nationality = ?, emergency_contact_name = ?,
                emergency_contact_phone = ?, emergency_contact_relation = ?, fax = ?, family_doctor = ?,
                referred_by = ?, registration_date = ?, referred_by_doctor_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            existing['patient_id'], existing['salutation'], existing['first_name'], existing['middle_name'],
            existing['last_name'], existing['gender'], existing['age'], existing['age_unit'], existing['dob'], data.get('mobile'),
            data.get('phone1'), data.get('phone2'), data.get('email'), street, street, data.get('area'),
            data.get('area_po'), data.get('taluk'), city, city, data.get('state'), pincode, pincode,
            data.get('country', 'India'), data.get('ethnic_origin'), aadhar_number, data.get('abha_number'),
            data.get('blood_group'), data.get('marital_status'), data.get('occupation'), data.get('religion'),
            data.get('nationality', 'Indian'), data.get('emergency_contact_name'), data.get('emergency_contact_phone'),
            data.get('emergency_contact_relation'), data.get('fax'), data.get('family_doctor'), data.get('referred_by'),
            data.get('registration_date'), data.get('referred_by_doctor_id'), patient_id
        ))

        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Patient not found")

        conn.commit()
        updated = conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone()
        conn.close()
        return {"success": True, "data": _map_patient_row(updated)}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Patient ID already exists")

@app.delete('/api/patients/{patient_id}')
def delete_patient(patient_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM visits WHERE patient_id = ?', (patient_id,))
    cursor.execute('DELETE FROM scans WHERE patient_id = ?', (patient_id,))
    cursor.execute('DELETE FROM patients WHERE id = ?', (patient_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Patient deleted successfully"}

# Visits Endpoints
@app.get('/api/visits')
def get_all_visits():
    conn = get_db()
    visits = conn.execute('SELECT * FROM visits ORDER BY id DESC').fetchall()
    conn.close()
    return {"success": True, "data": [dict(v) for v in visits]}

@app.get('/api/patients/{patient_id}/visits')
def get_visits(patient_id: int):
    conn = get_db()
    visits = conn.execute('SELECT * FROM visits WHERE patient_id = ? ORDER BY id DESC', (patient_id,)).fetchall()
    conn.close()
    return {"success": True, "data": [dict(v) for v in visits]}

@app.post('/api/patients/{patient_id}/visits')
def add_visit(patient_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    visit_date = data.get('visit_date') or datetime.now().isoformat()
    visit_type = data.get('visit_type', 'Consultation')
    doctor_id = data.get('doctor_id')
    diagnosis = data.get('diagnosis', '')
    notes = data.get('notes', '')
    referral_doctor = data.get('referral_doctor', '')
    image_count = int(data.get('image_count', 0)) if str(data.get('image_count', 0)).isdigit() else 0
    avi = int(data.get('avi', 0)) if str(data.get('avi', 0)).isdigit() else 0
    pregnancy = int(data.get('pregnancy', 0)) if str(data.get('pregnancy', 0)).isdigit() else 0
    ob = data.get('ob', '')
    
    cursor.execute('''
        INSERT INTO visits (patient_id, visit_date, visit_type, report_template_id, doctor_id, diagnosis, notes, referral_doctor, image_count, avi, pregnancy, ob)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (patient_id, visit_date, visit_type, data.get('report_template_id'), doctor_id, diagnosis, notes, referral_doctor, image_count, avi, pregnancy, ob))
    
    visit_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM visits WHERE id = ?', (visit_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.put('/api/patients/{patient_id}/visits/{visit_id}')
def update_visit(patient_id: int, visit_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE visits SET
            visit_date = ?, visit_type = ?, report_template_id = ?, doctor_id = ?, diagnosis = ?, notes = ?,
            referral_doctor = ?, image_count = ?, avi = ?, pregnancy = ?, ob = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND patient_id = ?
    ''', (
        data.get('visit_date'), data.get('visit_type'), data.get('report_template_id'), data.get('doctor_id'),
        data.get('diagnosis'), data.get('notes'), data.get('referral_doctor'),
        data.get('image_count', 0), data.get('avi', 0), data.get('pregnancy', 0),
        data.get('ob', ''), visit_id, patient_id
    ))
    
    conn.commit()
    updated = conn.execute('SELECT * FROM visits WHERE id = ?', (visit_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

@app.delete('/api/patients/{patient_id}/visits/{visit_id}')
def delete_visit(patient_id: int, visit_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM visits WHERE id = ? AND patient_id = ?', (visit_id, patient_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Visit deleted successfully"}

def _map_scan_row(scan_row):
    if not scan_row:
        return None
    d = dict(scan_row)
    findings = d.get('findings') or ''
    if findings.strip().startswith('{') and findings.strip().endswith('}'):
        try:
            parsed = json.loads(findings)
            if 'adult_echo_report' in parsed:
                d['adult_echo_report'] = parsed['adult_echo_report']
            elif parsed.get('scan_type') == 'Adult Echo' or d.get('scan_type') == 'Adult Echo':
                d['adult_echo_report'] = parsed

            if 'pediatric_echo_report' in parsed:
                d['pediatric_echo_report'] = parsed['pediatric_echo_report']
            elif parsed.get('scan_type') == 'Pediatric Echo' or d.get('scan_type') == 'Pediatric Echo':
                d['pediatric_echo_report'] = parsed

            if 'fetal_echo_report' in parsed:
                d['fetal_echo_report'] = parsed['fetal_echo_report']
            elif parsed.get('scan_type') == 'Fetal Echo' or d.get('scan_type') == 'Fetal Echo':
                d['fetal_echo_report'] = parsed
        except Exception:
            pass
    return d

# Scans Endpoints
@app.get('/api/scans')
def get_scans():
    conn = get_db()
    scans = conn.execute('SELECT * FROM scans ORDER BY id DESC').fetchall()
    conn.close()
    return {"success": True, "data": [_map_scan_row(s) for s in scans]}

@app.get('/api/scans/{scan_id}')
def get_scan(scan_id: int):
    conn = get_db()
    scan = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"success": True, "data": _map_scan_row(scan)}

@app.get('/api/scans/patient/{patient_id}')
def get_scans_by_patient(patient_id: int):
    conn = get_db()
    scans = conn.execute('SELECT * FROM scans WHERE patient_id = ? ORDER BY id DESC', (patient_id,)).fetchall()
    conn.close()
    return {"success": True, "data": [_map_scan_row(s) for s in scans]}

@app.post('/api/scans')
def create_scan(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    patient_id = data.get('patient_id')
    patient_display_id = data.get('patient_display_id', '')
    visit_id = data.get('visit_id')
    scan_type = data.get('scan_type', 'Adult Echo')
    scan_date = data.get('scan_date') or datetime.now().isoformat()
    findings = data.get('findings', '')
    if 'adult_echo_report' in data:
        findings = json.dumps(data['adult_echo_report'])
    elif 'pediatric_echo_report' in data:
        findings = json.dumps(data['pediatric_echo_report'])
    elif 'fetal_echo_report' in data:
        findings = json.dumps(data['fetal_echo_report'])

    conclusion = data.get('conclusion', '')
    status = data.get('status', 'draft')
    abnormal = 1 if data.get('abnormal') else 0
    ambiguity = 1 if data.get('ambiguity') else 0
    growthAbnormality = 1 if data.get('growthAbnormality') else 0
    normal = 1 if data.get('normal', True) else 0
    normalVariant = 1 if data.get('normalVariant') else 0
    indication = data.get('indication', '')
    diagnosis = data.get('diagnosis', '')
    referralDoctor = data.get('referralDoctor', '')
    primaryConsultant = data.get('primaryConsultant', '')
    signedByLeft = data.get('signedByLeft', '')
    signedByRight = data.get('signedByRight', '')
    typedBy = data.get('typedBy', '')
    reviewedBy = data.get('reviewedBy', '')
    icdCode = data.get('icdCode', '')
    
    cursor.execute('''
        INSERT INTO scans (
            patient_id, patient_display_id, visit_id, scan_type, scan_date, findings, conclusion, status,
            abnormal, ambiguity, growthAbnormality, normal, normalVariant, indication, diagnosis,
            referralDoctor, primaryConsultant, signedByLeft, signedByRight, typedBy, reviewedBy, icdCode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        patient_id, patient_display_id, visit_id, scan_type, scan_date, findings, conclusion, status,
        abnormal, ambiguity, growthAbnormality, normal, normalVariant, indication, diagnosis,
        referralDoctor, primaryConsultant, signedByLeft, signedByRight, typedBy, reviewedBy, icdCode
    ))
    
    scan_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    return {"success": True, "data": _map_scan_row(inserted)}

@app.put('/api/scans/{scan_id}')
def update_scan(scan_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    existing_scan = conn.execute('SELECT status FROM scans WHERE id = ?', (scan_id,)).fetchone()
    if not existing_scan:
        conn.close()
        raise HTTPException(status_code=404, detail="Scan not found")
    if (existing_scan['status'] or '').lower() == 'completed':
        conn.close()
        raise HTTPException(status_code=409, detail="Completed scans cannot be edited")
    
    findings = data.get('findings')
    if 'adult_echo_report' in data:
        findings = json.dumps(data['adult_echo_report'])
    elif 'pediatric_echo_report' in data:
        findings = json.dumps(data['pediatric_echo_report'])
    elif 'fetal_echo_report' in data:
        findings = json.dumps(data['fetal_echo_report'])

    cursor.execute('''
        UPDATE scans SET
            patient_id = ?, patient_display_id = ?, visit_id = ?, scan_type = ?, scan_date = ?,
            findings = COALESCE(?, findings), conclusion = ?, status = ?, abnormal = ?, ambiguity = ?,
            growthAbnormality = ?, normal = ?, normalVariant = ?, indication = ?, diagnosis = ?,
            referralDoctor = ?, primaryConsultant = ?, signedByLeft = ?, signedByRight = ?,
            typedBy = ?, reviewedBy = ?, icdCode = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        data.get('patient_id'), data.get('patient_display_id'), data.get('visit_id'),
        data.get('scan_type'), data.get('scan_date'), findings, data.get('conclusion'),
        data.get('status'), 1 if data.get('abnormal') else 0, 1 if data.get('ambiguity') else 0,
        1 if data.get('growthAbnormality') else 0, 1 if data.get('normal') else 0,
        1 if data.get('normalVariant') else 0, data.get('indication'), data.get('diagnosis'),
        data.get('referralDoctor'), data.get('primaryConsultant'), data.get('signedByLeft'),
        data.get('signedByRight'), data.get('typedBy'), data.get('reviewedBy'), data.get('icdCode'), scan_id
    ))
    
    conn.commit()
    updated = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    return {"success": True, "data": _map_scan_row(updated)}


@app.delete('/api/scans/{scan_id}')
def delete_scan(scan_id: int):
    conn = get_db()
    cursor = conn.cursor()
    existing_scan = conn.execute('SELECT status FROM scans WHERE id = ?', (scan_id,)).fetchone()
    if existing_scan and (existing_scan['status'] or '').lower() == 'completed':
        conn.close()
        raise HTTPException(status_code=409, detail="Completed scans cannot be deleted")
    cursor.execute('DELETE FROM scans WHERE id = ?', (scan_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Scan deleted successfully"}

# Referral Doctors Endpoints
@app.get('/api/referral-doctors')
def get_referral_doctors():
    conn = get_db()
    doctors = conn.execute('SELECT * FROM referral_doctors ORDER BY id DESC').fetchall()
    conn.close()
    return {"success": True, "data": [dict(d) for d in doctors]}

@app.get('/api/referral-doctors/{doctor_id}')
def get_referral_doctor(doctor_id: int):
    conn = get_db()
    doctor = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    if not doctor:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    return {"success": True, "data": dict(doctor)}

@app.post('/api/referral-doctors')
def create_referral_doctor(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO referral_doctors (name, qualification, specialty, hospital, clinic_address, phone, email, registration_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'), data.get('qualification'), data.get('specialty'), data.get('hospital'),
        data.get('clinic_address'), data.get('phone'), data.get('email'), data.get('registration_number')
    ))
    doctor_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.put('/api/referral-doctors/{doctor_id}')
def update_referral_doctor(doctor_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE referral_doctors SET
            name = ?, qualification = ?, specialty = ?, hospital = ?, clinic_address = ?,
            phone = ?, email = ?, registration_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        data.get('name'), data.get('qualification'), data.get('specialty'), data.get('hospital'),
        data.get('clinic_address'), data.get('phone'), data.get('email'), data.get('registration_number'), doctor_id
    ))
    conn.commit()
    updated = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

@app.delete('/api/referral-doctors/{doctor_id}')
def delete_referral_doctor(doctor_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM referral_doctors WHERE id = ?', (doctor_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Referral doctor deleted successfully"}

# Custom & Lookup Options Endpoints
@app.get('/api/custom-options')
def get_custom_options(field: Optional[str] = None):
    conn = get_db()
    if field:
        options = conn.execute('SELECT * FROM custom_options WHERE field = ?', (field,)).fetchall()
    else:
        options = conn.execute('SELECT * FROM custom_options').fetchall()
    conn.close()
    return {"success": True, "data": [dict(o) for o in options]}

@app.post('/api/custom-options')
def create_custom_option(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO custom_options (field, value) VALUES (?, ?)', (data.get('field'), data.get('value')))
    option_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM custom_options WHERE id = ?', (option_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.get('/api/lookup-options')
def get_lookup_options(category: Optional[str] = None):
    conn = get_db()
    if category:
        options = conn.execute('SELECT * FROM lookup_options WHERE category = ?', (category,)).fetchall()
    else:
        options = conn.execute('SELECT * FROM lookup_options').fetchall()
    conn.close()
    return {"success": True, "data": [dict(o) for o in options]}

@app.post('/api/lookup-options')
def create_lookup_option(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO lookup_options (category, value) VALUES (?, ?)', (data.get('category'), data.get('value')))
    option_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM lookup_options WHERE id = ?', (option_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

# Settings Endpoints
@app.get('/api/settings')
def get_settings():
    conn = get_db()
    settings = conn.execute('SELECT * FROM settings WHERE id = 1').fetchone()
    conn.close()
    if settings:
        res = dict(settings)
        if res.get('imageConfig') and isinstance(res['imageConfig'], str):
            try:
                res['imageConfig'] = json.loads(res['imageConfig'])
            except:
                pass
        return {"success": True, "data": res}
    return {"success": True, "data": {}}

@app.get('/api/settings/next-patient-id')
def get_next_patient_id():
    conn = get_db()
    settings = conn.execute('SELECT next_number, prefix, pad_length FROM settings WHERE id = 1').fetchone()
    if settings:
        next_num = settings['next_number']
        prefix = settings['prefix'] if settings['prefix'] is not None else 'TM'
        pad_len = settings['pad_length'] if settings['pad_length'] is not None else 6
        patient_id = f"{prefix}{str(next_num).zfill(pad_len)}"
        conn.close()
        return {"success": True, "data": {"patient_id": patient_id}}
    
    count = conn.execute('SELECT COUNT(*) FROM patients').fetchone()[0]
    patient_id = f"TM{str(count + 1).zfill(6)}"
    conn.close()
    return {"success": True, "data": {"patient_id": patient_id}}

@app.put('/api/settings')
def save_settings(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    if 'imageConfig' in data and isinstance(data['imageConfig'], dict):
        data['imageConfig'] = json.dumps(data['imageConfig'])
        
    existing = conn.execute('SELECT id FROM settings WHERE id = 1').fetchone()
    
    # Filter keys matching settings columns
    cursor.execute("PRAGMA table_info(settings)")
    valid_cols = [c[1] for c in cursor.fetchall() if c[1] != 'id']
    filtered_data = {k: v for k, v in data.items() if k in valid_cols}
    
    if existing:
        if filtered_data:
            set_clause = ', '.join([f"{key} = ?" for key in filtered_data.keys()])
            values = list(filtered_data.values())
            cursor.execute(f'UPDATE settings SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = 1', values)
    else:
        if filtered_data:
            keys = ', '.join(filtered_data.keys())
            placeholders = ', '.join(['?'] * len(filtered_data))
            values = list(filtered_data.values())
            cursor.execute(f'INSERT INTO settings (id, {keys}) VALUES (1, {placeholders})', values)
        else:
            cursor.execute('INSERT INTO settings (id) VALUES (1)')
    
    conn.commit()
    updated = conn.execute('SELECT * FROM settings WHERE id = 1').fetchone()
    conn.close()
    return {"success": True, "message": "Settings saved", "data": dict(updated) if updated else {}}

# Report Templates Endpoints
@app.get('/api/report-templates')
def get_templates():
    conn = get_db()
    templates = conn.execute('SELECT * FROM report_templates ORDER BY id DESC').fetchall()
    conn.close()
    res = []
    for t in templates:
        item = dict(t)
        if item.get('views') and isinstance(item['views'], str):
            try:
                item['views'] = json.loads(item['views'])
            except:
                pass
        res.append(item)
    return {"success": True, "data": res}

@app.post('/api/report-templates')
def create_template(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    views_json = json.dumps(data.get('views', [])) if isinstance(data.get('views'), (list, dict)) else data.get('views', '[]')
    
    cursor.execute('''
        INSERT INTO report_templates (title, scan_type, layout, views, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (data.get('title'), data.get('scan_type'), data.get('layout'), views_json, datetime.now().isoformat()))
    
    template_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM report_templates WHERE id = ?', (template_id,)).fetchone()
    conn.close()
    res = dict(inserted)
    if res.get('views') and isinstance(res['views'], str):
        try:
            res['views'] = json.loads(res['views'])
        except:
            pass
    return {"success": True, "data": res}

@app.put('/api/report-templates/{template_id}')
def update_template(template_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    views_json = json.dumps(data.get('views', [])) if isinstance(data.get('views'), (list, dict)) else data.get('views', '[]')
    
    cursor.execute('''
        UPDATE report_templates SET
            title = ?, scan_type = ?, layout = ?, views = ?, updated_at = ?
        WHERE id = ?
    ''', (data.get('title'), data.get('scan_type'), data.get('layout'), views_json, datetime.now().isoformat(), template_id))
    
    conn.commit()
    updated = conn.execute('SELECT * FROM report_templates WHERE id = ?', (template_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

@app.delete('/api/report-templates/{template_id}')
def delete_template(template_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM report_templates WHERE id = ?', (template_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Template deleted"}

# Clinical Reports Endpoints
@app.get('/api/clinical-reports')
def get_reports(patient_id: Optional[int] = Query(None), scan_type: Optional[str] = Query(None), visit_id: Optional[str] = Query(None)):
    conn = get_db()
    query = 'SELECT * FROM clinical_reports WHERE 1=1'
    params_list = []
    
    if patient_id is not None:
        query += ' AND patient_id = ?'
        params_list.append(patient_id)
    if scan_type is not None:
        query += ' AND scan_type = ?'
        params_list.append(scan_type)
    if visit_id is not None:
        query += ' AND visit_id = ?'
        params_list.append(visit_id)
    
    reports = conn.execute(query, params_list).fetchall()
    conn.close()
    rows = []
    for report in reports:
        item = dict(report)
        try:
            item['data'] = json.loads(item.get('findings') or '{}')
        except (TypeError, json.JSONDecodeError):
            item['data'] = {}
        rows.append(item)
    return {"success": True, "data": rows}

@app.get('/api/clinical-reports/{report_id}')
def get_report(report_id: int):
    conn = get_db()
    report = conn.execute('SELECT * FROM clinical_reports WHERE id = ?', (report_id,)).fetchone()
    conn.close()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    item = dict(report)
    try:
        item['data'] = json.loads(item.get('findings') or '{}')
    except (TypeError, json.JSONDecodeError):
        item['data'] = {}
    return {"success": True, "data": item}

@app.post('/api/clinical-reports')
def create_report(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO clinical_reports (patient_id, visit_id, scan_id, scan_type, report_title, findings, conclusion, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('patient_id'), data.get('visit_id'), data.get('scan_id'), data.get('scan_type'),
        data.get('report_title'), json.dumps(data.get('data', data.get('findings', {}))), data.get('conclusion'),
        data.get('status', 'draft'), datetime.now().isoformat()
    ))
    
    report_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM clinical_reports WHERE id = ?', (report_id,)).fetchone()
    conn.close()
    inserted_data = dict(inserted)
    inserted_data['data'] = json.loads(inserted_data.get('findings') or '{}')
    return {"success": True, "data": inserted_data}

@app.put('/api/clinical-reports/{report_id}')
def update_report(report_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    previous = conn.execute('SELECT * FROM clinical_reports WHERE id = ?', (report_id,)).fetchone()
    if not previous:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")
    if (previous['status'] or '').lower() == 'completed':
        conn.close()
        raise HTTPException(status_code=409, detail="Completed reports cannot be edited")
    status = data.get('status') or previous['status'] or 'Draft'
    if status.lower() not in {'draft', 'in progress', 'completed'}:
        conn.close()
        raise HTTPException(status_code=400, detail="Status must be Draft, In Progress, or Completed")
    previous_data = {}
    try:
        previous_data = json.loads(previous['findings'] or '{}')
    except (TypeError, json.JSONDecodeError):
        pass
    next_data = data.get('data', data.get('findings', {}))
    if isinstance(next_data, str):
        try:
            next_data = json.loads(next_data)
        except json.JSONDecodeError:
            next_data = {'findings': next_data}
    changed_by = data.get('changed_by') or ''

    def record_differences(old, new, prefix=''):
        if isinstance(old, dict) and isinstance(new, dict):
            for key in old.keys() | new.keys():
                path = f'{prefix}.{key}' if prefix else key
                record_differences(old.get(key), new.get(key), path)
        elif old != new:
            conn.execute(
                'INSERT INTO clinical_report_changes (report_id, field_path, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?)',
                (report_id, prefix, json.dumps(old, ensure_ascii=False), json.dumps(new, ensure_ascii=False), changed_by),
            )

    record_differences(previous_data, next_data)
    cursor.execute('''
        UPDATE clinical_reports SET
            visit_id = ?, scan_type = ?, report_title = ?, findings = ?, conclusion = ?, status = ?, updated_at = ?
        WHERE id = ?
    ''', (
        data.get('visit_id'), data.get('scan_type'), data.get('report_title'), json.dumps(next_data, ensure_ascii=False),
        data.get('conclusion'), status, datetime.now().isoformat(), report_id
    ))
    
    conn.commit()
    updated = conn.execute('SELECT * FROM clinical_reports WHERE id = ?', (report_id,)).fetchone()
    conn.close()
    updated_data = dict(updated)
    try:
        updated_data['data'] = json.loads(updated_data.get('findings') or '{}')
    except (TypeError, json.JSONDecodeError):
        updated_data['data'] = {}
    return {"success": True, "data": updated_data}

@app.get('/api/clinical-reports/{report_id}/history')
def get_report_history(report_id: int):
    conn = get_db()
    rows = conn.execute(
        'SELECT field_path, old_value, new_value, changed_by, changed_at FROM clinical_report_changes WHERE report_id = ? ORDER BY id DESC',
        (report_id,),
    ).fetchall()
    conn.close()
    return {"success": True, "data": [dict(row) for row in rows]}

@app.delete('/api/clinical-reports/{report_id}')
def delete_report(report_id: int):
    conn = get_db()
    cursor = conn.cursor()
    report = conn.execute('SELECT status FROM clinical_reports WHERE id = ?', (report_id,)).fetchone()
    if report and (report['status'] or '').lower() == 'completed':
        conn.close()
        raise HTTPException(status_code=409, detail="Completed reports cannot be deleted")
    cursor.execute('DELETE FROM clinical_reports WHERE id = ?', (report_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Report deleted"}

# Dynamic Generic Resources Endpoints (Media records, saved queries, users, etc.)
def _normalize_table_name(resource: str) -> str:
    table_map = {
        'users': 'users',
        'referral-doctors': 'referral_doctors',
        'scans': 'scans',
        'patients': 'patients',
        'visits': 'visits',
        'media-records': 'media_records',
        'media_records': 'media_records',
        'saved-queries': 'saved_queries',
        'saved_queries': 'saved_queries',
        'report-templates': 'report_templates',
        'clinical-reports': 'clinical_reports',
    }
    return table_map.get(resource, resource.replace('-', '_'))

@app.get('/api/resources/{resource}')
def list_resources(resource: str):
    conn = get_db()
    table = _normalize_table_name(resource)
    
    # Check if table exists
    check = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()
    if not check:
        conn.close()
        return {"success": True, "data": []}
    
    items = conn.execute(f'SELECT * FROM {table} ORDER BY id DESC').fetchall()
    conn.close()
    res = []
    for item in items:
        d = dict(item)
        if 'query' in d and isinstance(d['query'], str):
            try:
                d['query'] = json.loads(d['query'])
            except:
                pass
        res.append(d)
    return {"success": True, "data": res}

@app.post('/api/resources/{resource}')
def create_resource(resource: str, data: dict):
    conn = get_db()
    table = _normalize_table_name(resource)
    
    cursor = conn.cursor()
    # Check if table exists, create if saved_queries / media_records
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    if not cursor.fetchone():
        if table == 'saved_queries':
            cursor.execute('CREATE TABLE saved_queries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, query TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
        elif table == 'media_records':
            cursor.execute('CREATE TABLE media_records (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id TEXT, visit_id TEXT, name TEXT, type TEXT, size INTEGER, status TEXT, url TEXT, data_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
        else:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Resource {resource} not supported")
            
    processed_data = {}
    for k, v in data.items():
        if isinstance(v, (dict, list)):
            processed_data[k] = json.dumps(v)
        else:
            processed_data[k] = v
            
    cursor.execute(f"PRAGMA table_info({table})")
    valid_cols = [c[1] for c in cursor.fetchall() if c[1] != 'id']
    insert_data = {k: v for k, v in processed_data.items() if k in valid_cols}
    
    if not insert_data:
        conn.close()
        raise HTTPException(status_code=400, detail="No valid fields provided")
        
    keys = ', '.join(insert_data.keys())
    placeholders = ', '.join(['?'] * len(insert_data))
    values = list(insert_data.values())
    
    cursor.execute(f'INSERT INTO {table} ({keys}) VALUES ({placeholders})', values)
    item_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute(f'SELECT * FROM {table} WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    
    res = dict(inserted)
    if 'query' in res and isinstance(res['query'], str):
        try:
            res['query'] = json.loads(res['query'])
        except:
            pass
    return {"success": True, "data": res}

@app.put('/api/resources/{resource}/{item_id}')
def update_resource(resource: str, item_id: int, data: dict):
    conn = get_db()
    table = _normalize_table_name(resource)
    cursor = conn.cursor()
    
    processed_data = {}
    for k, v in data.items():
        if isinstance(v, (dict, list)):
            processed_data[k] = json.dumps(v)
        else:
            processed_data[k] = v
            
    cursor.execute(f"PRAGMA table_info({table})")
    valid_cols = [c[1] for c in cursor.fetchall() if c[1] != 'id']
    update_data = {k: v for k, v in processed_data.items() if k in valid_cols}
    
    if update_data:
        set_clause = ', '.join([f"{key} = ?" for key in update_data.keys()])
        values = list(update_data.values()) + [item_id]
        cursor.execute(f'UPDATE {table} SET {set_clause} WHERE id = ?', values)
        conn.commit()
        
    updated = conn.execute(f'SELECT * FROM {table} WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated) if updated else {}}

@app.delete('/api/resources/{resource}/{item_id}')
def delete_resource(resource: str, item_id: int):
    conn = get_db()
    table = _normalize_table_name(resource)
    cursor = conn.cursor()
    cursor.execute(f'DELETE FROM {table} WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Resource deleted successfully"}

# Media Upload Endpoint
@app.get('/api/media-records')
def get_media_records(patient_id: str = Query(...), visit_id: str = Query(...)):
    conn = get_db()
    rows = conn.execute(
        'SELECT id, patient_id, visit_id, name, type, size, status, url, modality, sop_instance_uid, number_of_frames, metadata, created_at '
        'FROM media_records WHERE patient_id=? AND visit_id=? ORDER BY id DESC',
        (patient_id, visit_id),
    ).fetchall()
    conn.close()
    result = [dict(row) for row in rows]
    for item in result:
        if item.get('metadata'):
            try:
                item['metadata'] = json.loads(item['metadata'])
            except (TypeError, json.JSONDecodeError):
                item['metadata'] = {}
    return {'success': True, 'data': result}


@app.post('/api/media-upload')
async def upload_media(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    visit_id: str = Form(...),
):
    conn = get_db()
    patient = conn.execute('SELECT id FROM patients WHERE id=?', (patient_id,)).fetchone()
    visit = conn.execute('SELECT id FROM visits WHERE id=? AND patient_id=?', (visit_id, patient_id)).fetchone()
    if not patient or not visit:
        conn.close()
        raise HTTPException(status_code=404, detail='Patient and visit must exist before importing study media.')
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail='The uploaded file is empty.')
        original_name = os.path.basename(file.filename or 'study-file')
        extension = os.path.splitext(original_name)[1].lower()
        is_dicom = extension in {'.dcm', '.dicom'} or content[128:132] == b'DICM'
        modality = ''
        sop_instance_uid = ''
        frame_count = 1
        metadata = {'original_name': original_name}
        if is_dicom:
            try:
                import pydicom
                dataset = pydicom.dcmread(io.BytesIO(content), stop_before_pixels=True, force=True)
            except ImportError:
                raise HTTPException(status_code=503, detail='DICOM import requires the pydicom package.')
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f'Invalid DICOM file: {exc}')
            modality = str(getattr(dataset, 'Modality', '') or '')
            sop_instance_uid = str(getattr(dataset, 'SOPInstanceUID', '') or '')
            frame_count = max(1, int(getattr(dataset, 'NumberOfFrames', 1) or 1))
            # Keep only non-identifying technical study metadata; patient demographics remain sourced from the app.
            metadata.update({key: str(getattr(dataset, dicom_key, '') or '') for key, dicom_key in {
                'sop_class_uid': 'SOPClassUID', 'study_instance_uid': 'StudyInstanceUID',
                'series_instance_uid': 'SeriesInstanceUID', 'rows': 'Rows', 'columns': 'Columns',
                'transfer_syntax_uid': 'file_meta',
            }.items() if dicom_key != 'file_meta'})
            metadata['transfer_syntax_uid'] = str(getattr(getattr(dataset, 'file_meta', None), 'TransferSyntaxUID', '') or '')

        os.makedirs(UPLOADS_DIR, exist_ok=True)
        stored_name = f'{uuid.uuid4().hex}{extension}'
        file_path = os.path.join(UPLOADS_DIR, stored_name)
        with open(file_path, 'wb') as buffer:
            buffer.write(content)
        rel_path = f'/uploads/{stored_name}'
        cursor = conn.execute(
            'INSERT INTO media_records (patient_id, visit_id, name, type, size, status, url, modality, sop_instance_uid, number_of_frames, metadata, storage_path) '
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            (patient_id, visit_id, original_name, file.content_type or ('application/dicom' if is_dicom else 'application/octet-stream'),
             len(content), 'Imported', rel_path, modality, sop_instance_uid, frame_count, json.dumps(metadata), file_path),
        )
        conn.commit()
        return {'success': True, 'data': {'id': cursor.lastrowid, 'patient_id': patient_id, 'visit_id': visit_id,
                'filename': original_name, 'path': rel_path, 'url': rel_path, 'modality': modality,
                'sop_instance_uid': sop_instance_uid, 'number_of_frames': frame_count, 'metadata': metadata}}
    except HTTPException:
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f'Upload failed: {str(exc)}')
    finally:
        conn.close()


@app.get('/api/media-records/{media_id}/frames/{frame_number}')
def get_media_frame(media_id: int, frame_number: int):
    conn = get_db()
    row = conn.execute('SELECT storage_path, number_of_frames FROM media_records WHERE id=?', (media_id,)).fetchone()
    conn.close()
    if not row or not row['storage_path'] or not os.path.isfile(row['storage_path']):
        raise HTTPException(status_code=404, detail='Study image not found.')
    if frame_number < 0 or frame_number >= int(row['number_of_frames'] or 1):
        raise HTTPException(status_code=404, detail='Frame number is outside this study.')
    try:
        import numpy as np
        import pydicom
        from PIL import Image
        dataset = pydicom.dcmread(row['storage_path'], force=True)
        pixels = dataset.pixel_array
        frame = pixels if pixels.ndim == 2 else pixels[frame_number]
        if frame.ndim == 3:
            if frame.shape[-1] >= 3:
                frame = frame[..., :3]
                frame = frame.astype(np.float64)
                low, high = float(np.nanmin(frame)), float(np.nanmax(frame))
                frame = np.zeros_like(frame, dtype=np.uint8) if high <= low else ((frame - low) * (255.0 / (high - low))).astype(np.uint8)
                image = Image.fromarray(frame, mode='RGB')
            else:
                frame = frame[..., 0]
                image = None
        else:
            image = None
        if image is None:
            frame = frame.astype(np.float64)
            low, high = float(np.nanmin(frame)), float(np.nanmax(frame))
            pixels8 = np.zeros_like(frame, dtype=np.uint8) if high <= low else ((frame - low) * (255.0 / (high - low))).astype(np.uint8)
            if str(getattr(dataset, 'PhotometricInterpretation', '')) == 'MONOCHROME1':
                pixels8 = 255 - pixels8
            image = Image.fromarray(pixels8, mode='L')
        output = io.BytesIO()
        image.save(output, format='PNG')
        output.seek(0)
        return StreamingResponse(output, media_type='image/png')
    except ImportError:
        raise HTTPException(status_code=503, detail='DICOM frame preview requires pydicom, numpy, and Pillow.')
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f'Unable to decode this DICOM frame: {exc}')


@app.get('/api/dicomweb/status')
def dicomweb_status():
    return {'success': True, 'configured': bool(os.environ.get('DICOMWEB_URL'))}


def _dicomweb_headers():
    headers = {'Accept': 'application/dicom+json, application/json'}
    token = os.environ.get('DICOMWEB_BEARER_TOKEN')
    if token:
        headers['Authorization'] = f'Bearer {token}'
    return headers


def _dicomweb_auth():
    if os.environ.get('DICOMWEB_USERNAME'):
        return (os.environ['DICOMWEB_USERNAME'], os.environ.get('DICOMWEB_PASSWORD', ''))
    return None


@app.get('/api/dicomweb/studies')
async def search_dicomweb_studies(patient_id: str = Query(...)):
    base_url = os.environ.get('DICOMWEB_URL', '').rstrip('/')
    if not base_url:
        raise HTTPException(status_code=503, detail='DICOMweb is not configured.')
    conn = get_db()
    patient = conn.execute('SELECT patient_id FROM patients WHERE id=?', (patient_id,)).fetchone()
    conn.close()
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found.')
    try:
        import httpx
        async with httpx.AsyncClient(timeout=45.0, follow_redirects=False) as client:
            response = await client.get(f'{base_url}/studies', params={'PatientID': patient['patient_id'], 'includefield': 'all'}, headers=_dicomweb_headers(), auth=_dicomweb_auth())
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f'DICOMweb QIDO-RS returned HTTP {response.status_code}.')
        try:
            studies = response.json()
        except ValueError:
            raise HTTPException(status_code=502, detail='DICOMweb returned an invalid QIDO-RS response.')
        return {'success': True, 'data': studies}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'DICOMweb query failed: {exc}')


@app.post('/api/dicomweb/studies/{study_uid}/import')
async def import_dicomweb_study(study_uid: str, patient_id: str = Form(...), visit_id: str = Form(...)):
    base_url = os.environ.get('DICOMWEB_URL', '').rstrip('/')
    if not base_url:
        raise HTTPException(status_code=503, detail='DICOMweb is not configured.')
    conn = get_db()
    valid_patient = conn.execute('SELECT id FROM patients WHERE id=?', (patient_id,)).fetchone()
    valid_visit = conn.execute('SELECT id FROM visits WHERE id=? AND patient_id=?', (visit_id, patient_id)).fetchone()
    conn.close()
    if not valid_patient or not valid_visit:
        raise HTTPException(status_code=404, detail='Patient and visit must exist before importing study media.')
    try:
        import httpx
        headers = _dicomweb_headers()
        headers['Accept'] = 'multipart/related; type="application/dicom"'
        encoded_uid = quote(study_uid, safe='.')
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=False) as client:
            response = await client.get(f'{base_url}/studies/{encoded_uid}', headers=headers, auth=_dicomweb_auth())
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f'DICOMweb WADO-RS returned HTTP {response.status_code}.')
        mime_header = f'Content-Type: {response.headers.get("content-type", "application/octet-stream")}\r\nMIME-Version: 1.0\r\n\r\n'.encode('latin1')
        message = BytesParser(policy=email_policy).parsebytes(mime_header + response.content)
        parts = list(message.iter_parts()) if message.is_multipart() else []
        dicom_parts = [part for part in parts if part.get_content_type() == 'application/dicom']
        if not dicom_parts:
            raise HTTPException(status_code=502, detail='DICOMweb response contained no DICOM instances.')
        import pydicom
        conn = get_db()
        stored = []
        os.makedirs(UPLOADS_DIR, exist_ok=True)
        for part in dicom_parts:
            content = part.get_payload(decode=True) or b''
            if not content:
                continue
            dataset = pydicom.dcmread(io.BytesIO(content), stop_before_pixels=True, force=True)
            original_name = f'{str(getattr(dataset, "SOPInstanceUID", "instance"))}.dcm'
            stored_name = f'{uuid.uuid4().hex}.dcm'
            file_path = os.path.join(UPLOADS_DIR, stored_name)
            with open(file_path, 'wb') as target:
                target.write(content)
            modality = str(getattr(dataset, 'Modality', '') or '')
            frame_count = max(1, int(getattr(dataset, 'NumberOfFrames', 1) or 1))
            metadata = {'sop_class_uid': str(getattr(dataset, 'SOPClassUID', '') or ''),
                        'study_instance_uid': str(getattr(dataset, 'StudyInstanceUID', '') or ''),
                        'series_instance_uid': str(getattr(dataset, 'SeriesInstanceUID', '') or ''),
                        'rows': str(getattr(dataset, 'Rows', '') or ''), 'columns': str(getattr(dataset, 'Columns', '') or '')}
            cursor = conn.execute(
                'INSERT INTO media_records (patient_id, visit_id, name, type, size, status, url, modality, sop_instance_uid, number_of_frames, metadata, storage_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (patient_id, visit_id, original_name, 'application/dicom', len(content), 'Imported from DICOMweb',
                 f'/uploads/{stored_name}', modality, str(getattr(dataset, 'SOPInstanceUID', '') or ''), frame_count, json.dumps(metadata), file_path),
            )
            stored.append({'id': cursor.lastrowid, 'name': original_name, 'modality': modality, 'number_of_frames': frame_count})
        conn.commit()
        conn.close()
        return {'success': True, 'data': stored}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'DICOMweb study import failed: {exc}')


@app.post('/api/dicomweb/studies/{media_id}')
async def send_media_to_dicomweb(media_id: int):
    base_url = os.environ.get('DICOMWEB_URL', '').rstrip('/')
    if not base_url:
        raise HTTPException(status_code=503, detail='DICOMweb is not configured. Set DICOMWEB_URL and the required PACS credentials.')
    conn = get_db()
    row = conn.execute('SELECT storage_path, name, modality FROM media_records WHERE id=?', (media_id,)).fetchone()
    conn.close()
    if not row or not row['storage_path'] or not os.path.isfile(row['storage_path']):
        raise HTTPException(status_code=404, detail='Imported study file not found.')
    if row['modality'] == '':
        raise HTTPException(status_code=415, detail='Only DICOM instances can be sent through DICOMweb.')
    try:
        import httpx
        with open(row['storage_path'], 'rb') as source:
            payload = source.read()
        boundary = 'echoai-' + secrets.token_hex(16)
        body = (f'--{boundary}\r\nContent-Type: application/dicom\r\n\r\n'.encode('ascii') + payload + f'\r\n--{boundary}--\r\n'.encode('ascii'))
        headers = _dicomweb_headers()
        headers['Content-Type'] = f'multipart/related; type="application/dicom"; boundary={boundary}'
        auth = _dicomweb_auth()
        async with httpx.AsyncClient(timeout=90.0, follow_redirects=False) as client:
            response = await client.post(f'{base_url}/studies', content=body, headers=headers, auth=auth)
        if response.status_code not in (200, 202):
            raise HTTPException(status_code=502, detail=f'DICOMweb STOW-RS rejected the study with HTTP {response.status_code}.')
        return {'success': True, 'status_code': response.status_code, 'message': 'Study sent to DICOMweb.'}
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=503, detail='DICOMweb sending requires the httpx package.')
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'DICOMweb request failed: {exc}')

app.mount('/uploads', StaticFiles(directory=UPLOADS_DIR, check_dir=False), name='uploads')

@app.get('/{full_path:path}', include_in_schema=False)
def serve_frontend(full_path: str):
    if full_path.startswith('api/'):
        raise HTTPException(status_code=404, detail='API endpoint not found')

    dist_root = os.path.realpath(FRONTEND_DIST)
    requested_path = os.path.realpath(os.path.join(dist_root, full_path))
    if requested_path.startswith(f'{dist_root}{os.sep}') and os.path.isfile(requested_path):
        return FileResponse(requested_path)

    index_path = os.path.join(dist_root, 'index.html')
    if os.path.isfile(index_path):
        return FileResponse(index_path)

    if not full_path:
        return JSONResponse({
            "message": "Echo AI Cardiology API Server",
            "status": "online",
            "version": "1.0.0",
        })
    raise HTTPException(status_code=404, detail='Frontend build not found')

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', '8002')))
