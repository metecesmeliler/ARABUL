from locust import HttpUser, between, task
import random

class BusinessListOnlyUser(HttpUser):
    wait_time = between(1, 2)
    host = "http://localhost:8000"

    nace_codes = ["I56.1", "F43.2", "G47.1", "N81.2", "S95.2"]
    cities = ["Lefkoşa", "Girne", "Gazimağusa", "Güzelyurt", "İskele"]

    @task
    def test_get_businesses(self):
        payload = {
            "naceCode": random.choice(self.nace_codes),
            "cities": [{"city": random.choice(self.cities)}],
            "latitude": 35.1856,
            "longitude": 33.3823
        }
        self.client.post("/chat/get_businesses", json=payload, name="/chat/get_businesses")
