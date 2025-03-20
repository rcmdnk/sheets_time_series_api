function getDataSeries(baseTime, interval, n, values, columns) {
  const series = {'datetime': []};
  columns.forEach(c => {
    series[c] = [];
  });
  for (let i = 0; i < n; i++) {
    const time = new Date(baseTime.getTime() - i * interval);
    const nextTime = new Date(baseTime.getTime() - (i - 1) * interval);
    const index = values['datetime'].findIndex(d => d >= time);
    if(index == -1) {
      break;
    }
    const minTime = values['datetime'][index];
    if(minTime >= nextTime) {
      if (index == 0) {
        break;
      }
      continue;
    }
    series['datetime'].unshift(time);
    columns.forEach(c => {
      series[c].unshift(values[c][index]);
    });
  }
  return series;
}

function getSheetValues(sheetId, sheetName, type, columns, datetimeColumn) {
  if (columns.length == 0) {
    columns = ['temperature', 'humidity', 'co2']
  }
  if (datetimeColumn === null) {
    datetimeColumn = 'Datetime';
  }
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnIndex = {};
  columnIndex['datetime'] = headers.findIndex(h => h === datetimeColumn);
  columns.forEach(c => {
    if (headers.includes(c)) {
      columnIndex[c] = headers.findIndex(h => h === c);
    }
  });

  const lastRow = sheet.getLastRow();

  if (type == 'last') {
    const values = {'datetime': sheet.getRange(lastRow, columnIndex['datetime'] + 1).getValue()};
    columns.forEach(c => {
      values[c] = sheet.getRange(lastRow, columnIndex[c] + 1).getValue();
    });
    return values;
  }

  const now = new Date();
  const minTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const maxRows = 60 * 25; // Assume 1min data, 25 hours
  let startRow = Math.max(lastRow - maxRows + 1, 2);
  const datetimes = sheet.getRange(startRow, columnIndex['datetime'] + 1, lastRow - startRow + 1, 1).getValues().map(d => new Date(d));
  const minIndex = datetimes.findIndex(d => d >= minTime);
  const values = {'datetime': datetimes.filter((d, i) => i >= minIndex)};
  columns.forEach(c => {
    values[c] = sheet.getRange(startRow + minIndex, columnIndex[c] + 1, lastRow - startRow - minIndex + 1, 1).getValues().map(v => v[0]);
  });

  const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const hourly24 = getDataSeries(currentHour, 60 * 60 * 1000, 25, values, columns);

  const current5min = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), Math.floor(now.getMinutes() / 5) * 5);
  const fiveMin1 = getDataSeries(current5min, 5 * 60 * 1000, 13, values, columns);
  return {'hourly24': hourly24, '5min1': fiveMin1};
}

function doGet(e) {
  const sheets = e.parameter.sheets.split(',');
  let type = "";
  if (e.parameter.type) {
    type = e.parameter.type;
  }
  let columns = []
  if (e.parameter.columns) {
    columns = e.parameter.columns.split(',');
  }
  const values = {};
  sheets.forEach(function(sheet) {
    const sheetId = sheet.split(':')[0];
    const sheetName = sheet.split(':')[1];
    values[sheet] = getSheetValues(sheetId, sheetName, type, columns);
  });
  return ContentService.createTextOutput(JSON.stringify(values)).setMimeType(ContentService.MimeType.JSON);
}

function test() {
  const properties = PropertiesService.getScriptProperties();
  const sheetId = properties.getProperty("test_sheetId");
  const sheetName = properties.getProperty("test_sheetName");
  let type = null;
  let columns = ['co2'];
  const datetimeColumn = 'Datetime';
  let values = getSheetValues(sheetId, sheetName, type, columns, datetimeColumn);
  console.log(values);
  type = 'last';
  columns = ['temperature', 'humidity', 'co2'];
  values = getSheetValues(sheetId, sheetName, type, columns, datetimeColumn);
  console.log(values);
}
