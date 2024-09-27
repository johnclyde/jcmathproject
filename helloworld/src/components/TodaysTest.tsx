import React from "react";

const TodaysTest = ({ testName, testDescription, onStartTest }) => {
  return (
    <div className="card">
      <h3>Today's Test</h3>
      <div className="todays-test">
        <div className="test-info">
          <div className="test-name">{testName}</div>
          <div className="test-description">{testDescription}</div>
        </div>
        <button type="button" className="start-test-btn" onClick={onStartTest}>
          Start Test
        </button>
      </div>
    </div>
  );
};

export default TodaysTest;
