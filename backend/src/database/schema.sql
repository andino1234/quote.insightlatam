-- Esquema de base de datos del Sistema de Cotizaciones
-- MySQL 8+. Ejecutar con: npm run db:init (ver src/database/migrate.ts)

CREATE DATABASE IF NOT EXISTS quote CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quote;

-- ==========================================================================
-- Seguridad y usuarios
-- ==========================================================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ==========================================================================
-- Geografía y monedas
-- ==========================================================================
CREATE TABLE IF NOT EXISTS currencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL,
  symbol VARCHAR(10) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  iso2 VARCHAR(2) NOT NULL UNIQUE,
  iso3 VARCHAR(3) NOT NULL UNIQUE,
  currency_id INT NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_countries_currency FOREIGN KEY (currency_id) REFERENCES currencies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  base_currency_id INT NOT NULL,
  target_currency_id INT NOT NULL,
  rate DECIMAL(18,6) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_er_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_er_base_currency FOREIGN KEY (base_currency_id) REFERENCES currencies(id),
  CONSTRAINT fk_er_target_currency FOREIGN KEY (target_currency_id) REFERENCES currencies(id),
  CONSTRAINT fk_er_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ==========================================================================
-- Clientes
-- ==========================================================================
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  legal_name VARCHAR(200) NULL,
  tax_id VARCHAR(50) NULL,
  contact_name VARCHAR(150) NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(50) NULL,
  address VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clients_country FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

