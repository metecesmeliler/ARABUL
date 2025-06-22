def test_register(client):
    resp = client.post("/register", json={"email": "u@test.com",
                                          "password": "Secret123"})
    assert resp.status_code == 200
    assert resp.json()["message"] == "User registered successfully"


def test_login(client):
    resp = client.post("/login", json={"email": "u@test.com",
                                       "password": "Secret123"})
    data = resp.json()
    assert resp.status_code == 200
    assert data["message"] == "Login successful"
    assert data["user_id"] == 42


def test_add_favourite(client):
    payload = {
        "user_id": 42,
        "supplier_id": "SUP123",
        "screen_opened_at": "2025-05-23T17:00:00",
        "favorited_at": "2025-05-23T17:00:01",
        "is_valid_favorite": True,
    }
    resp = client.post("/add-favourite", json=payload)
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_favorites_and_check(client):
    favs = client.get("/favorites/42").json()["favorites"]
    assert favs == ["SUP123"]

    is_fav = client.get("/is-favorite",
                        params={"user_id": 42, "supplier_id": "SUP123"})
    assert is_fav.json() == {"is_favorite": True}


def test_popular_and_sort_suppliers(client):
    pop = client.get("/popular-suppliers").json()
    assert pop == [{"supplier_id": "SUP123", "count": 10}]

    # make sure the sort endpoint re-orders by popularity
    body = {"suppliers": [{"SupplierID": "SUP999"},
                          {"SupplierID": "SUP123"}]}
    sorted_resp = client.post("/sort-suppliers", json=body).json()
    assert [s["SupplierID"] for s in sorted_resp] == ["SUP123", "SUP999"]


def test_complaints(client):
    submit = client.post("/submit-complaint",
                         json={"user_id": 42,
                               "complaint_text": "bad service"})
    assert submit.status_code == 200
    assert submit.json()["success"] is True

    lst = client.get("/complaints/42").json()["complaints"]
    assert lst and lst[0]["text"] == "test"


def test_supplier_details(client):
    d = client.get("/supplier/ABC").json()
    assert d["id"] == "ABC"
    assert d["name"] == "Test Co"


def test_profile_update(client):
    payload = {"old_email": "old@test.com", "old_password": "oldpw",
               "new_email": "new@test.com"}
    resp = client.post("/update-profile", json=payload)
    assert resp.status_code == 200
    assert resp.json()["email"] == "new@test.com"


def test_rating_endpoints(client):
    post = client.post("/rating",
                       json={"user_id": 42, "supplier_id": "SUP123",
                             "rating": 5,
                             "rated_at": "2025-05-23T17:01:00"})
    assert post.status_code == 200 and post.json()["success"]

    get_user = client.get("/rating/user",
                          params={"user_id": 42, "supplier_id": "SUP123"})
    assert get_user.json() == {"rating": 4}

    ranks = client.post("/rating/rankings",
                        json=["SUP123"]).json()
    assert ranks[0]["average_rating"] == 4.5
