import React, { useState, useEffect } from "react";
import "./InlineCalendar.css";

function InlineCalendar() {
  const today = new Date();

  // store month and year in state so we can change them
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const [tasks, setTasks] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputTask, setInputTask] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(`tasks-${month}-${year}`);
    if (saved) setTasks(JSON.parse(saved));
    else setTasks({});
  }, [month, year]);

  const handleSaveTask = () => {
    const newTasks = { ...tasks, [selectedDate]: inputTask };
    setTasks(newTasks);
    localStorage.setItem(`tasks-${month}-${year}`, JSON.stringify(newTasks));
    setSelectedDate(null);
    setInputTask("");
  };

  // NAVIGATION
  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(prev => prev - 1);
    } else setMonth(prev => prev - 1);
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(prev => prev + 1);
    } else setMonth(prev => prev + 1);
  };

  // Build calendar
  let rows = [];
  let cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(<td key={"b" + i}></td>);

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    cells.push(
      <td
        key={day}
        className={isToday ? "today" : ""}
        onClick={() => {
          setSelectedDate(day);
          setInputTask(tasks[day] || "");
        }}
      >
        {day}
        {tasks[day] && <div className="task-dot"></div>}
      </td>
    );

    if (cells.length % 7 === 0 || day === daysInMonth) {
      rows.push(<tr key={"r" + day}>{cells}</tr>);
      cells = [];
    }
  }

  return (
    <div className="inline-calendar">

      {/* MONTH NAVIGATION */}
      <div className="calendar-nav">
        <button onClick={goToPrevMonth}>{"<"}</button>
        <h3>
          {new Date(year, month).toLocaleString("default", { month: "long" })}{" "}
          {year}
        </h3>
        <button onClick={goToNextMonth}>{">"}</button>
      </div>

      <table>
        <thead>
          <tr>{daysOfWeek.map((d) => <th key={d}>{d}</th>)}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>

      {/* TASK MODAL */}
      {selectedDate && (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div onClick={(e) => e.stopPropagation()} className="modal-content">
            <h3>
              Tasks for {selectedDate}-{month + 1}-{year}
            </h3>

            <textarea
              rows="5"
              value={inputTask}
              onChange={(e) => setInputTask(e.target.value)}
              placeholder="Write your task..."
            />

            <button onClick={handleSaveTask}>Save Task</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InlineCalendar;
