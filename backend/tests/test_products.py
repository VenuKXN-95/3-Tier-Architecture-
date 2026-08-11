def test_create_and_get_product(client):
    cat_res = client.post("/api/categories", json={"name": "Audio", "slug": "audio"})
    cat_id = cat_res.json()["id"]

    prod_payload = {
        "name": "Wireless Headphones",
        "slug": "wireless-headphones",
        "description": "High quality sound",
        "price": 99.99,
        "category_id": cat_id,
        "stock": 50,
        "image_url": "https://example.com/headphones.jpg",
    }

    response = client.post("/api/products", json=prod_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Wireless Headphones"
    assert data["price"] == 99.99
    assert "id" in data

    prod_id = data["id"]
    get_res = client.get(f"/api/products/{prod_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Wireless Headphones"


def test_list_products(client):
    cat_res = client.post("/api/categories", json={"name": "Phones", "slug": "phones"})
    cat_id = cat_res.json()["id"]

    client.post(
        "/api/products",
        json={
            "name": "Smartphone X",
            "slug": "smartphone-x",
            "price": 699.00,
            "category_id": cat_id,
            "stock": 10,
        },
    )

    response = client.get("/api/products")
    assert response.status_code == 200
    assert len(response.json()) >= 1
