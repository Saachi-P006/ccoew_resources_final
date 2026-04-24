import React, { useState } from "react";
import "./CalendarWidget.css";

function CalendarWidget() {
  const [open, setOpen] = useState(false);
  const today = new Date();

  return (
    <>
      {/* Floating Round Button */}
      <button className="calendar-floating-btn" onClick={() => setOpen(true)}>
        📅
      </button>

      {/* Popup Calendar */}
      {open && (
        <div className="calendar-popup-overlay" onClick={() => setOpen(false)}>
          <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
            
            <h3>
              {today.toLocaleString("default", { month: "long" })} {today.getFullYear()}
            </h3>

            <table>
              <thead>
                <tr>
                  <th>Sun</th>
                  <th>Mon</th>
                  <th>Tue</th>
                  <th>Wed</th>
                  <th>Thu</th>
                  <th>Fri</th>
                  <th>Sat</th>
                </tr>
              </thead>

              <tbody>
                {generateCalendar(today)}
              </tbody>
            </table>

            <button className="close-calendar-btn" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function generateCalendar(currentDate) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let rows = [];
  let cells = [];

  // Blank cells before the 1st
  for (let i = 0; i < firstDay; i++) {
    cells.push(<td key={"b" + i}></td>);
  }

  // Calendar days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(<td key={day}>{day}</td>);

    if ((cells.length % 7 === 0) || day === daysInMonth) {
      rows.push(<tr key={"r" + day}>{cells}</tr>);
      cells = [];
    }
  }

  return rows;
}

export default CalendarWidget;
