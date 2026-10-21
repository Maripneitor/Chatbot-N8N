-- ===============================================================
-- ESQUEMA DE BASE DE DATOS: GESTOR DE BIBLIOTECA ESCOLAR
-- ===============================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_code VARCHAR(50) UNIQUE NOT NULL,      -- Matrícula estudiantil
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telegram_id VARCHAR(50) UNIQUE,                -- ID de chat de Telegram para notificaciones
    has_penalty BOOLEAN DEFAULT FALSE,             -- Si el estudiante tiene multas pendientes
    penalty_amount NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(30),
    rfid_tag VARCHAR(100) UNIQUE NOT NULL,         -- Código de la etiqueta RFID
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    edition VARCHAR(50),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    location_shelf VARCHAR(100) NOT NULL,          -- Ej. "Pasillo A - Estante 3"
    is_digital BOOLEAN DEFAULT FALSE,              -- Si tiene versión digital disponible
    digital_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    book_id INT REFERENCES books(id) ON DELETE CASCADE,
    loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    returned_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'active',  -- 'active', 'returned', 'overdue', 'renewed'
    renewal_count INT NOT NULL DEFAULT 0,
    max_renewals INT NOT NULL DEFAULT 2,           -- Máximo 2 renovaciones digitales permitidas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rfid_logs (
    id SERIAL PRIMARY KEY,
    rfid_tag VARCHAR(100) NOT NULL,
    antenna_id VARCHAR(50) DEFAULT 'ANTENA_SALIDA_PRINCIPAL',
    event_type VARCHAR(50) NOT NULL,               -- 'AUTHORIZED_CHECKOUT', 'UNAUTHORIZED_EXIT_ALERT'
    description TEXT,
    book_id INT REFERENCES books(id) ON DELETE SET NULL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO DE BÚSQUEDA
-- ===============================================================
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_rfid ON books(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_students_telegram ON students(telegram_id);
CREATE INDEX IF NOT EXISTS idx_loans_student ON loans(student_id);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);

-- ===============================================================
-- DATOS INICIALES DE PRUEBA (SEEDS)
-- ===============================================================

-- Estudiantes de prueba
INSERT INTO students (student_code, full_name, email, telegram_id, has_penalty, penalty_amount)
VALUES 
    ('EST-202401', 'Josias Ramos', 'josias@escuela.edu.mx', '123456789', FALSE, 0.00),
    ('EST-202402', 'Mario Perez', 'mario@escuela.edu.mx', '987654321', FALSE, 0.00),
    ('EST-202403', 'Ana Morales', 'ana@escuela.edu.mx', '555666777', TRUE, 50.00)
ON CONFLICT (student_code) DO NOTHING;

-- Libros de prueba (incluyendo James Stewart como en el caso de uso del PDF)
INSERT INTO books (isbn, rfid_tag, title, author, category, edition, total_copies, available_copies, location_shelf, is_digital, digital_url)
VALUES 
    ('978-6075265568', 'RFID-STEWART-CALC-001', 'Cálculo de Una Variable: Trascendentes Tempranas', 'James Stewart', 'Matemáticas', '8va Edición', 3, 2, 'Pasillo 2 - Estante 4A', TRUE, 'https://biblioteca.escuela.edu.mx/digital/stewart-calculo'),
    ('978-6074817775', 'RFID-STEWART-CALC-002', 'Cálculo Diferencial e Integral', 'James Stewart', 'Matemáticas', '7ma Edición', 2, 0, 'Pasillo 2 - Estante 4B', FALSE, NULL),
    ('978-6073238496', 'RFID-GROSSMAN-ALG-001', 'Álgebra Lineal', 'Stanley I. Grossman', 'Matemáticas', '7ma Edición', 4, 3, 'Pasillo 2 - Estante 3C', TRUE, 'https://biblioteca.escuela.edu.mx/digital/grossman-algebra'),
    ('978-6074420432', 'RFID-SEARS-FISICA-001', 'Física Universitaria con Física Moderna', 'Sears y Zemansky', 'Física', '13va Edición', 2, 1, 'Pasillo 3 - Estante 1A', FALSE, NULL),
    ('978-0131103627', 'RFID-KR-C-001', 'The C Programming Language', 'Brian W. Kernighan, Dennis M. Ritchie', 'Computación', '2da Edición', 2, 2, 'Pasillo 4 - Estante 2B', TRUE, 'https://biblioteca.escuela.edu.mx/digital/c-programming')
ON CONFLICT (rfid_tag) DO NOTHING;

-- Préstamos de prueba:
-- 1. Préstamo que vence MAÑANA (para probar la alerta automática de 24h de n8n)
INSERT INTO loans (student_id, book_id, loan_date, due_date, status, renewal_count)
SELECT s.id, b.id, CURRENT_DATE - INTERVAL '6 day', CURRENT_DATE + INTERVAL '1 day', 'active', 0
FROM students s, books b
WHERE s.student_code = 'EST-202401' AND b.rfid_tag = 'RFID-STEWART-CALC-001'
ON CONFLICT DO NOTHING;

-- 2. Préstamo con varios días restantes
INSERT INTO loans (student_id, book_id, loan_date, due_date, status, renewal_count)
SELECT s.id, b.id, CURRENT_DATE - INTERVAL '2 day', CURRENT_DATE + INTERVAL '5 day', 'active', 1
FROM students s, books b
WHERE s.student_code = 'EST-202401' AND b.rfid_tag = 'RFID-GROSSMAN-ALG-001'
ON CONFLICT DO NOTHING;
