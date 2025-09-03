// src/components/QuizResult.jsx
import React from 'react';

const QuizResult = ({ results }) => {
  return (
    <div>
      <h2>Quiz Results</h2>
      <ul>
        {results.map((result, index) => (
          <li key={index}>
            <p>Question: {result.question}</p>
            <p>Your answer: {result.selected}</p>
            <p>Correct answer: {result.correct}</p>
            <p>{result.is_correct ? 'Correct!' : 'Incorrect'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuizResult;
