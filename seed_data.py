"""
Seed script to create 5 categories, 50 products, and initial inventory.
Executes against the running FastAPI REST API.
"""
import urllib.request
import json
import sys

API_BASE = "http://localhost:8000/api"

CATEGORIES = [
    {"name": "Electronics", "description": "Laptops, smartphones, audio gear, and gadgets"},
    {"name": "Fashion & Apparel", "description": "Trendy clothing, footwear, and accessories"},
    {"name": "Home & Kitchen", "description": "Furniture, decor, kitchenware, and smart appliances"},
    {"name": "Books & Media", "description": "Bestselling novels, technical guides, and vinyl records"},
    {"name": "Sports & Gaming", "description": "Consoles, gaming gear, fitness equipment, and activewear"},
]

PRODUCTS_DATA = [
    # ── Electronics (Category index 0) ──────────────────────────────
    {"cat_idx": 0, "name": "ProBook Ultra 15", "price": 1299.99, "stock": 25, "desc": "High-performance 15-inch laptop with 32GB RAM and OLED display", "img": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"},
    {"cat_idx": 0, "name": "SoundWave ANC Headphones", "price": 249.50, "stock": 40, "desc": "Wireless noise-canceling headphones with 40-hour battery life", "img": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"},
    {"cat_idx": 0, "name": "PixelVue 4K Monitor 27\"", "price": 389.00, "stock": 15, "desc": "IPS 4K UHD display with 144Hz refresh rate and HDR600", "img": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500"},
    {"cat_idx": 0, "name": "AuraPhone Pro 5G", "price": 899.00, "stock": 30, "desc": "Flagship smartphone with triple-lens camera and 120Hz display", "img": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"},
    {"cat_idx": 0, "name": "MechPulse RGB Keyboard", "price": 119.99, "stock": 50, "desc": "Hot-swappable mechanical gaming keyboard with per-key RGB", "img": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500"},
    {"cat_idx": 0, "name": "Precision Grip Wireless Mouse", "price": 69.99, "stock": 60, "desc": "Ergonomic wireless mouse with 26,000 DPI sensor", "img": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500"},
    {"cat_idx": 0, "name": "SonicSphere Bluetooth Speaker", "price": 89.95, "stock": 35, "desc": "Waterproof portable speaker with 360-degree spatial audio", "img": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"},
    {"cat_idx": 0, "name": "ChronoFit Smartwatch Ultra", "price": 299.00, "stock": 20, "desc": "Titanium smartwatch with GPS, heart rate monitor, and ECG", "img": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500"},
    {"cat_idx": 0, "name": "Lumina WebCam 4K", "price": 139.99, "stock": 45, "desc": "Ultra HD webcam with auto-framing and dual stereo microphones", "img": "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=500"},
    {"cat_idx": 0, "name": "StreamDock Pro Controller", "price": 159.00, "stock": 28, "desc": "Customizable studio controller with 15 LCD keys", "img": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500"},

    # ── Fashion & Apparel (Category index 1) ───────────────────────
    {"cat_idx": 1, "name": "Classic Denim Jacket", "price": 79.99, "stock": 45, "desc": "Vintage wash cotton denim jacket with reinforced stitching", "img": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500"},
    {"cat_idx": 1, "name": "Urban Runner Sneakers", "price": 119.00, "stock": 35, "desc": "Lightweight breathable mesh sneakers with cushioned sole", "img": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"},
    {"cat_idx": 1, "name": "Merino Wool Knit Sweater", "price": 95.50, "stock": 30, "desc": "100% Australian Merino wool crewneck sweater in charcoal", "img": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500"},
    {"cat_idx": 1, "name": "Tailored Slim-Fit Chinos", "price": 64.99, "stock": 50, "desc": "Stretch cotton chino pants designed for all-day comfort", "img": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500"},
    {"cat_idx": 1, "name": "Minimalist Leather Backpack", "price": 149.00, "stock": 20, "desc": "Full-grain Italian leather backpack with 15-inch laptop sleeve", "img": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500"},
    {"cat_idx": 1, "name": "Aviator Polarized Sunglasses", "price": 85.00, "stock": 40, "desc": "Classic metal frame sunglasses with UV400 polarized lenses", "img": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500"},
    {"cat_idx": 1, "name": "Organic Cotton Graphic Tee", "price": 29.99, "stock": 75, "desc": "Heavyweight organic cotton t-shirt with screen-printed art", "img": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500"},
    {"cat_idx": 1, "name": "Waterproof Trench Coat", "price": 189.99, "stock": 18, "desc": "Double-breasted trench coat with removable thermal lining", "img": "https://images.unsplash.com/photo-1544441893-675973e31985?w=500"},
    {"cat_idx": 1, "name": "Genuine Leather Belt", "price": 39.50, "stock": 60, "desc": "Handcrafted full-grain leather belt with brushed nickel buckle", "img": "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500"},
    {"cat_idx": 1, "name": "Athletic Fleece Hoodie", "price": 54.99, "stock": 55, "desc": "Ultra-soft cotton blend pullover hoodie with kangaroo pocket", "img": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500"},

    # ── Home & Kitchen (Category index 2) ─────────────────────────
    {"cat_idx": 2, "name": "Espresso Master Barista Machine", "price": 499.00, "stock": 12, "desc": "15-bar Italian pump espresso machine with integrated milk frother", "img": "https://images.unsplash.com/photo-1517668808822-9ebe02f2a6e8?w=500"},
    {"cat_idx": 2, "name": "Chef's Cut Ceramic Knife Set", "price": 79.99, "stock": 40, "desc": "6-piece precision ceramic kitchen knife set with wooden block", "img": "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500"},
    {"cat_idx": 2, "name": "Smart Air Purifier HEPA H13", "price": 159.50, "stock": 22, "desc": "Captures 99.97% of airborne particles with app control", "img": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500"},
    {"cat_idx": 2, "name": "Non-Stick Cast Iron Skillet", "price": 44.99, "stock": 50, "desc": "Pre-seasoned 12-inch heavy-duty cast iron skillet", "img": "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500"},
    {"cat_idx": 2, "name": "Ergonomic Mesh Office Chair", "price": 229.00, "stock": 18, "desc": "Adjustable lumbar support chair with 3D armrests", "img": "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=500"},
    {"cat_idx": 2, "name": "Minimalist Desk Lamp LED", "price": 34.99, "stock": 65, "desc": "Dimmable touch-control LED desk lamp with wireless charging pad", "img": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500"},
    {"cat_idx": 2, "name": "Aromatherapy Ultrasonic Diffuser", "price": 28.50, "stock": 70, "desc": "500ml essential oil diffuser with 7 ambient LED colors", "img": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500"},
    {"cat_idx": 2, "name": "Robot Vacuum & Mop Combo", "price": 349.99, "stock": 15, "desc": "LiDAR navigation robot vacuum with auto-empty station", "img": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500"},
    {"cat_idx": 2, "name": "French Press Glass Coffee Maker", "price": 24.99, "stock": 80, "desc": "Heat-resistant borosilicate glass coffee press 34 oz", "img": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500"},
    {"cat_idx": 2, "name": "Luxury Egyptian Cotton Towel Set", "price": 49.99, "stock": 45, "desc": "6-piece 700 GSM plush bath towel collection", "img": "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=500"},

    # ── Books & Media (Category index 3) ──────────────────────────
    {"cat_idx": 3, "name": "Designing Data-Intensive Applications", "price": 42.99, "stock": 35, "desc": "The definitive guide to architecture, reliability, and scaling", "img": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500"},
    {"cat_idx": 3, "name": "Clean Code: A Handbook of Agile", "price": 38.50, "stock": 40, "desc": "Software craftsmanship principles by Robert C. Martin", "img": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500"},
    {"cat_idx": 3, "name": "Atomic Habits Hardcover", "price": 21.99, "stock": 90, "desc": "An easy & proven way to build good habits and break bad ones", "img": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500"},
    {"cat_idx": 3, "name": "The Pragmatic Programmer 20th Ed", "price": 45.00, "stock": 30, "desc": "Your journey to mastery in modern software engineering", "img": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500"},
    {"cat_idx": 3, "name": "Vinyl Record: Abbey Road Special", "price": 34.99, "stock": 25, "desc": "Remastered 180-gram audiophile vinyl pressing", "img": "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500"},
    {"cat_idx": 3, "name": "Sapiens: A Brief History of Humankind", "price": 19.99, "stock": 60, "desc": "International bestseller exploring 70,000 years of human history", "img": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500"},
    {"cat_idx": 3, "name": "System Design Interview Guide", "price": 36.00, "stock": 45, "desc": "Step-by-step framework for mastering system architecture", "img": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500"},
    {"cat_idx": 3, "name": "Dune Deluxe Hardcover Edition", "price": 29.99, "stock": 35, "desc": "Sci-fi epic masterpiece with stained edges and illustrated endpapers", "img": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500"},
    {"cat_idx": 3, "name": "Python Crash Course 3rd Ed", "price": 32.50, "stock": 50, "desc": "Hands-on, project-based introduction to Python programming", "img": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500"},
    {"cat_idx": 3, "name": "Audiophile Turntable Player", "price": 199.00, "stock": 15, "desc": "Belt-drive vinyl turntable with built-in preamp and Bluetooth", "img": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=500"},

    # ── Sports & Gaming (Category index 4) ────────────────────────
    {"cat_idx": 4, "name": "Pro Wireless Controller X", "price": 69.99, "stock": 50, "desc": "Low-latency wireless gamepad with haptic feedback and hall-effect sticks", "img": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500"},
    {"cat_idx": 4, "name": "UltraFit Yoga Mat Extra Thick", "price": 32.99, "stock": 70, "desc": "Non-slip eco-friendly TPE yoga mat with carrying strap", "img": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=500"},
    {"cat_idx": 4, "name": "Adjustable Dumbbell Set 50lbs", "price": 279.00, "stock": 16, "desc": "Quick-change weight selection system for home workouts", "img": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500"},
    {"cat_idx": 4, "name": "Virtual Reality Headset 128GB", "price": 399.00, "stock": 20, "desc": "All-in-one VR system with touch controllers and 4K display", "img": "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=500"},
    {"cat_idx": 4, "name": "Carbon Fiber Road Bicycle Helmet", "price": 89.99, "stock": 30, "desc": "Aerodynamic MIPS helmet with integrated rear safety light", "img": "https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=500"},
    {"cat_idx": 4, "name": "Pro Gaming Headset 7.1 Surround", "price": 99.50, "stock": 40, "desc": "50mm drivers with detachable noise-canceling mic", "img": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500"},
    {"cat_idx": 4, "name": "Insulated Stainless Water Bottle", "price": 27.99, "stock": 85, "desc": "32 oz vacuum insulated flask keeps drinks cold 24 hours", "img": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500"},
    {"cat_idx": 4, "name": "Gaming Ergonomic Floor Chair", "price": 149.00, "stock": 14, "desc": "Reclining rocker chair with built-in Bluetooth speakers", "img": "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=500"},
    {"cat_idx": 4, "name": "Resistance Bands Set 5-Level", "price": 19.99, "stock": 100, "desc": "Natural latex workout loops for strength training and rehab", "img": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500"},
    {"cat_idx": 4, "name": "Tournament Table Tennis Racket", "price": 45.00, "stock": 38, "desc": "ITTF approved 7-ply blade with sticky rubber for maximum spin", "img": "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=500"},
]

def make_request(url, method="GET", data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return json.loads(err_body), e.code

def seed():
    print("[*] Starting database seeding (5 Categories, 50 Products, 50 Inventory records)...")

    # 1. Create Categories
    created_categories = []
    for cat_data in CATEGORIES:
        res, code = make_request(f"{API_BASE}/categories", "POST", cat_data)
        if code in (201, 200):
            print(f"  + Category created: [{res['id']}] {res['name']}")
            created_categories.append(res)
        elif code == 409:
            # Fetch existing
            cats, _ = make_request(f"{API_BASE}/categories", "GET")
            existing = next((c for c in cats if c["name"] == cat_data["name"]), None)
            if existing:
                print(f"  > Category exists: [{existing['id']}] {existing['name']}")
                created_categories.append(existing)

    if len(created_categories) < 5:
        print("[X] Failed to resolve 5 categories")
        sys.exit(1)

    cat_id_map = {i: created_categories[i]["id"] for i in range(5)}

    # 2. Create Products & Inventory
    products_created = 0
    inventory_created = 0

    for item in PRODUCTS_DATA:
        cat_id = cat_id_map[item["cat_idx"]]
        prod_payload = {
            "name": item["name"],
            "description": item["desc"],
            "price": item["price"],
            "image_url": item["img"],
            "category_id": cat_id,
        }
        res, code = make_request(f"{API_BASE}/products", "POST", prod_payload)
        if code in (201, 200):
            prod_id = res["id"]
            products_created += 1
            # Create inventory
            inv_payload = {"product_id": prod_id, "quantity": item["stock"]}
            inv_res, inv_code = make_request(f"{API_BASE}/inventory", "POST", inv_payload)
            if inv_code in (201, 200):
                inventory_created += 1
                print(f"  + Product #{products_created}: '{item['name']}' (${item['price']}) | Stock: {item['stock']}")
            else:
                print(f"  ! Product #{products_created} created, but inventory failed: {inv_res}")
        else:
            print(f"  - Failed to create product '{item['name']}': {res}")

    print(f"\n[OK] Seeding complete!")
    print(f"   Categories: {len(created_categories)}")
    print(f"   Products:   {products_created}/50")
    print(f"   Inventory:  {inventory_created}/50")

if __name__ == "__main__":
    seed()
