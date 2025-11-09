-- Script d'initialisation de la base de données Hub
-- Ce fichier est exécuté automatiquement lors du premier démarrage du conteneur MySQL

-- Créer la base de données si elle n'existe pas déjà
CREATE DATABASE IF NOT EXISTS hub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE hub_db;

-- Créer les tables de base pour le hub
-- Table des organisations (tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de liaison utilisateurs-organisations
CREATE TABLE IF NOT EXISTS user_organizations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_org (user_id, organization_id),
    INDEX idx_user_id (user_id),
    INDEX idx_organization_id (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des applications disponibles
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    status ENUM('active', 'inactive', 'beta') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des abonnements (organisations-applications)
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    application_id VARCHAR(36) NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'pending') DEFAULT 'pending',
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_organization_id (organization_id),
    INDEX idx_application_id (application_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Accorder les privilèges nécessaires à l'utilisateur applicatif pour les bases tenants
GRANT CREATE, ALTER, DROP ON *.* TO 'hub_user'@'%';
FLUSH PRIVILEGES;

