def test_create_and_get_category(client):
    payload = {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Gadgets and tech",
    }
    response = client.post("/api/categories", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Electronics"
    assert "id" in data

    cat_id = data["id"]
    get_res = client.get(f"/api/categories/{cat_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Electronics"


def test_list_categories(client):
    client.post("/api/categories", json={"name": "Books", "slug": "books"})
    client.post("/api/categories", json={"name": "Clothing", "slug": "clothing"})

    response = client.get("/api/categories")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 2


def test_update_category(client):
    res = client.post("/api/categories", json={"name": "Home", "slug": "home"})
    cat_id = res.json()["id"]

    update_res = client.put(f"/api/categories/{cat_id}", json={"name": "Home & Garden"})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Home & Garden"


def test_delete_category(client):
    res = client.post("/api/categories", json={"name": "Sports", "slug": "sports"})
    cat_id = res.json()["id"]

    del_res = client.delete(f"/api/categories/{cat_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/categories/{cat_id}")
    assert get_res.status_code == 404
