-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('staff', 'student')) NOT NULL
);

-- Table: quizzes
CREATE TABLE quizzes (
    quiz_id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(username)
);

-- Table: questions
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id UUID NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer VARCHAR(1),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- Table: student_responses
CREATE TABLE student_responses (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    quiz_id UUID NOT NULL,
    question TEXT NOT NULL,
    selected_option VARCHAR(1),
    correct_option VARCHAR(1),
    is_correct BOOLEAN,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);
