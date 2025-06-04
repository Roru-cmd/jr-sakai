// document.addEventListener('DOMContentLoaded', () => {
//   const csvUrl = 'data/JR_Sakai_Line_Timetable.csv';
//   const toggleBtn = document.getElementById('toggle-direction');
//   const routeTitle = document.getElementById('route-title');
//   const trainsList = document.getElementById('trains-list');

//   let trainsForward = [];
//   let trainsBackward = [];
//   let showForward = true;

//   function parseBothDirections(rawRows) {
//     const result = { forward: [], backward: [] };
//     const dateString = rawRows[1][0]?.trim() || '';
//     const fareMatch = rawRows[3][0].split(':')[1]?.trim() || '';
//     const fareString = fareMatch;

//     let headerIndexForward = -1;
//     let headerIndexBackward = -1;
//     let foundSeparator = false;

//     for (let i = 0; i < rawRows.length; i++) {
//       const row0 = rawRows[i][0]?.trim() ?? '';
//       if (!foundSeparator) {
//         if (row0.toLowerCase() === 'km' && rawRows[i][2]?.trim() === '') {
//           headerIndexForward = i;
//         }
//         if (rawRows[i][0]?.toString().startsWith('Yonago-Sakaiminato')) {
//           foundSeparator = true;
//         }
//       } else {
//         if (row0.toLowerCase() === 'km' && rawRows[i][2]?.trim() === '') {
//           headerIndexBackward = i;
//           break;
//         }
//       }
//     }

//     if (headerIndexForward < 0) return result;

//     function buildOneDirection(startIndex) {
//       const headerRow = rawRows[startIndex];
//       const trainIds = headerRow.slice(3).filter(cell => cell && cell.trim() !== '');
//       const stationRows = [];
//       for (let j = startIndex + 1; j < rawRows.length; j++) {
//         const r0 = rawRows[j][0]?.toString() || '';
//         if (!r0.trim()) break;
//         if (r0.startsWith('Yonago-Sakaiminato') || r0.startsWith('Sakaiminato-Yonago')) break;
//         stationRows.push(rawRows[j]);
//       }

//       const trains = trainIds.map(tid => ({
//         trainId: tid.trim(),
//         date: dateString,
//         fare: fareString,
//         direction: '', 
//         stops: []
//       }));

//       stationRows.forEach(row => {
//         const km = row[0]?.trim();
//         const stationJP = row[1]?.trim();
//         const stationEN = row[2]?.trim();
//         trainIds.forEach((tid, idx) => {
//           const timeValue = row[3 + idx]?.trim();
//           if (timeValue && stationEN) {
//             trains[idx].stops.push({
//               km: km,
//               stationJP: stationJP,
//               stationEN: stationEN,
//               time: timeValue
//             });
//           }
//         });
//       });

//       return trains;
//     }

//     trainsBackward = buildOneDirection(headerIndexForward);
//     trainsBackward.forEach(t => t.direction = 'Sakaiminato → Yonago');

//     if (headerIndexBackward >= 0) {
//       trainsForward = buildOneDirection(headerIndexBackward);
//       trainsForward.forEach(t => t.direction = 'Yonago → Sakaiminato');
//     }

//     return { forward: trainsForward, backward: trainsBackward };
//   }

//   function renderTrains(trainsArray) {
//     trainsList.innerHTML = '';
//     if (!trainsArray.length) {
//       trainsList.innerHTML = '<div class="text-danger">No trains found.</div>';
//       return;
//     }

//     let lastHourMarker = null;
//     trainsArray.forEach(train => {
//       const firstStopTime = train.stops[0]?.time || '00:00';
//       const [h0] = firstStopTime.split(':').map(Number);
//       const hourLabel = h0.toString().padStart(2, '0') + ':00';

//       if (hourLabel !== lastHourMarker) {
//         const markerEl = document.createElement('div');
//         markerEl.className = 'time-marker';
//         markerEl.textContent = hourLabel;
//         trainsList.appendChild(markerEl);
//         lastHourMarker = hourLabel;
//       }

