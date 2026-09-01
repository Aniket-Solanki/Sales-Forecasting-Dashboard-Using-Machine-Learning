import requests

url = 'https://sales-forecasting-dashboard-using-machine-learni-production.up.railway.app/api/v1/auth/register'
data = {'email': 'testabc12345@gmail.com', 'password': 'password123', 'role': 'admin'}
headers = {'Origin': 'https://sales-forecasting-dashboard-ml.vercel.app'}

try:
    resp = requests.post(url, json=data, headers=headers)
    print('Status:', resp.status_code)
    print('Response:', resp.text)
except Exception as e:
    print('Error:', e)
