# JR Sakai Line Timetable Viewer

A lightweight web application to display the JR Sakai Line timetable (Yonago ↔ Sakaiminato) in a browser. It parses a CSV export of the official timetable (including separate weekday/weekend blocks), shows departure/arrival times, duration, and station stops (both Japanese and English names). Users can toggle between weekday/weekend schedules and switch direction (Yonago → Sakaiminato or Sakaiminato → Yonago) with a single click.

🌐 **[jr-sakai.vercel.app](https://jr-sakai.vercel.app/)**

---

## Features

- **Weekday / Weekend Tabs**  
  Toggle between “WEEKDAYS” and “WEEKENDS” schedules. Each tab loads its own section of the CSV (lines after the “WEEKDAYS” or “WEEKENDS” header).

- **Direction Switch**  
  A button (“Opposite Direction”) flips the current timetable between two directions:
  - Yonago → Sakaiminato  
  - Sakaiminato → Yonago  

- **Departure → Arrival + Duration Display**  
  For each train, displays:
  1. First station’s departure time  
  2. Last station’s arrival time  
  3. Total travel duration (in minutes)  
  4. Current direction label (e.g. “Yonago → Sakaiminato”)

- **Station Stops Table**  
  Clicking the “Stops” button for a particular train reveals a table of all intermediate stations. Each row shows:
  - Km (distance along the line)  
  - Station name (Kanji)  
  - Station name (English)  
  - Scheduled time at that station  

- **Dynamic Date & Fare Display**  
  At the top, shows:
  - The timetable date (e.g. “2024-03-16”)  
  - Fares (after the “:” in the CSV) for:
    - Sakaiminato → Yonago  
    - Sakaiminato → Yonago Airport  

- **Pure HTML5 / CSS3 / Bootstrap 5 / JavaScript (PapaParse) Implementation**  
  - No server-side code required.  
  - CSV is fetched via PapaParse (JavaScript library at runtime).  
  - Responsive Bootstrap layout works on both desktop and mobile browsers.

---