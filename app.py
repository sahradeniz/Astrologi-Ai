import os
import logging
from logging.handlers import RotatingFileHandler
import pytz
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import requests
import swisseph as swe
from functools import wraps
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

# Create logs directory if it doesn't exist
if not os.path.exists('logs'):
    os.makedirs('logs')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('logs/app.log', maxBytes=10000000, backupCount=5),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "https://astrologi-ai.vercel.app",
            "https://astrologi-ai.onrender.com"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')  # Change in production

load_dotenv()

# Initialize Swiss Ephemeris
EPHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ephe')
logger.info(f"Setting Swiss Ephemeris path to: {EPHE_PATH}")

if os.path.exists(EPHE_PATH):
    swe.set_ephe_path(EPHE_PATH)
    logger.info("Swiss Ephemeris path set successfully")
else:
    logger.error(f"Swiss Ephemeris path does not exist: {EPHE_PATH}")
    raise RuntimeError("Swiss Ephemeris files not found")

# Test Swiss Ephemeris initialization
try:
    test_jd = swe.julday(2000, 1, 1, 0)
    test_pos = swe.calc_ut(test_jd, 0)  # 0 is Sun
    logger.info("Swiss Ephemeris initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Swiss Ephemeris: {str(e)}")
    raise RuntimeError(f"Swiss Ephemeris initialization failed: {str(e)}")

# Planet constants
PLANETS = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mercury': swe.MERCURY,
    'Venus': swe.VENUS,
    'Mars': swe.MARS,
    'Jupiter': swe.JUPITER,
    'Saturn': swe.SATURN,
    'Uranus': swe.URANUS,
    'Neptune': swe.NEPTUNE,
    'Pluto': swe.PLUTO
}

# Get API keys
ASTROLOGY_API_KEY = os.getenv('ASTROLOGY_API_KEY')
OPENCAGE_API_KEY = os.getenv('OPENCAGE_API_KEY')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            data = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data  # In production, you'd query your database here
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def get_coordinates_and_timezone(location):
    """Get coordinates and timezone for a location using OpenCage API."""
    try:
        if not OPENCAGE_API_KEY or OPENCAGE_API_KEY == 'your_opencage_api_key_here':
            raise ValueError("OpenCage API key is not properly configured")

        url = f"https://api.opencagedata.com/geocode/v1/json?q={location}&key={OPENCAGE_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        if not data['results']:
            return {
                'error': f'Location not found: {location}'
            }

        result = data['results'][0]
        coords = result['geometry']
        timezone = result['annotations']['timezone']['name']

        return {
            'latitude': coords['lat'],
            'longitude': coords['lng'],
            'timezone': timezone
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"OpenCage API request failed: {str(e)}")
        return {
            'error': 'Failed to get location coordinates',
            'details': str(e)
        }
    except Exception as e:
        logger.error(f"Error processing location data: {str(e)}")
        return {
            'error': 'Error processing location data',
            'details': str(e)
        }

def calculate_chart(birth_date, birth_time, location):
    """Calculate astrological chart data."""
    try:
        # Parse and standardize date format
        if isinstance(birth_date, str):
            if '.' in birth_date:
                day, month, year = map(int, birth_date.split('.'))
                birth_date = f"{year:04d}-{month:02d}-{day:02d}"
            elif '-' in birth_date:
                year, month, day = map(int, birth_date.split('-'))
                # Validate date components
                if not (1 <= month <= 12 and 1 <= day <= 31):
                    raise ValueError("Invalid date components")
                birth_date = f"{year:04d}-{month:02d}-{day:02d}"
            else:
                raise ValueError("Invalid date format. Use DD.MM.YYYY or YYYY-MM-DD")

        # Combine date and time
        birth_datetime = f"{birth_date} {birth_time}"
        
        # Get coordinates and timezone
        coordinates, timezone = location['latitude'], location['longitude'], location['timezone']
        
        # Convert to UTC
        try:
            local_dt = datetime.strptime(birth_datetime, "%Y-%m-%d %H:%M")
            local_tz = pytz.timezone(timezone)
            local_dt = local_tz.localize(local_dt)
            utc_dt = local_dt.astimezone(pytz.UTC)
        except ValueError as e:
            logger.error(f"Error parsing datetime: {str(e)}")
            raise ValueError("Invalid date or time format")
        
        # Calculate Julian day
        jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                       utc_dt.hour + utc_dt.minute/60.0)
        
        # Calculate houses
        houses, ascmc = swe.houses(jd, coordinates[0], coordinates[1], b'P')
        
        # Calculate planet positions
        planets = {}
        for name, planet_id in PLANETS.items():
            try:
                logger.info(f"Calculating position for {name} (ID: {planet_id})")
                ret, xx = swe.calc_ut(jd, planet_id)
                
                if ret < 0:
                    logger.error(f"Swiss Ephemeris error for {name}: {ret}")
                    raise ValueError(f"Error calculating {name} position")

                planets[name] = {
                    'longitude': xx[0],
                    'latitude': xx[1],
                    'distance': xx[2],
                    'speed': xx[3]
                }
                logger.info(f"Position calculated for {name}: {planets[name]}")
            except Exception as e:
                logger.error(f"Error calculating {name} position: {str(e)}")
                raise ValueError(f"Failed to calculate {name} position: {str(e)}")

        if not planets:
            logger.error("No planet positions were calculated")
            raise ValueError("Failed to calculate any planet positions")
        
        return {
            'planets': planets,
            'houses': houses,
            'ascmc': ascmc,
            'coordinates': coordinates,
            'timezone': timezone
        }
    except Exception as e:
        logger.error(f"Error calculating chart: {str(e)}")
        raise ValueError(str(e))