//       const trainRow = document.createElement('div');
//       trainRow.className = 'train-row';

//       const headerRow = document.createElement('div');
//       headerRow.className = 'header-row';

//       const infoDiv = document.createElement('div');
//       infoDiv.className = 'train-info';

//       const departureTime = train.stops[0]?.time || '--:--';
//       const arrivalTime = train.stops[train.stops.length - 1]?.time || '--:--';
//       let durMinutes = NaN;
//       if (departureTime.includes(':') && arrivalTime.includes(':')) {
//         const [h1, m1] = departureTime.split(':').map(Number);
//         const [h2, m2] = arrivalTime.split(':').map(Number);
//         let d = (h2 * 60 + m2) - (h1 * 60 + m1);
//         if (d < 0) d += 24 * 60;
//         durMinutes = d;
//       }

//       const timesEl = document.createElement('div');
//       timesEl.className = 'train-times';
//     //   timesEl.textContent = `${departureTime} → ${arrivalTime} (${isNaN(durMinutes) ? '--' : durMinutes} min)`;
//       timesEl.textContent = `${departureTime} → ${arrivalTime}`;
//       infoDiv.appendChild(timesEl);

//      const lineElt = document.createElement('div');
//       lineElt.className = 'train-line';
//       lineElt.textContent = `${isNaN(durMinutes) ? '--' : durMinutes} min`;
//       infoDiv.appendChild(lineElt);

//       const lineEl = document.createElement('div');
//       lineEl.className = 'train-line';
//     //   lineEl.textContent = `${train.trainId} – ${train.fare} (${train.direction})`;
//       lineEl.textContent = `${train.direction}`;
//       infoDiv.appendChild(lineEl);

//       headerRow.appendChild(infoDiv);

//       // "Stops" button
//       const btn = document.createElement('button');
//       btn.className = 'btn btn-sm btn-outline-primary btn-stops';
//       btn.type = 'button';
//       btn.textContent = 'Stops';
//       headerRow.appendChild(btn);

//       trainRow.appendChild(headerRow);

//       const stopsDiv = document.createElement('div');
//       stopsDiv.className = 'stops-list';

//       let tableHtml = `
//         <table class="table table-sm mb-0">
//           <thead>
//             <tr>
//               <th style="width: 10%;">Km</th>
//               <th style="width: 30%;">Station (JP)</th>
//               <th style="width: 30%;">Station (EN)</th>
//               <th style="width: 30%;">Time</th>
//             </tr>
//           </thead>
//           <tbody>
//       `;
//       train.stops.forEach(stop => {
//         tableHtml += `
//           <tr>
//             <td>${stop.km}</td>
//             <td>${stop.stationJP}</td>
//             <td>${stop.stationEN}</td>
//             <td>${stop.time}</td>
//           </tr>
//         `;
//       });
//       tableHtml += `
//           </tbody>
//         </table>
//       `;
//       stopsDiv.innerHTML = tableHtml;
//       trainRow.appendChild(stopsDiv);

//       let isOpen = false;
//       // Только кнопка разворачивает список
//       btn.addEventListener('click', () => {
//         isOpen = !isOpen;
//         stopsDiv.style.display = isOpen ? 'block' : 'none';
//       });

//       trainsList.appendChild(trainRow);
//     });
//   }

//   Papa.parse(csvUrl, {
//     download: true,
//     skipEmptyLines: true,
//     complete: results => {
//       const raw = results.data;
//       const dateString = raw[1][0]?.trim() || '';
//       document.getElementById('date').textContent = dateString;
//     //   Direction and fare
//     //   const fareSY = raw[3][0]?.trim() || '';
//     //   const fareSAY = raw[4][0]?.trim() || '';
//       const fareSY = raw[3][0]?.split(':')[1]?.trim() || '';
//       const fareSAY = raw[4][0]?.split(':')[1]?.trim() || '';  
//       document.getElementById('fare-s-y').textContent = fareSY;
//       document.getElementById('fare-s-ay').textContent = fareSAY;
//       const { forward, backward } = parseBothDirections(raw);
//       trainsForward = forward;
//       trainsBackward = backward;

