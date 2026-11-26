-- Trilha Saúde - instalação de banco novo
-- Execute este arquivo em uma instância MySQL 8+.

CREATE DATABASE IF NOT EXISTS trilhasaude
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trilhasaude;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL DEFAULT '',
  birth_date DATE DEFAULT NULL,
  user_type VARCHAR(30) NOT NULL DEFAULT 'paciente',
  done TINYINT UNSIGNED NOT NULL DEFAULT 1,
  lemb BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (token_hash),
  KEY ix_sessions_user (user_id),
  KEY ix_sessions_expiration (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS professionals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  specialty VARCHAR(100) NOT NULL DEFAULT '',
  professional_registration VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(60) NOT NULL,
  who VARCHAR(60) NOT NULL DEFAULT '',
  professional_id BIGINT UNSIGNED DEFAULT NULL,
  location VARCHAR(150) NOT NULL DEFAULT '',
  appt_at DATETIME NOT NULL COMMENT 'Data/hora UTC',
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  warned BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  KEY ix_appointments_user_date (user_id, appt_at),
  KEY ix_appointments_professional (professional_id),
  CONSTRAINT fk_appointments_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_professional FOREIGN KEY (professional_id)
    REFERENCES professionals(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exams (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(60) NOT NULL,
  exam_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Agendado',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_exams_user_date (user_id, exam_date),
  CONSTRAINT fk_exams_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  detail VARCHAR(255) NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_notifications_user (user_id, id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  is_mine BOOLEAN NOT NULL DEFAULT FALSE,
  body VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_messages_user (user_id, id),
  CONSTRAINT fk_messages_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_id BIGINT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  file_path VARCHAR(255) DEFAULT NULL,
  original_name VARCHAR(150) DEFAULT NULL,
  mime_type VARCHAR(50) DEFAULT NULL,
  result_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_results_exam (exam_id),
  CONSTRAINT fk_results_exam FOREIGN KEY (exam_id)
    REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS referrals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  professional_id BIGINT UNSIGNED DEFAULT NULL,
  destination VARCHAR(150) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
  referral_date DATE NOT NULL,
  PRIMARY KEY (id),
  KEY ix_referrals_user (user_id),
  KEY ix_referrals_professional (professional_id),
  CONSTRAINT fk_referrals_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_referrals_professional FOREIGN KEY (professional_id)
    REFERENCES professionals(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  original_name VARCHAR(150) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_documents_user (user_id),
  CONSTRAINT fk_documents_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
