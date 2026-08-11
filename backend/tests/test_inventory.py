def test_inventory_management(client):
    cat_res = client.post(
        "/api/categories", json={"name": "Laptops", "slug": "laptops"}
    )
    cat_id = cat_res.json()["id"]

    prod_res = client.post(
        "/api/products",
        json={
            "name": "Pro Laptop",
            "slug": "pro-laptop",
            "price": 1299.99,
            "category_id": cat_id,
            "stock": 20,
        },
    )
    prod_id = prod_res.json()["id"]

    inv_res = client.get(f"/api/inventory/{prod_id}")
    assert inv_res.status_code == 200
    assert inv_res.json()["quantity"] == 20

    update_res = client.put(f"/api/inventory/{prod_id}", json={"quantity": 35})
    assert update_res.status_code == 200
    assert update_res.json()["quantity"] == 35
