import requests

url = 'http://127.0.0.1:8000/api/v1/auth/login'
data = {'username': 'ssaniket.2004@gmail.com', 'password': 'password123'}
response = requests.post(url, data=data)

print('Login Response Status:', response.status_code)
print('Login Response:', response.text)

if response.status_code == 200:
    token = response.json().get('access_token')
    me_url = 'http://127.0.0.1:8000/api/v1/auth/me'
    me_resp = requests.get(me_url, headers={'Authorization': f'Bearer {token}'})
    print('Me Response Status:', me_resp.status_code)
    print('Me Response:', me_resp.text)
