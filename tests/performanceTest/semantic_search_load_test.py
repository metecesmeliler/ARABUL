# tests/performanceTest/semantic_search_load_test.py

from locust import HttpUser, between, task
import random

# Test queries
QUERIES = [
    "I am hungry",
    "My car broke down on the road",
    "I need someone to fix my faucet",
    "There is water leaking from the ceiling",
    "I need to fix a broken tile in my bathroom",
    "I’m looking for someone to paint my walls",
    "I need help installing a new kitchen sink",
    "There’s no water pressure in my shower"
]

class ChatNaceSearchUser(HttpUser):
    host = "http://localhost:8000"
    wait_time = between(1, 3) # Added wait time to get closer real life examples.

    @task
    def get_nace_codes(self):
        payload = {"query": random.choice(QUERIES)}
        self.client.post(
            "/chat/get_nace_codes",
            json=payload,
            name="/chat/get_nace_codes"
        )
