CREATE TABLE supplier_profiles (id TEXT PRIMARY KEY, source_reference TEXT NOT NULL UNIQUE, supplier_reference TEXT NOT NULL UNIQUE, company_name TEXT NOT NULL, contact_name TEXT, email TEXT, phone_e164 TEXT, product_description TEXT, supply_capacity TEXT, lead_time TEXT, supply_location TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX idx_supplier_profiles_email ON supplier_profiles(email);
CREATE INDEX idx_supplier_profiles_created ON supplier_profiles(created_at DESC);
