import requests
try:
    response = requests.post("http://127.0.0.1:8000/chat", json={"message": "What is the penalty for theft?"})
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