def get_aspect(longitude1, longitude2, orbs):
    """Calculate aspect between two planets."""
    # Calculate the angular distance between the planets
    diff = abs(longitude1 - longitude2)
    if diff > 180:
        diff = 360 - diff

    # Check for aspects with their orbs
    aspects = {
        'conjunction': (0, orbs['conjunction']),
        'sextile': (60, orbs['sextile']),
        'square': (90, orbs['square']),
        'trine': (120, orbs['trine']),
        'opposition': (180, orbs['opposition'])
    }

    for aspect_type, (angle, orb) in aspects.items():
        if abs(diff - angle) <= orb:
            return {
                'type': aspect_type,
                'orb': abs(diff - angle)
            }

    return None

@app.route('/api/calculate-birth-chart', methods=['POST'])
def calculate_natal_chart():
    try:
        logger.info("=== Starting birth chart calculation ===")
        data = request.get_json()
        logger.info(f"Received request data: {data}")
        
        # Input validation
        required_fields = ['birth_date', 'birth_time', 'birth_place']
        if not all(field in data for field in required_fields):
            missing = [field for field in required_fields if field not in data]
            error_msg = f"Missing required fields: {', '.join(missing)}"
            logger.error(error_msg)
            return jsonify({
                'error': 'Missing required fields',
                'required_fields': required_fields,
                'missing_fields': missing
            }), 400

        birth_date = data['birth_date']
        birth_time = data['birth_time']
        birth_place = data['birth_place']

        logger.info(f"Processing request - Date: {birth_date}, Time: {birth_time}, Place: {birth_place}")

        # Validate date format
        try:
            datetime.strptime(birth_date, '%d.%m.%Y')
        except ValueError as e:
            error_msg = 'Invalid date format. Please use DD.MM.YYYY'
            logger.error(f"{error_msg}: {str(e)}")
            return jsonify({
                'error': error_msg
            }), 400

        # Validate time format
        try:
            datetime.strptime(birth_time, '%H:%M')
        except ValueError as e:
            error_msg = 'Invalid time format. Please use HH:MM (24-hour format)'
            logger.error(f"{error_msg}: {str(e)}")
            return jsonify({
                'error': error_msg
            }), 400

        # Get coordinates and timezone
        logger.info(f"Getting coordinates for location: {birth_place}")
        location_data = get_coordinates_and_timezone(birth_place)
        if 'error' in location_data:
            logger.error(f"Location error: {location_data['error']}")
            return jsonify(location_data), 400

        logger.info(f"Location data retrieved: {location_data}")

        # Calculate chart
        try:
            logger.info("Calculating birth chart...")
            chart_data = calculate_chart(birth_date, birth_time, location_data)
            logger.info("Birth chart calculation completed successfully")
            return jsonify(chart_data)
        except Exception as e:
            error_msg = f"Error calculating chart: {str(e)}"
            logger.error(error_msg)
            return jsonify({
                'error': 'Error calculating birth chart',
                'details': str(e)
            }), 500

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            'error': 'An unexpected error occurred',
            'details': str(e)
        }), 500

@app.route('/api/calculate-synastry', methods=['POST'])
def calculate_synastry():
    """Calculate synastry between two charts."""
    try:
        data = request.get_json()
        person1 = data.get('person1')
        person2 = data.get('person2')
        
        if not all([person1, person2]):
            return jsonify({'error': 'Missing data for both people'}), 400
            
        chart1 = calculate_chart(
            person1['birth_date'],
            person1['birth_time'],
            person1['location']
        )
        
        chart2 = calculate_chart(
            person2['birth_date'],
            person2['birth_time'],
            person2['location']
        )
        
        # Calculate aspects between charts
        aspects = calculate_synastry_aspects(chart1['planets'], chart2['planets'])
        
        return jsonify({
            'chart1': chart1,
            'chart2': chart2,
            'aspects': aspects
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/calculate-transits', methods=['POST'])
def calculate_transits():
    """Calculate current transits for a natal chart."""
    try:
        data = request.get_json()
        birth_date = data.get('birth_date')
        birth_time = data.get('birth_time')
        location = data.get('location')
        
        if not all([birth_date, birth_time, location]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Calculate natal chart
        natal_chart = calculate_chart(birth_date, birth_time, location)
        
        # Calculate current transits
        now = datetime.now(pytz.UTC)
        transit_chart = calculate_chart(
            now.strftime('%Y-%m-%d'),
            now.strftime('%H:%M'),
            location
        )
        
        # Calculate aspects between natal and transit
        transit_aspects = calculate_transit_aspects(
            natal_chart['planets'],
            transit_chart['planets']
        )
        
        return jsonify({
            'natal_chart': natal_chart,
            'transit_chart': transit_chart,
            'aspects': transit_aspects
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_synastry_aspects(planets1, planets2):
    """Calculate aspects between two sets of planets."""
    aspects = []
    orbs = {
        'conjunction': 10,
        'sextile': 6,
        'square': 8,
        'trine': 8,
        'opposition': 10
    }
    
    for p1_name, p1_data in planets1.items():
        for p2_name, p2_data in planets2.items():
            aspect = get_aspect(
                p1_data['longitude'],
                p2_data['longitude'],
                orbs
            )
            if aspect:
                aspects.append({
                    'planet1': p1_name,
                    'planet2': p2_name,
                    'aspect': aspect['type'],
                    'orb': aspect['orb']
                })
    
    return aspects

def calculate_transit_aspects(natal_planets, transit_planets):
    """Calculate aspects between natal and transit planets."""
    return calculate_synastry_aspects(natal_planets, transit_planets)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)