//       showForward = true;
//       routeTitle.textContent = 'Yonago → Sakaiminato';
//       renderTrains(trainsForward);
//     },
//     error: err => {
//       trainsList.innerHTML = `<div class="text-danger">Error load CSV: ${err.message}</div>`;
//     }
//   });

//   toggleBtn.addEventListener('click', () => {
//     showForward = !showForward;
//     if (showForward) {
//       routeTitle.textContent = 'Yonago → Sakaiminato';
//       renderTrains(trainsForward);
//     } else {
//       routeTitle.textContent = 'Sakaiminato → Yonago';
//       renderTrains(trainsBackward);
//     }
//   });

// });

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

  // Четыре массива для двух табов и двух направлений внутри каждого
  let weekdaysForward   = [];
  let weekdaysBackward  = [];
  let weekendsForward   = [];
  let weekendsBackward  = [];

  // Хранят текущий активный таб («weekdays» или «weekends») и направление (true=forward, false=backward)
  let activeTab      = 'weekdays';
  let showForward    = true;

  /**
   * Парсит rawRows в два массива (forward/backward) для заданного диапазона строк [startIdx..endIdx).
   * directionTextForward  и directionTextBackward  нужны, чтобы пометить каждый объект train.direction.
   */
  function parseBlock(rawRows, startIdx, endIdx, directionTextForward, directionTextBackward) {
    // Ищем заголовок «km» внутри блока [startIdx..endIdx)
    let headerIndexForward  = -1;
    let headerIndexBackward = -1;
    let foundSeparator      = false;

    for (let i = startIdx; i < endIdx; i++) {
      const cell0 = rawRows[i][0]?.trim().toLowerCase() || '';
      if (!foundSeparator) {
        if (cell0 === 'km' && rawRows[i][2]?.trim() === '') {
          headerIndexForward = i;
        }
        // Как только встречаем строку, начинающуюся с 'Yonago-Sakaiminato', переключаемся
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

    // Вспомогательная функция строит массив поездов (forward или backward) из одного заголовка
    function buildOneDirection(startIndex, directionText) {
      const headerRow = rawRows[startIndex];
      // Номера поездов – начиная с колонки 3
      const trainIds = headerRow.slice(3).filter(cell => cell && cell.trim() !== '');

      // Станции идут со строки startIndex+1, пока не пустая или не новый разделитель
      const stationRows = [];
      for (let j = startIndex + 1; j < endIdx; j++) {
        const r0 = rawRows[j][0]?.toString() || '';
        if (!r0.trim()) break;
        if (r0.startsWith('Yonago-Sakaiminato') || r0.startsWith('Sakaiminato-Yonago')) break;
        stationRows.push(rawRows[j]);
      }

      // Дата и тарифы уже получены отдельно; тут только строим объекты поездов
      const trains = trainIds.map((tid) => ({
        trainId: tid.trim(),
        date: '',     // заполнится снаружи, если нужно
        fare: '',     // заполнится снаружи
        direction: directionText,
        stops: []     // массив {km, stationJP, stationEN, time}
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

    // Budni: Sakaiminato→Yonago
    const backward = buildOneDirection(headerIndexForward, directionTextBackward);
    backward.forEach(t => t.direction = directionTextBackward);

    // Budni: Yonago→Sakaiminato (если есть второй header)
    let forward = [];
    if (headerIndexBackward >= 0) {
      forward = buildOneDirection(headerIndexBackward, directionTextForward);
      forward.forEach(t => t.direction = directionTextForward);
    }

    return { forward, backward };
  }

  /**
   * Рендерит указанный массив поездов на страницу
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

      // Тариф уже забит в train.fare при парсинге
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
      btn.addEventListener('click', () => {
        isOpen = !isOpen;
        stopsDiv.style.display = isOpen ? 'block' : 'none';
      });

      trainsList.appendChild(trainRow);
    });
  }

  /**
   * Основной парсинг всего CSV: сначала собираем rawRows,
   * затем извлекаем дату, тарифы, разбиваем на два блока: WEEKDAYS / WEEKENDS,
   * и далее каждый блок распиливаем на forward/backward.
   */
  Papa.parse(csvUrl, {
    download: true,
    skipEmptyLines: true,
    complete: results => {
      const raw = results.data;

      // ————— Отобразим дату и тарифы (они едины и для выходных, и для будних) —————
      const dateString = raw[1][0]?.trim() || '';
      dateEl.textContent = dateString;

      // Вставляем в блок «Fare» только цифру + «yen» (после двоеточия)
      const fareSY  = raw[3][0]?.split(':')[1]?.trim() || '';
      const fareSAY = raw[4][0]?.split(':')[1]?.trim() || '';
      fareSYEl.textContent  = fareSY;
      fareSAYEl.textContent = fareSAY;
      // ————————————————————————————————————————————————————————————————————————

      // Найдём индексы, где начинаются блоки «WEEKDAYS» и «WEEKENDS»
      const idxWeekdays = raw.findIndex(row => row[0]?.trim() === 'WEEKDAYS');
      const idxWeekends = raw.findIndex(row => row[0]?.trim() === 'WEEKENDS');

      // Граница до каждого блока (следующий заголовок или конец)
      const endWeekdays = (idxWeekends >= 0 ? idxWeekends : raw.length);
      const endWeekends = raw.length;

      // Парсим будни (строки [idxWeekdays+1 .. endWeekdays))
      const blockWeekdays = raw.slice(idxWeekdays + 1, endWeekdays);
      const { forward: wdFwd, backward: wdBwd } =
        parseBlock(raw, idxWeekdays + 1, endWeekdays,
                   'Yonago → Sakaiminato', 'Sakaiminato → Yonago');
      weekdaysForward  = wdFwd.map(t => ({ ...t, fare: fareSY }));
      weekdaysBackward = wdBwd.map(t => ({ ...t, fare: fareSY }));

      // Парсим выходные (если есть)
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

      // Изначально показываем будни (weekdays) в направлении forward
      activeTab = 'weekdays';
      showForward = true;
      routeTitle.textContent = 'Yonago → Sakaiminato';
      renderTrains(weekdaysForward);
    },
    error: err => {
      trainsList.innerHTML = `<div class="text-danger">Ошибка загрузки CSV: ${err.message}</div>`;
    }
  });

  // Обработчик кликов на табе «WEEKDAYS»
  weekdaysTab.addEventListener('click', () => {
    if (activeTab === 'weekdays') return;
    activeTab = 'weekdays';
    showForward = true;
    // Подсветим активный таб
    weekdaysTab.classList.remove('text-muted');
    weekdaysTab.style.textDecoration = 'underline';
    weekendsTab.classList.add('text-muted');
    weekendsTab.style.textDecoration = 'none';

    routeTitle.textContent = 'Yonago → Sakaiminato';
    renderTrains(weekdaysForward);
  });

  // Обработчик кликов на табе «WEEKENDS»
  weekendsTab.addEventListener('click', () => {
    if (activeTab === 'weekends') return;
    activeTab = 'weekends';
    showForward = true;
    // Подсветим активный таб
    weekendsTab.classList.remove('text-muted');
    weekendsTab.style.textDecoration = 'underline';
    weekdaysTab.classList.add('text-muted');
    weekdaysTab.style.textDecoration = 'none';

    routeTitle.textContent = 'Yonago → Sakaiminato';
    renderTrains(weekendsForward);
  });

  // Кнопка «Opposite Direction»
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
});
