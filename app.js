document.addEventListener('DOMContentLoaded', () => {
  const csvUrl = 'data/JR_Sakai_Line_Timetable.csv';
  const weekdaysTab = document.getElementById('weekdays-tab');
  const weekendsTab = document.getElementById('weekends-tab');
  const routeTitle   = document.getElementById('route-title');
  const trainsList   = document.getElementById('trains-list');
  const dateEl       = document.getElementById('date');
  const fareSYEl     = document.getElementById('fare-s-y');
  const fareSAYEl    = document.getElementById('fare-s-ay');
  const toggleBtn    = document.getElementById('toggle-direction');

  // Four arrays for two tabs and two directions in each
  let weekdaysForward   = [];
  let weekdaysBackward  = [];
  let weekendsForward   = [];
  let weekendsBackward  = [];

  // Store current active tab ("weekdays" or "weekends") and direction (true=forward, false=backward)
  let activeTab      = 'weekdays';
  let showForward    = true;

  /**
   * Parses rawRows into two arrays (forward/backward) for the given range [startIdx..endIdx).
   * directionTextForward and directionTextBackward are used to label each train.direction.
   */
  function parseBlock(rawRows, startIdx, endIdx, directionTextForward, directionTextBackward) {
    // Find the "km" header inside the block [startIdx..endIdx)
    let headerIndexForward  = -1;
    let headerIndexBackward = -1;
    let foundSeparator      = false;

    for (let i = startIdx; i < endIdx; i++) {
      const cell0 = rawRows[i][0]?.trim().toLowerCase() || '';
      if (!foundSeparator) {
        if (cell0 === 'km' && rawRows[i][2]?.trim() === '') {
          headerIndexForward = i;
        }
        // As soon as we see a row starting with 'Yonago-Sakaiminato', switch
        if (rawRows[i][0]?.startsWith('Yonago-Sakaiminato')) {
          foundSeparator = true;
        }
      } else {
        if (cell0 === 'km' && rawRows[i][2]?.trim() === '') {
          headerIndexBackward = i;
          break;
        }
      }
    }

    const result = { forward: [], backward: [] };
    if (headerIndexForward < 0) return result;

    // Helper function builds an array of trains (forward or backward) from one header
    function buildOneDirection(startIndex, directionText) {
      const headerRow = rawRows[startIndex];
      // Train numbers – starting from column 3
      const trainIds = headerRow.slice(3).filter(cell => cell && cell.trim() !== '');

      // Stations go from startIndex+1, until empty or new separator
      const stationRows = [];
      for (let j = startIndex + 1; j < endIdx; j++) {
        const r0 = rawRows[j][0]?.toString() || '';
        if (!r0.trim()) break;
        if (r0.startsWith('Yonago-Sakaiminato') || r0.startsWith('Sakaiminato-Yonago')) break;
        stationRows.push(rawRows[j]);
      }

      // Date and fares are already obtained separately; here we only build train objects
      const trains = trainIds.map((tid) => ({
        trainId: tid.trim(),
        date: '',     // will be filled outside if needed
        fare: '',     // will be filled outside
        direction: directionText,
        stops: []     // array of {km, stationJP, stationEN, time}
      }));

      stationRows.forEach(row => {
        const km        = row[0]?.trim();
        const stationJP = row[1]?.trim();
        const stationEN = row[2]?.trim();
        trainIds.forEach((tid, idx) => {
          const timeValue = row[3 + idx]?.trim();
          if (timeValue && stationEN) {
            trains[idx].stops.push({
              km: km,
              stationJP: stationJP,
              stationEN: stationEN,
              time: timeValue
            });
          }
        });
      });

      return trains;
    }

    // Weekdays: Sakaiminato→Yonago
    const backward = buildOneDirection(headerIndexForward, directionTextBackward);
    backward.forEach(t => t.direction = directionTextBackward);

    // Weekdays: Yonago→Sakaiminato (if there is a second header)
    let forward = [];
    if (headerIndexBackward >= 0) {
      forward = buildOneDirection(headerIndexBackward, directionTextForward);
      forward.forEach(t => t.direction = directionTextForward);
    }

    return { forward, backward };
  }

  /**
   * Renders the given array of trains to the page
   */
  function renderTrains(trainsArray) {
    trainsList.innerHTML = '';
    if (!trainsArray.length) {
      trainsList.innerHTML = '<div class="text-danger">Trains not found</div>';
      return;
    }

    let lastHourMarker = null;
    trainsArray.forEach(train => {
      const firstTime = train.stops[0]?.time || '00:00';
      const [h0] = firstTime.split(':').map(Number);
      const hourLabel = h0.toString().padStart(2, '0') + ':00';

      if (hourLabel !== lastHourMarker) {
        const markerEl = document.createElement('div');
        markerEl.className = 'time-marker';
        markerEl.textContent = hourLabel;
        trainsList.appendChild(markerEl);
        lastHourMarker = hourLabel;
      }

      const trainRow = document.createElement('div');
      trainRow.className = 'train-row';

      const headerRow = document.createElement('div');
      headerRow.className = 'header-row';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'train-info';

      const departureTime = train.stops[0]?.time || '--:--';
      const arrivalTime   = train.stops[train.stops.length - 1]?.time || '--:--';

      let durMinutes = NaN;
      if (departureTime.includes(':') && arrivalTime.includes(':')) {
        const [h1, m1] = departureTime.split(':').map(Number);
        const [h2, m2] = arrivalTime.split(':').map(Number);
        let d = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (d < 0) d += 24 * 60;
        durMinutes = d;
      }

      const timesEl = document.createElement('div');
      timesEl.className = 'train-times';
      timesEl.innerHTML = `
        ${departureTime} → ${arrivalTime}<br>
      `;
      infoDiv.appendChild(timesEl);


      const lineElt = document.createElement('div');
      lineElt.className = 'train-line';
      lineElt.textContent = `${isNaN(durMinutes) ? '--' : durMinutes} min`;
      infoDiv.appendChild(lineElt);

      // Fare is already set in train.fare during parsing
      const lineEl = document.createElement('div');
      lineEl.className = 'train-line';
      lineEl.textContent = `${train.direction}. ${train.trainId}`;
      infoDiv.appendChild(lineEl);

      headerRow.appendChild(infoDiv);

      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-primary btn-stops';
      btn.type = 'button';
      btn.textContent = 'Stops';
      headerRow.appendChild(btn);

      trainRow.appendChild(headerRow);

      const stopsDiv = document.createElement('div');
      stopsDiv.className = 'stops-list';

      let tableHtml = `
        <table class="table table-sm mb-0">
          <thead>
            <tr>
            <th style="width: 10%;">Time</th>
            <th style="width: 30%;">Station (EN)</th>
            <th style="width: 50%;">Station (JP)</th>
            <th style="width: 10%;">Km</th>
            </tr>
          </thead>
          <tbody>
      `;
      train.stops.forEach(stop => {
        tableHtml += `
          <tr>
          <td>${stop.time}</td>
          <td>${stop.stationEN}</td>
          <td>${stop.stationJP}</td>
          <td>${stop.km}</td>
          </tr>
        `;
      });
      tableHtml += `
          </tbody>
        </table>
      `;
      stopsDiv.innerHTML = tableHtml;
      trainRow.appendChild(stopsDiv);

      let isOpen = false;
      btn.addEventListener('click', () => {
        isOpen = !isOpen;
        stopsDiv.style.display = isOpen ? 'block' : 'none';
      });

      trainsList.appendChild(trainRow);
    });
  }

  /**
   * Main CSV parsing: first collect rawRows,
   * then extract date, fares, split into two blocks: WEEKDAYS / WEEKENDS,
   * and then each block is split into forward/backward.
   */
  Papa.parse(csvUrl, {
    download: true,
    skipEmptyLines: true,
    complete: results => {
      const raw = results.data;

      // ————— Display date and fares (they are the same for both weekends and weekdays) —————
      const dateString = raw[1][0]?.trim() || '';
      dateEl.textContent = dateString;

      // Insert only the number + "yen" (after the colon) into the "Fare" block
      const fareSY  = raw[3][0]?.split(':')[1]?.trim() || '';
      const fareSAY = raw[4][0]?.split(':')[1]?.trim() || '';
      fareSYEl.textContent  = fareSY;
      fareSAYEl.textContent = fareSAY;
      // ————————————————————————————————————————————————————————————————

      // Find indices where the "WEEKDAYS" and "WEEKENDS" blocks start
      const idxWeekdays = raw.findIndex(row => row[0]?.trim() === 'WEEKDAYS');
      const idxWeekends = raw.findIndex(row => row[0]?.trim() === 'WEEKENDS');

      // End of each block (next header or end)
      const endWeekdays = (idxWeekends >= 0 ? idxWeekends : raw.length);
      const endWeekends = raw.length;

      // Parse weekdays (rows [idxWeekdays+1 .. endWeekdays))
      const blockWeekdays = raw.slice(idxWeekdays + 1, endWeekdays);
      const { forward: wdFwd, backward: wdBwd } =
        parseBlock(raw, idxWeekdays + 1, endWeekdays,
                   'Yonago → Sakaiminato', 'Sakaiminato → Yonago');
      weekdaysForward  = wdFwd.map(t => ({ ...t, fare: fareSY }));
      weekdaysBackward = wdBwd.map(t => ({ ...t, fare: fareSY }));

      // Parse weekends (if present)
      let weFwd = [], weBwd = [];
      if (idxWeekends >= 0) {
        const blockWeekends = raw.slice(idxWeekends + 1, endWeekends);
        const { forward: wF, backward: wB } =
          parseBlock(raw, idxWeekends + 1, endWeekends,
                     'Yonago → Sakaiminato', 'Sakaiminato → Yonago');
        weFwd = wF.map(t => ({ ...t, fare: fareSY }));
        weBwd = wB.map(t => ({ ...t, fare: fareSY }));
      }
      weekendsForward  = weFwd;
      weekendsBackward = weBwd;

      // Initially show weekdays in the forward direction
      activeTab = 'weekdays';
      showForward = true;
      routeTitle.textContent = 'Yonago → Sakaiminato';
      renderTrains(weekdaysForward);
    },
    error: err => {
      trainsList.innerHTML = `<div class="text-danger">Error loading CSV: ${err.message}</div>`;
    }
  });

  // "Opposite Direction" button
  toggleBtn.addEventListener('click', () => {
    showForward = !showForward;
    if (activeTab === 'weekdays') {
      if (showForward) {
        routeTitle.textContent = 'Yonago → Sakaiminato';
        renderTrains(weekdaysForward);
      } else {
        routeTitle.textContent = 'Sakaiminato → Yonago';
        renderTrains(weekdaysBackward);
      }
    } else {
      if (showForward) {
        routeTitle.textContent = 'Yonago → Sakaiminato';
        renderTrains(weekendsForward);
      } else {
        routeTitle.textContent = 'Sakaiminato → Yonago';
        renderTrains(weekendsBackward);
      }
    }
  });

  // Handler for changing Weekdays
  function activate(tab) {
  activeTab = tab;
  showForward = true;
  if (tab === 'weekdays') {
    weekdaysTab.classList.add('toggle-btn--active');
    weekendsTab.classList.remove('toggle-btn--active');
    routeTitle.textContent = 'Yonago → Sakaiminato';
    renderTrains(weekdaysForward);
  } else {
    weekendsTab.classList.add('toggle-btn--active');
    weekdaysTab.classList.remove('toggle-btn--active');
    routeTitle.textContent = 'Yonago → Sakaiminato';
    renderTrains(weekendsForward);
  }
}
  weekdaysTab.addEventListener('click', () => activate('weekdays'));
  weekendsTab.addEventListener('click', () => activate('weekends'));
});