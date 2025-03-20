# sheets_time_series_api

Google Apps Script based API to get time series data from Google Sheets.

## Overview

This API provides endpoints to retrieve time series data from Google Sheets in different time intervals. It's particularly useful for monitoring data like temperature, humidity, and CO2 levels that are recorded periodically.

## Features

- Get last recorded values
- Get time series data in different intervals:
  - Hourly data for the last 24 hours
  - 5-minute intervals for the last hour
- Support for multiple sheets
- Customizable columns
- Flexible datetime column specification

## Deployment

1. Create a new Google Apps Script project
2. Copy the contents of `main.gs` to the project
3. Deploy as web app:
   - Click on "Deploy" > "New deployment"
   - Choose "Web app" as the deployment type
   - Set "Execute as" to your account
   - Set "Who has access" according to your needs
   - Click "Deploy"
4. After deployment, you will get a deployment URL. This is your API endpoint.

## API Usage

### Endpoint

The endpoint URL will be provided after deployment. It will look like:
```
GET https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
```

### Parameters

- `sheets` (required): Comma-separated list of `sheetId:sheetName` pairs
- `type` (optional): 
  - `last`: Get only the last recorded values
  - empty: Get time series data
- `columns` (optional): Comma-separated list of column names to retrieve
  - Default: `temperature,humidity,co2`

### Example Request

URL:
```
https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec?sheets=YOUR_SHEET_ID:Sheet1&type=last&columns=temperature,humidity
```

Using curl:
```bash
curl -L "https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec?sheets=YOUR_SHEET_ID:Sheet1&type=last&columns=temperature,humidity"
```

Using Python:
```python
import requests

url = "https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec"
params = {
    "sheets": "YOUR_SHEET_ID:Sheet1",
    "type": "last",
    "columns": "temperature,humidity"
}

response = requests.get(url, params=params)
data = response.json()
print(data)
```

### Response Format

For `type=last`:
```json
{
  "sheetId:sheetName": {
    "datetime": "2024-03-21T10:00:00Z",
    "temperature": 25.0,
    "humidity": 45.0
  }
}
```

For time series data:
```json
{
  "sheetId:sheetName": {
    "hourly24": {
      "datetime": ["2024-03-20T10:00:00Z", "2024-03-20T11:00:00Z", ...],
      "temperature": [24.0, 25.0, ...],
      "humidity": [44.0, 45.0, ...]
    },
    "5min1": {
      "datetime": ["2024-03-21T09:45:00Z", "2024-03-21T09:50:00Z", ...],
      "temperature": [24.5, 24.7, ...],
      "humidity": [44.5, 44.7, ...]
    }
  }
}
```

## Sheet Format Requirements

- First row must contain headers
- Must have a datetime column (default header name: "Datetime")
- Data should be recorded in chronological order

## Development

### Testing

The script includes a test function that can be run using script properties:
- `test_sheetId`: ID of the test sheet
- `test_sheetName`: Name of the test sheet

## Limitations

- Maximum lookback period is 24 hours
- Assumes 1-minute data frequency
- Maximum of 1500 rows processed per request