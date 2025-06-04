document.addEventListener('DOMContentLoaded', () => {
  const csvUrl = 'data/JR_Sakai_Line_Timetable.csv';
  const toggleBtn = document.getElementById('toggle-direction');
  const routeTitle = document.getElementById('route-title');
  const trainsList = document.getElementById('trains-list');
  // const datePicker = document.getElementById('date-picker');
  // const timePicker = document.getElementById('time-picker');
  // const lineSelect = document.getElementById('line-select');  // убрали

  let trainsForward = [];
  let trainsBackward = [];
  let showForward = true;

  function parseBothDirections(rawRows) {
    const result = { forward: [], backward: [] };
    const dateString = rawRows[1][0]?.trim() || '';
    const fareMatch = rawRows[3][0].split(':')[1]?.trim() || '';
    const fareString = fareMatch;

    let headerIndexForward = -1;
    let headerIndexBackward = -1;
    let foundSeparator = false;

    for (let i = 0; i < rawRows.length; i++) {
      const row0 = rawRows[i][0]?.trim() ?? '';
      if (!foundSeparator) {
        if (row0.toLowerCase() === 'km' && rawRows[i][2]?.trim() === '') {
          headerIndexForward = i;
        }
        if (rawRows[i][0]?.toString().startsWith('Yonago-Sakaiminato')) {
          foundSeparator = true;
        }
      } else {
        if (row0.toLowerCase() === 'km' && rawRows[i][2]?.trim() === '') {
          headerIndexBackward = i;
          break;
        }
      }
    }

    if (headerIndexForward < 0) return result;

    function buildOneDirection(startIndex) {
      const headerRow = rawRows[startIndex];
      const trainIds = headerRow.slice(3).filter(cell => cell && cell.trim() !== '');
      const stationRows = [];
      for (let j = startIndex + 1; j < rawRows.length; j++) {
        const r0 = rawRows[j][0]?.toString() || '';
        if (!r0.trim()) break;
        if (r0.startsWith('Yonago-Sakaiminato') || r0.startsWith('Sakaiminato-Yonago')) break;
        stationRows.push(rawRows[j]);
      }

      const trains = trainIds.map(tid => ({
        trainId: tid.trim(),
        date: dateString,
        fare: fareString,
        direction: '', 
        stops: []
      }));

      stationRows.forEach(row => {
        const km = row[0]?.trim();
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

    trainsBackward = buildOneDirection(headerIndexForward);
    trainsBackward.forEach(t => t.direction = 'Sakaiminato → Yonago');

    if (headerIndexBackward >= 0) {
      trainsForward = buildOneDirection(headerIndexBackward);
      trainsForward.forEach(t => t.direction = 'Yonago → Sakaiminato');
    }

    return { forward: trainsForward, backward: trainsBackward };
  }

  function renderTrains(trainsArray) {
    trainsList.innerHTML = '';
    if (!trainsArray.length) {
      trainsList.innerHTML = '<div class="text-danger">Рейсов не найдено.</div>';
      return;
    }

    let lastHourMarker = null;
    trainsArray.forEach(train => {
      const firstStopTime = train.stops[0]?.time || '00:00';
      const [h0] = firstStopTime.split(':').map(Number);
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
      const arrivalTime = train.stops[train.stops.length - 1]?.time || '--:--';
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
      timesEl.textContent = `${departureTime} → ${arrivalTime} (${isNaN(durMinutes) ? '--' : durMinutes} min)`;
      infoDiv.appendChild(timesEl);

      const lineEl = document.createElement('div');
      lineEl.className = 'train-line';
      lineEl.textContent = `${train.trainId} – ${train.fare} (${train.direction})`;
      infoDiv.appendChild(lineEl);

      headerRow.appendChild(infoDiv);

      // Привязываем разворачивание СТОЛЬКО к кнопке, а не к headerRow
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
              <th style="width: 10%;">Km</th>
              <th style="width: 30%;">Station (JP)</th>
              <th style="width: 30%;">Station (EN)</th>
              <th style="width: 30%;">Time</th>
            </tr>
          </thead>
          <tbody>
      `;
      train.stops.forEach(stop => {
        tableHtml += `
          <tr>
            <td>${stop.km}</td>
            <td>${stop.stationJP}</td>
            <td>${stop.stationEN}</td>
            <td>${stop.time}</td>
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
      // Только кнопка разворачивает список
      btn.addEventListener('click', () => {
        isOpen = !isOpen;
        stopsDiv.style.display = isOpen ? 'block' : 'none';
      });

      trainsList.appendChild(trainRow);
    });
  }

  Papa.parse(csvUrl, {
    download: true,
    skipEmptyLines: true,
    complete: results => {
      const raw = results.data;
      const { forward, backward } = parseBothDirections(raw);
      trainsForward = forward;
      trainsBackward = backward;

      showForward = true;
      routeTitle.textContent = 'Yonago → Sakaiminato';
      renderTrains(trainsForward);
    },
    error: err => {
      trainsList.innerHTML = `<div class="text-danger">Ошибка загрузки CSV: ${err.message}</div>`;
    }
  });

  toggleBtn.addEventListener('click', () => {
    showForward = !showForward;
    if (showForward) {
      routeTitle.textContent = 'Yonago → Sakaiminato';
      renderTrains(trainsForward);
    } else {
      routeTitle.textContent = 'Sakaiminato → Yonago';
      renderTrains(trainsBackward);
    }
  });

  // datePicker.addEventListener('change', () => { … });
  // timePicker.addEventListener('change', () => { … });
});
