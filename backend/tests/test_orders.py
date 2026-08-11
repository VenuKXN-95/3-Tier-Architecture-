def test_order_checkout(client):
    user_id = "user_test_checkout"

    cat_res = client.post("/api/categories", json={"name": "Gaming", "slug": "gaming"})
    cat_id = cat_res.json()["id"]

    prod_res = client.post(
        "/api/products",
        json={
            "name": "Gaming Mouse",
            "slug": "gaming-mouse",
            "price": 49.99,
            "category_id": cat_id,
            "stock": 10,
        },
    )
    prod_id = prod_res.json()["id"]

    client.post(
        f"/api/cart/{user_id}/items", json={"product_id": prod_id, "quantity": 1}
    )

    order_res = client.post(
        "/api/orders",
        json={
            "user_id": user_id,
            "shipping_address": {
                "street": "123 Main St",
                "city": "Tech City",
                "state": "CA",
                "postal_code": "90001",
                "country": "USA",
            },
        },
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert order_data["user_id"] == user_id
    assert order_data["status"] == "pending"
    assert "id" in order_data

    order_id = order_data["id"]
    get_res = client.get(f"/api/orders/{order_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == order_id
