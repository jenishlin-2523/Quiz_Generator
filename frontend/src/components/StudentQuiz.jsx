// src/components/StudentQuiz.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentQuiz = () => {
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  
  useEffect(() => {
    axios.get('http://localhost:8000/quiz/get')
      .then(response => setQuiz(response.data.questions))
      .catch(error => console.error("Error fetching quiz:", error));
  }, []);

  const handleAnswerChange = (questionIndex, option) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionIndex]: option,
    }));
  };

  const handleSubmit = () => {
    axios.post('http://localhost:8000/quiz/submit', { answers })
      .then(response => {
        console.log("Quiz Results:", response.data);
      })
      .catch(error => console.error("Error submitting quiz:", error));
  };

  return (
    <div>
      <h1>Student Quiz</h1>
      {quiz.map((q, index) => (
        <div key={index}>
          <h3>{q.question}</h3>
          {q.options.map((option, i) => (
            <label key={i}>
              <input
                type="radio"
                name={`question-${index}`}
                value={option}
                onChange={() => handleAnswerChange(index, option)}
              />
              {option}
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Quiz</button>
    </div>
  );
};

export default StudentQuiz;
