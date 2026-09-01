import requests

url = 'https://sales-forecasting-dashboard-using-machine-learni-production.up.railway.app/api/v1'

# 1. Register
requests.post(url + '/auth/register', json={
    'email': 'testdata@gmail.com',
    'password': 'password123',
    'full_name': 'Test Data'
})

# 2. Login
login = requests.post(url + '/auth/login', data={
    'username': 'testdata@gmail.com',
    'password': 'password123'
})

if login.status_code == 200:
    token = login.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # 3. Test endpoints
    s = requests.get(url + '/sales/?limit=365', headers=headers)
    print('Sales:', s.status_code, s.text[:100])
    
    f = requests.get(url + '/forecasts/', headers=headers)
    print('Forecasts:', f.status_code, f.text[:100])
    
    p = requests.get(url + '/products/', headers=headers)
    print('Products:', p.status_code, p.text[:100])
else:
    print('Login failed:', login.status_code, login.text)
