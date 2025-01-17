import os
from flask import Flask, request, jsonify
import swisseph as swe
from datetime import datetime
import pytz
import requests
from flask_cors import CORS
import logging

# Flask Uygulaması
app = Flask(__name__)
CORS(app, resources={r"/": {"origins": ""}})  # Tüm kaynaklara izin verir)

# Logging yapılandırması
logging.basicConfig(level=logging.INFO)

# Swiss Ephemeris yolu kontrolü
EPHE_PATH = os.environ.get('EPHE_PATH', '/opt/render/project/src/swisseph-master/ephe')
if os.path.exists(EPHE_PATH):
    logging.info(f"Swiss Ephemeris path exists: {EPHE_PATH}")
    swe.set_ephe_path(EPHE_PATH)
else:
    logging.error(f"Swiss Ephemeris path does not exist: {EPHE_PATH}")

# OpenCage API Anahtarı
OPENCAGE_API_KEY = "242313ae99454edbb5a7b4eaa5a09d2b"

def get_coordinates_and_timezone(location):
    """OpenCage API ile koordinatları ve saat dilimini alır."""
    url = f"https://api.opencagedata.com/geocode/v1/json?q={location}&key={OPENCAGE_API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data['results']:
            coordinates = data['results'][0]['geometry']
            timezone = data['results'][0]['annotations']['timezone']['name']
            return coordinates, timezone
        else:
            raise ValueError("Konum bulunamadı.")
    else:
        raise ValueError("OpenCage API hatası.")

def parse_date(birth_date):
    """Doğum tarihini uygun bir formatta parse eder."""
    try:
        return datetime.strptime(birth_date, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return datetime.strptime(birth_date, "%Y-%m-%d %H:%M")

def degree_to_sign_and_position(degree):
    """Dereceyi burç ve burç içindeki pozisyon olarak döndürür."""
    signs = ["Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak", "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"]
    index = int(degree // 30)  # Burç indeksi
    sign = signs[index]
    position_in_sign = degree % 30  # Burç içindeki derece
    return sign, round(position_in_sign, 2)

def calculate_house_signs(houses):
    """Evlerin burçlarını ve derecelerini hesaplar."""
    house_signs = []
    for degree in houses:
        sign, position = degree_to_sign_and_position(degree)
        house_signs.append({"burç": sign, "derece": position})
    return house_signs

def find_house(degree, houses):
    """Gezegenin hangi evde olduğunu belirler."""
    for i in range(len(houses)):
        if houses[i] <= degree < houses[(i + 1) % len(houses)]:
            return i + 1
    return None

def calculate_aspect(degree1, degree2):
    """İki derece arasındaki açıyı ve orb değerini hesaplar."""
    aspects = {
        "Kavuşum": 0,
        "Kare": 90,
        "Karşıtlık": 180,
        "Üçgen": 120,
        "Sextil": 60
    }
    orb = 5  # Orb değeri
    difference = abs(degree1 - degree2) % 360
    for aspect, exact_degree in aspects.items():
        if abs(difference - exact_degree) <= orb:
            return f"{aspect} (orb: {abs(difference - exact_degree)})"
    return None

def calculate_individual_chart(person):
    """Bireysel harita hesaplaması yapar."""
    birth_date = person["birth_date"]
    location = person["location"]
    coordinates, timezone = get_coordinates_and_timezone(location)

    # Doğum saatini UTC'ye çevirme
    local_tz = pytz.timezone(timezone)
    birth_datetime = parse_date(birth_date)
    birth_datetime = local_tz.localize(birth_datetime).astimezone(pytz.utc)

    # Swiss Ephemeris için tarih formatı
    year, month, day, hour = birth_datetime.year, birth_datetime.month, birth_datetime.day, birth_datetime.hour + birth_datetime.minute / 60
    julian_day = swe.julday(year, month, day, hour)

    # Ev hesaplama
    lat, lng = coordinates["lat"], coordinates["lng"]
    houses, _ = swe.houses(julian_day, lat, lng, b'A')

    # Gezegenlerin pozisyonlarını hesaplama
    planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
    positions = {}
    for planet in planets:
        planet_id = getattr(swe, planet.upper(), None)
        if planet_id is not None:
            position, _ = swe.calc_ut(julian_day, planet_id)
            positions[planet] = position[0]
        else:
            logging.warning(f"Planet ID not found for {planet}")

    # Gezegenlerin burç ve ev bilgilerini ekleme
    results = {}
    for planet, degree in positions.items():
        sign, position_in_sign = degree_to_sign_and_position(degree)
        house = find_house(degree, houses)
        results[planet] = {"burç": sign, "derece": position_in_sign, "ev": house}

    # Gezegenler arası açıları hesaplama
    aspects = {}
    planet_keys = list(positions.keys())
    for i in range(len(planet_keys)):
        for j in range(i + 1, len(planet_keys)):
            aspect = calculate_aspect(positions[planet_keys[i]], positions[planet_keys[j]])
            if aspect:
                aspects[f"{planet_keys[i]} - {planet_keys[j]}"] = aspect

    # Evlerin burçlarını ve derecelerini hesapla
    house_signs = calculate_house_signs(houses)

    return results, aspects, house_signs, timezone

@app.route('/natal-chart', methods=['POST'])
def calculate_natal_chart():
    """Natal harita hesaplama endpoint."""
    try:
        data = request.json
        birth_date = data.get("birth_date")
        location = data.get("location")

        if not birth_date or not location:
            raise ValueError("Doğum tarihi ve konumu sağlanmalıdır.")

        planets, aspects, house_signs, timezone = calculate_individual_chart({
            "birth_date": birth_date,
            "location": location
        })

        return jsonify({
    "gezegenler": planets,
    "açılar": aspects,
    "evler": house_signs,
    "timezone": timezone
        })
    except ValueError as ve:
        logging.error(f"Validation error: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        return jsonify({"error": "Bir hata oluştu: " + str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)