import requests

url = 'https://sales-forecasting-dashboard-using-machine-learni-production.up.railway.app/health'
try:
    resp = requests.get(url, timeout=10)
    print('Status:', resp.status_code)
    print('Response:', resp.text)
except Exception as e:
    print('Error:', e)
