from flask import Flask, request, jsonify
import swisseph as swe
from datetime import datetime
import pytz
import requests

app = Flask(__name__)

# Swiss Ephemeris dosya yolu (kendi yolunuzu buraya ekleyin)
swe.set_ephe_path("./Astrolog_AI")

# OpenCage API anahtarınızı buraya ekleyin
OPENCAGE_API_KEY = "242313ae99454edbb5a7b4eaa5a09d2b"

def get_coordinates_and_timezone(location):
    """
    OpenCage API ile koordinatları ve saat dilimini alır.
    """
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

def calculate_individual_chart(person):
    """
    Bireysel harita hesaplaması yapar.
    """
    birth_date = person["birth_date"]
    location = person["location"]
    coordinates, timezone = get_coordinates_and_timezone(location)

    # Doğum saatini UTC'ye çevirme
    local_tz = pytz.timezone(timezone)
    birth_datetime = datetime.strptime(birth_date, "%Y-%m-%d %H:%M:%S")
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
        position, _ = swe.calc_ut(julian_day, planet_id)
        positions[planet] = position[0]

    return positions, houses, timezone

def calculate_house_interactions(positions1, houses2, positions2, houses1):
    """
    Ev etkileşimlerini hesaplar.
    """
    def get_house(degree, houses):
        for i, house_start in enumerate(houses):
            next_house = houses[(i + 1) % 12]
            if house_start <= degree < next_house or (house_start > next_house and (degree >= house_start or degree < next_house)):
                return i + 1
        return None

    interactions = {
        "person1_to_person2": {},
        "person2_to_person1": {}
    }

    for planet, degree in positions1.items():
        house = get_house(degree, houses2)
        interactions["person1_to_person2"][planet] = house

    for planet, degree in positions2.items():
        house = get_house(degree, houses1)
        interactions["person2_to_person1"][planet] = house

    return interactions

def calculate_aspects_between_charts(positions1, positions2, orb=8):
    """
    İki kişinin gezegenleri arasındaki açıları hesaplar.
    """
    aspects = []
    aspect_types = {
        "Conjunction": 0,
        "Opposition": 180,
        "Square": 90,
        "Trine": 120,
        "Sextile": 60
    }

    for planet1, degree1 in positions1.items():
        for planet2, degree2 in positions2.items():
            diff = abs(degree1 - degree2)
            if diff > 180:
                diff = 360 - diff

            for aspect_name, aspect_angle in aspect_types.items():
                if abs(diff - aspect_angle) <= orb:
                    aspects.append({
                        "planet1": planet1,
                        "planet2": planet2,
                        "aspect": aspect_name,
                        "degree_diff": diff
                    })

    return aspects

@app.route('/synastry', methods=['POST'])
def calculate_synastry():
    try:
        data = request.json
        person1 = data.get("person1")
        person2 = data.get("person2")

        if not person1 or not person2:
            raise ValueError("Her iki kişinin bilgileri de sağlanmalıdır.")

        positions1, houses1, timezone1 = calculate_individual_chart(person1)
        positions2, houses2, timezone2 = calculate_individual_chart(person2)

        house_interactions = calculate_house_interactions(positions1, houses2, positions2, houses1)
        aspects = calculate_aspects_between_charts(positions1, positions2)

        return jsonify({
            "person1": {
                "positions": positions1,
                "houses": houses1
            },
            "person2": {
                "positions": positions2,
                "houses": houses2
            },
            "house_interactions": house_interactions,
            "aspects": aspects
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Bir hata oluştu: " + str(e)}), 500

@app.route('/natal-chart', methods=['POST'])
def calculate_natal_chart():
    try:
        data = request.json
        birth_date = data.get("birth_date")
        location = data.get("location")

        if not birth_date or not location:
            raise ValueError("Doğum tarihi ve konumu sağlanmalıdır.")

        positions, houses, timezone = calculate_individual_chart({
            "birth_date": birth_date,
            "location": location
        })

        return jsonify({
            "positions": positions,
            "houses": houses,
            "timezone": timezone
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Bir hata oluştu: " + str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