-- ==========================================================================
-- Mantenimientos de costeo
-- ==========================================================================
CREATE TABLE IF NOT EXISTS phases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cost_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalog_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(60) NOT NULL UNIQUE,
  unit_label VARCHAR(60) NOT NULL DEFAULT 'unidad',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_catalog_items_category FOREIGN KEY (category_id) REFERENCES cost_categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS phase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phase_id INT NOT NULL,
  catalog_item_id INT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_phase_items_phase FOREIGN KEY (phase_id) REFERENCES phases(id),
  CONSTRAINT fk_phase_items_item FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id),
  CONSTRAINT uq_phase_item UNIQUE (phase_id, catalog_item_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS country_item_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  phase_item_id INT NOT NULL,
  unit_price_usd DECIMAL(18,4) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cip_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_cip_phase_item FOREIGN KEY (phase_item_id) REFERENCES phase_items(id),
  CONSTRAINT fk_cip_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS country_calculation_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  payment_increase_ratio DECIMAL(18,6) NULL,
  reduced_day_discount_ratio DECIMAL(18,6) NULL,
  exchange_rate DECIMAL(18,6) NULL,
  reference_daily_salary_local DECIMAL(18,2) NULL,
  reference_daily_salary_usd DECIMAL(18,2) NULL,
  currency_code VARCHAR(10) NULL,
  is_configured TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_country_settings_country FOREIGN KEY (country_id) REFERENCES countries(id),
  UNIQUE KEY uq_country_settings_country (country_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS country_incentives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  type VARCHAR(20) NOT NULL,
  unit_value_usd DECIMAL(18,4) NOT NULL DEFAULT 0,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'USD',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_country_incentives_country FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS work_plan_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  phase_id INT NOT NULL,
  role_id INT NOT NULL,
  quantity DECIMAL(18,2) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_workplan_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_workplan_phase FOREIGN KEY (phase_id) REFERENCES phases(id),
  CONSTRAINT fk_workplan_role FOREIGN KEY (role_id) REFERENCES roles(id),
  UNIQUE KEY uq_workplan_country_phase_role (country_id, phase_id, role_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  phase_id INT NOT NULL,
  team_type VARCHAR(20) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_config_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_team_config_phase FOREIGN KEY (phase_id) REFERENCES phases(id),
  UNIQUE KEY uq_team_config_country_phase_type (country_id, phase_id, team_type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_configuration_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_configuration_id INT NOT NULL,
  role_id INT NOT NULL,
  quantity DECIMAL(18,2) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_config_item_team FOREIGN KEY (team_configuration_id) REFERENCES team_configurations(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_config_item_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- rule_type: LINE_TOTAL | CEIL_RATIO | PERCENT_OF_DAYS | UNIT_COST_DELTA | REFERENCE_SALARY |
--            INTERNAL_COST_NORMALIZED | SAMPLE_SIZING | PROPORTIONAL_DATA_COST | EXPECTED_MARGIN
CREATE TABLE IF NOT EXISTS calculation_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  rule_type VARCHAR(60) NOT NULL,
  params_json JSON NOT NULL,
  phase_item_id INT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rules_phase_item FOREIGN KEY (phase_item_id) REFERENCES phase_items(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sizing_parameters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NULL,
  phase_code VARCHAR(50) NOT NULL,
  sample_size DECIMAL(18,2) NOT NULL,
  base_effectiveness DECIMAL(6,4) NOT NULL,
  attempts INT NOT NULL,
  minutes_between_attempts DECIMAL(10,2) NOT NULL,
  survey_minutes DECIMAL(10,2) NOT NULL,
  work_hours_day DECIMAL(6,2) NOT NULL,
  team_size INT NOT NULL,
  error_margin DECIMAL(6,4) NOT NULL,
  days_per_week DECIMAL(4,2) NOT NULL DEFAULT 5,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==========================================================================
-- Cotizaciones
-- ==========================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_number VARCHAR(30) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  parent_quote_id INT NULL,
  client_id INT NOT NULL,
  country_id INT NOT NULL,
  currency_id INT NOT NULL,
  exchange_rate_used DECIMAL(18,6) NOT NULL,
  executive_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  sample_size DECIMAL(18,2) NOT NULL DEFAULT 0,
  margin_percent DECIMAL(6,4) NULL,
  status ENUM('BORRADOR','EN_REVISION','APROBADA','RECHAZADA','CANCELADA') NOT NULL DEFAULT 'BORRADOR',
  valid_until DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quotes_parent FOREIGN KEY (parent_quote_id) REFERENCES quotes(id),
  CONSTRAINT fk_quotes_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_quotes_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_quotes_currency FOREIGN KEY (currency_id) REFERENCES currencies(id),
  CONSTRAINT fk_quotes_executive FOREIGN KEY (executive_id) REFERENCES users(id),
  INDEX idx_quotes_number (quote_number),
  INDEX idx_quotes_executive (executive_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quote_inputs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  CONSTRAINT fk_quote_inputs_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quote_phases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  phase_id INT NOT NULL,
  phase_name_snapshot VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  subtotal_usd DECIMAL(18,2) NOT NULL DEFAULT 0,
  subtotal_local DECIMAL(18,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_quote_phases_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_phases_phase FOREIGN KEY (phase_id) REFERENCES phases(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quote_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_phase_id INT NOT NULL,
  catalog_item_id INT NOT NULL,
  item_name_snapshot VARCHAR(150) NOT NULL,
  category_snapshot VARCHAR(100) NOT NULL,
  quantity DECIMAL(18,2) NOT NULL DEFAULT 0,
  days DECIMAL(18,2) NOT NULL DEFAULT 0,
  unit_price_usd_snapshot DECIMAL(18,4) NOT NULL DEFAULT 0,
  total_usd DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_local DECIMAL(18,2) NOT NULL DEFAULT 0,
  internal_cost_usd_snapshot DECIMAL(18,2) NOT NULL DEFAULT 0,
  rule_snapshot_json JSON NULL,
  CONSTRAINT fk_quote_items_phase FOREIGN KEY (quote_phase_id) REFERENCES quote_phases(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_items_catalog FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quote_summary_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  label VARCHAR(150) NOT NULL,
  value_usd DECIMAL(18,2) NOT NULL DEFAULT 0,
  value_local DECIMAL(18,2) NOT NULL DEFAULT 0,
  kind VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_summary_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quote_calculation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  input_snapshot_json JSON NOT NULL,
  output_snapshot_json JSON NOT NULL,
  CONSTRAINT fk_logs_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
