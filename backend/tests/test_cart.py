def test_cart_operations(client):
    user_id = "user_test_123"

    cat_res = client.post(
        "/api/categories", json={"name": "Accessories", "slug": "accessories"}
    )
    cat_id = cat_res.json()["id"]

    prod_res = client.post(
        "/api/products",
        json={
            "name": "USB Cable",
            "slug": "usb-cable",
            "price": 12.99,
            "category_id": cat_id,
            "stock": 100,
        },
    )
    prod_id = prod_res.json()["id"]

    add_res = client.post(
        f"/api/cart/{user_id}/items", json={"product_id": prod_id, "quantity": 2}
    )
    assert add_res.status_code == 200
    cart_data = add_res.json()
    assert cart_data["user_id"] == user_id
    assert len(cart_data["items"]) >= 1

    get_res = client.get(f"/api/cart/{user_id}")
    assert get_res.status_code == 200
    assert len(get_res.json()["items"]) >= 1

    clear_res = client.delete(f"/api/cart/{user_id}")
    assert clear_res.status_code == 200
    assert len(clear_res.json()["items"]) == 0
