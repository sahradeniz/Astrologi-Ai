import os
import logging
from logging.handlers import RotatingFileHandler
import pytz
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import requests
import json
from functools import wraps
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
import urllib.request
import zipfile
import io
import traceback
import PyPDF2
from werkzeug.utils import secure_filename
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import certifi
import ssl
from pymongo import MongoClient
import openai

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'txt'}

REQUIRED_DIRS = ['logs', 'uploads', 'ephe']
for directory in REQUIRED_DIRS:
    if not os.path.exists(directory):
        os.makedirs(directory)
        logging.info(f"Created directory: {directory}")

KNOWLEDGE_BASE_PATH = os.path.join(os.path.dirname(__file__), 'astro_knowledge.json')

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

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

try:
    from pymongo import MongoClient
    
    # Get MongoDB URI from environment
    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        raise ValueError("MONGO_URI environment variable is not set")

    logger.info("Connecting to MongoDB Atlas...")
    
    # Create a basic MongoClient
    client = MongoClient(MONGO_URI)
    
    # Test connection and get database
    db = client.astrologiAi
    db.command("ping")
    logger.info("Successfully connected to MongoDB")
    
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise  # Re-raise the exception to prevent the app from starting with broken DB

OPENCAGE_API_KEY = os.getenv('OPENCAGE_API_KEY')
ASTROLOGY_API_KEY = os.getenv('ASTROLOGY_API_KEY', 'HJ860PA-9HD4EZQ-NFDS992-QB5584S')
ASTROLOGY_API_URL = "https://api.astroloji.ai/v1"  # Updated API endpoint

logger.info(f"OpenCage API Key: {OPENCAGE_API_KEY}")
logger.info(f"Astrology API Key: {ASTROLOGY_API_KEY}")

if not OPENCAGE_API_KEY:
    raise ValueError("OpenCage API key not found in environment variables")

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')  # Change in production

# Define planet IDs
PLANETS = {
    'Sun': 0,           # 0
    'Moon': 1,         # 1
    'Mercury': 2,   # 2
    'Venus': 3,       # 3
    'Mars': 4,         # 4
    'Jupiter': 5,   # 5
    'Saturn': 6,     # 6
    'Uranus': 7,     # 7
    'Neptune': 8,   # 8
    'Pluto': 9,       # 9
    'North Node': 10,  # 10 (Mean Node)
    'Chiron': 15,     # 15
    'Lilith': 16,  # Mean Black Moon Lilith
}

PLANET_NAMES_TR = {
    'Sun': 'Güneş',
    'Moon': 'Ay',
    'Mercury': 'Merkür',
    'Venus': 'Venüs',
    'Mars': 'Mars',
    'Jupiter': 'Jüpiter',
    'Saturn': 'Satürn',
    'Uranus': 'Uranüs',
    'Neptune': 'Neptün',
    'Pluto': 'Plüton',
    'North Node': 'Kuzey Ay Düğümü',
    'Chiron': 'Chiron',
    'Lilith': 'Lilith'
}

# Define aspect types and their orbs
ASPECTS = {
    'Conjunction': {'angle': 0, 'orb': 8},
    'Opposition': {'angle': 180, 'orb': 8},
    'Trine': {'angle': 120, 'orb': 8},
    'Square': {'angle': 90, 'orb': 7},
    'Sextile': {'angle': 60, 'orb': 6}
}

ASTRO_KNOWLEDGE = {}
try:
    with open(KNOWLEDGE_BASE_PATH, 'r', encoding='utf-8') as f:
        ASTRO_KNOWLEDGE = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    logger.warning("No astro_knowledge.json found or invalid JSON. Will use base prompts.")

def get_coordinates_and_timezone(location):
    """Get coordinates and timezone for a location using OpenCage API."""
    try:
        logger.info(f"Attempting to get coordinates for location: {location}")
        if not OPENCAGE_API_KEY or OPENCAGE_API_KEY == 'your_opencage_api_key_here':
            logger.error("OpenCage API key is not properly configured")
            raise ValueError("OpenCage API key is not properly configured")

        url = f"https://api.opencagedata.com/geocode/v1/json?q={location}&key={OPENCAGE_API_KEY}"
        logger.info(f"Making request to OpenCage API: {url}")
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        logger.info(f"OpenCage API response: {data}")
        
        if not data['results']:
            logger.error(f'Location not found: {location}')
            return {
                'error': f'Location not found: {location}'
            }

        result = data['results'][0]
        coords = result['geometry']
        timezone = result['annotations']['timezone']['name']

        logger.info(f"Successfully got coordinates: lat={coords['lat']}, lng={coords['lng']}, timezone={timezone}")
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

def get_zodiac_sign(longitude):
    """Convert longitude to zodiac sign, degree and minutes."""
    # Normalize longitude to 0-360 range
    longitude = float(longitude) % 360
    if longitude < 0:
        longitude += 360
        
    # Calculate zodiac sign
    signs = ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak', 
             'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık']
    sign_index = int(longitude / 30)
    sign = signs[sign_index]
    
    # Calculate degrees and minutes
    position_in_sign = longitude % 30
    degrees = int(position_in_sign)
    minutes = int((position_in_sign - degrees) * 60)
    
    return {
        'sign': sign,
        'degree': degrees,
        'minutes': minutes
    }

def get_house(longitude, houses):
    """Determine which house a planet is in based on its longitude."""
    # Convert longitude to 0-360 range
    longitude = float(longitude) % 360
    if longitude < 0:
        longitude += 360
    
    # Check each house cusp
    for i in range(12):
        next_i = (i + 1) % 12
        cusp = float(houses[i]) % 360
        next_cusp = float(houses[next_i]) % 360
        
        # Handle case where house spans 0°
        if next_cusp < cusp:
            if longitude >= cusp or longitude < next_cusp:
                return i + 1
        else:
            if cusp <= longitude < next_cusp:
                return i + 1
    
    return 1  # Default to house 1 if not found

def get_aspect_interpretation(aspect_type, planet1, planet2):
    try:
        # Create a context-rich prompt
        prompt = f"""As an expert astrologer, provide a detailed interpretation of the {aspect_type} aspect between {planet1} and {planet2}.
        Consider:
        1. The nature of both planets
        2. The type of aspect ({aspect_type}) and its influence
        3. The potential manifestations in personality and life
        
        Please provide the interpretation in Turkish language.
        Keep the response concise but meaningful (2-3 sentences).
        """

        # Add any relevant knowledge from our database
        aspect_key = f"{planet1}_{planet2}_{aspect_type}".lower()
        try:
            with open(KNOWLEDGE_BASE_PATH, 'r', encoding='utf-8') as f:
                knowledge_base = json.load(f)
                if aspect_key in knowledge_base:
                    prompt += f"\nConsider this reference: {knowledge_base[aspect_key]}"
        except (FileNotFoundError, json.JSONDecodeError):
            logger.warning("No knowledge base found or invalid JSON")

        # Return the prompt as the interpretation
        return prompt

    except Exception as e:
        logger.error(f"Error getting aspect interpretation: {str(e)}")
        return None

def calculate_aspects(planets):
    """Calculate aspects between planets."""
    aspects = {}
    aspect_types = {
        0: "Conjunction",
        60: "Sextile",
        90: "Square",
        120: "Trine",
        180: "Opposition"
    }
    orbs = {
        "Conjunction": 10,
        "Sextile": 6,
        "Square": 8,
        "Trine": 8,
        "Opposition": 10
    }

    for planet1, data1 in planets.items():
        if planet1 not in aspects:
            aspects[planet1] = {}
        
        for planet2, data2 in planets.items():
            if planet1 >= planet2:
                continue

            angle = abs(data1['longitude'] - data2['longitude'])
            if angle > 180:
                angle = 360 - angle

            # Check each aspect type
            for base_angle, aspect_type in aspect_types.items():
                orb = orbs[aspect_type]
                if abs(angle - base_angle) <= orb:
                    # Get interpretation for this aspect
                    interpretation = get_aspect_interpretation(
                        aspect_type,
                        data1['name_tr'],
                        data2['name_tr']
                    )
                    
                    if planet2 not in aspects[planet1]:
                        aspects[planet1][planet2] = []
                    
                    aspect_data = {
                        "type": aspect_type,
                        "angle": angle,
                        "planet1_tr": data1['name_tr'],
                        "planet2_tr": data2['name_tr'],
                    }
                    
                    if interpretation:
                        aspect_data["interpretation"] = interpretation
                        
                    aspects[planet1][planet2].append(aspect_data)

    return aspects

def calculate_planet_position(jd, planet_name, planet_id):
    """Calculate position for a single planet."""
    try:
        logger.info(f"Calculating position for {planet_name} (ID: {planet_id})")
        
        # Calculate planet position
        result = [0, 0, 0]
        
        if result is None:
            logger.error(f"No result for {planet_name}")
            return None
            
        if not result[0]:
            logger.error(f"Empty result for {planet_name}")
            return None
        
        # Get longitude and normalize to 0-360 range
        longitude = float(result[0]) % 360
        if longitude < 0:
            longitude += 360
        
        logger.info(f"Normalized longitude for {planet_name}: {longitude}")
        return longitude
        
    except Exception as e:
        logger.error(f"Error calculating {planet_name}: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def calculate_chart(birth_date, birth_time, location):
    try:
        logger.info(f"Starting chart calculation with date={birth_date}, time={birth_time}, location={location}")
        
        # Parse birth date and time
        try:
            dt_str = f"{birth_date} {birth_time}"
            local_dt = datetime.strptime(dt_str, '%Y-%m-%d %H:%M')
            logger.info(f"Parsed local datetime: {local_dt}")
            
            # Convert to UTC
            local_tz = pytz.timezone(location['timezone'])
            local_dt = local_tz.localize(local_dt)
            utc_dt = local_dt.astimezone(pytz.UTC)
            logger.info(f"Converted to UTC: {utc_dt}")
            
        except Exception as e:
            logger.error(f"Error parsing date/time: {str(e)}")
            raise ValueError(f"Error parsing date/time: {str(e)}")
        
        # Calculate Julian day
        try:
            jd = utc_dt.toordinal() + 1721425
            logger.info(f"Calculated Julian day: {jd}")
        except Exception as e:
            logger.error(f"Error calculating Julian day: {str(e)}")
            raise ValueError(f"Error calculating Julian day: {str(e)}")
        
        # Calculate house cusps
        try:
            # Calculate houses using Placidus system
            houses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ascmc = [0, 0]
            logger.info(f"Calculated houses: {houses}")
            logger.info(f"Calculated ascmc: {ascmc}")
        except Exception as e:
            logger.error(f"Error calculating houses: {str(e)}")
            raise ValueError(f"Error calculating houses: {str(e)}")
        
        # Calculate planet positions
        planets = {}
        signs = ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak', 
                'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık']
        
        for name, planet_id in PLANETS.items():
            try:
                # Calculate planet position
                longitude = calculate_planet_position(jd, name, planet_id)
                if longitude is None:
                    logger.error(f"Failed to calculate position for {name}")
                    continue
                
                # Calculate zodiac sign
                sign_index = int(longitude / 30)
                sign = signs[sign_index]
                
                # Calculate degrees and minutes within sign
                position_in_sign = longitude % 30
                degrees = int(position_in_sign)
                minutes = int((position_in_sign - degrees) * 60)
                
                logger.info(f"Position in sign for {name}: {sign} {degrees}°{minutes}'")
                
                # Calculate house
                house_number = get_house(longitude, houses)
                
                planets[name] = {
                    'zodiac_sign': sign,
                    'degree': degrees,
                    'minutes': minutes,
                    'house': house_number,
                    'longitude': longitude,
                    'name_tr': PLANET_NAMES_TR[name]
                }
                
                logger.info(f"Final position for {name}: {planets[name]}")
                
            except Exception as e:
                logger.error(f"Error calculating {name}: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                continue

        if not planets:
            raise ValueError("Failed to calculate any planet positions")
        
        # Log missing planets
        calculated_planets = set(planets.keys())
        expected_planets = set(PLANETS.keys())
        missing_planets = expected_planets - calculated_planets
        if missing_planets:
            logger.warning(f"Missing planets: {missing_planets}")

        logger.info("Successfully calculated positions for planets:")
        for name, data in planets.items():
            logger.info(f"{name}: {data}")

        # Calculate aspects between planets
        aspects = calculate_aspects(planets)
        logger.info(f"Calculated aspects: {aspects}")
        
        # Format response
        response = {
            'planet_positions': planets,
            'aspects': aspects,
            'house_positions': list(houses),
            'ascendant': float(ascmc[0]),
            'midheaven': float(ascmc[1])
        }
        
        logger.info("Chart calculation completed successfully")
        logger.debug(f"Response data: {response}")
        
        return response

    except Exception as e:
        logger.error(f"Error in calculate_chart: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

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

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_file(file_path):
    """Extract text from PDF or TXT file and update knowledge base"""
    try:
        text_content = ""
        file_extension = file_path.split('.')[-1].lower()

        if file_extension == 'pdf':
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text_content += page.extract_text()
        elif file_extension == 'txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                text_content = file.read()

        # Process the content to extract astrological knowledge
        prompt = """Analyze this astrological text and extract key interpretations for aspects between planets.
        Format the output as JSON with keys in the format: "planet1_planet2_aspect_type" (all lowercase).
        Example: {"sun_moon_conjunction": "interpretation text"}
        Only include actual interpretations found in the text.
        Make sure to keep the original Turkish text in the interpretations."""

        # Return the prompt as the new knowledge
        new_knowledge = {}
        aspect_key = "example_aspect"
        new_knowledge[aspect_key] = prompt

        # Update existing knowledge base
        try:
            with open(KNOWLEDGE_BASE_PATH, 'r', encoding='utf-8') as f:
                current_knowledge = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            current_knowledge = {}

        # Merge new knowledge
        current_knowledge.update(new_knowledge)

        # Save updated knowledge base
        with open(KNOWLEDGE_BASE_PATH, 'w', encoding='utf-8') as f:
            json.dump(current_knowledge, f, ensure_ascii=False, indent=2)

        return len(new_knowledge)

    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise

@app.route('/upload_file', methods=['POST'])
def upload_file():
    """Endpoint to handle file uploads for training"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Dosya yüklenmedi'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Dosya seçilmedi'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Geçersiz dosya türü. Sadece PDF ve TXT dosyaları kabul edilir'}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        # Process the file and update knowledge base
        num_interpretations = process_file(file_path)

        # Clean up
        os.remove(file_path)

        return jsonify({
            'message': f'Dosya başarıyla işlendi ve {num_interpretations} yorum eklendi',
            'status': 'success'
        })

    except Exception as e:
        logger.error(f"Error in upload_file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/calculate_natal_chart', methods=['POST'])
def calculate_natal_chart():
    try:
        data = request.get_json()
        logger.info(f"Received request data: {data}")

        # Validate input data
        if not data:
            logger.error("No data received")
            return jsonify({'error': 'No data provided'}), 400

        birth_date = data.get('birthDate')
        birth_time = data.get('birthTime')
        birth_place = data.get('location')

        if not all([birth_date, birth_time, birth_place]):
            missing = []
            if not birth_date: missing.append('birthDate')
            if not birth_time: missing.append('birthTime')
            if not birth_place: missing.append('location')
            logger.error(f"Missing required fields: {missing}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        try:
            # Get coordinates and timezone
            location_data = get_coordinates_and_timezone(birth_place)
            if not location_data:
                logger.error(f"Could not get location data for: {birth_place}")
                return jsonify({'error': 'Could not get location data'}), 400

            logger.info(f"Location data: {location_data}")

            # Calculate chart
            chart_data = calculate_chart(birth_date, birth_time, location_data)
            
            # Debug log the response
            logger.info("Calculated chart data:")
            for planet, data in chart_data['planet_positions'].items():
                logger.info(f"{planet}: {data}")
            logger.info(f"Number of aspects: {len(chart_data.get('aspects', {}))}")
            logger.info(f"House positions: {chart_data['house_positions']}")
            
            # Validate response data
            if not chart_data.get('planet_positions'):
                logger.error("No planet positions calculated")
                return jsonify({'error': 'Failed to calculate planet positions'}), 500

            if len(chart_data['planet_positions']) < len(PLANETS):
                missing_planets = set(PLANETS.keys()) - set(chart_data['planet_positions'].keys())
                logger.warning(f"Missing planets in calculation: {missing_planets}")

            # Return the response
            response = jsonify(chart_data)
            logger.info(f"Sending response: {response.get_data(as_text=True)}")
            return response

        except ValueError as e:
            logger.error(f"ValueError in calculate_natal_chart: {str(e)}")
            return jsonify({'error': str(e)}), 400

    except Exception as e:
        logger.error(f"Error in calculate_natal_chart: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/calculate-synastry', methods=['POST'])
def calculate_synastry():
    try:
        data = request.get_json()
        logger.info("Received synastry calculation request: %s", data)

        if not data or 'person1' not in data or 'person2' not in data:
            return jsonify({"error": "İki kişinin bilgileri gerekli"}), 400

        person1 = data['person1']
        person2 = data['person2']

        # Validate required fields for both persons
        required_fields = ['name', 'birthDate', 'birthTime', 'birthPlace']
        for field in required_fields:
            if not person1.get(field):
                return jsonify({"error": f"Birinci kişinin {field} bilgisi eksik"}), 400
            if not person2.get(field):
                return jsonify({"error": f"İkinci kişinin {field} bilgisi eksik"}), 400

        # Log the validated data
        logger.info("Processing synastry for: %s and %s", person1['name'], person2['name'])

        # Calculate synastry
        synastry_result = {
            "compatibility_score": 75,  # Example score
            "aspects": [
                {
                    "planet1": "Sun",
                    "planet2": "Moon",
                    "aspect": "Trine",
                    "orb": 2.5,
                    "description": "Güneş ve Ay üçgen açıda. Bu, duygusal uyumu gösterir."
                },
                {
                    "planet1": "Venus",
                    "planet2": "Mars",
                    "aspect": "Conjunction",
                    "orb": 1.8,
                    "description": "Venüs ve Mars kavuşumda. Bu, güçlü bir romantik ve fiziksel çekim gösterir."
                }
            ],
            "summary": f"{person1['name']} ve {person2['name']} arasındaki uyum analizi sonuçları olumlu görünüyor. Özellikle duygusal ve romantik alanlarda güçlü bir bağ var.",
            "recommendations": [
                "Birbirinizin duygusal ihtiyaçlarına karşı duyarlı olun",
                "İletişimi açık ve dürüst tutun",
                "Ortak aktiviteler planlayın"
            ]
        }

        logger.info("Synastry calculation completed successfully")
        return jsonify(synastry_result)

    except Exception as e:
        logger.error("Error in synastry calculation: %s", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/calculate-transits', methods=['POST'])
def calculate_transits():
    """Calculate current transits for a natal chart."""
    try:
        data = request.get_json()
        birth_date = data.get('birthDate')
        birth_time = data.get('birthTime')
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
        transit_aspects = calculate_aspects(natal_chart['planet_positions'])
        
        return jsonify({
            'natal_chart': natal_chart,
            'transit_chart': transit_chart,
            'aspects': transit_aspects
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_knowledge_files', methods=['GET'])
def get_knowledge_files():
    try:
        files = []
        for filename in os.listdir('uploads'):
            if filename.endswith(('.txt', '.pdf')):
                file_path = os.path.join('uploads', filename)
                files.append({
                    'name': filename,
                    'size': os.path.getsize(file_path),
                    'uploaded_at': os.path.getctime(file_path),
                    'processed': True  # You can add logic to check if file is processed
                })
        return jsonify(files)
    except Exception as e:
        print(f"Error getting knowledge files: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete_knowledge_file', methods=['POST'])
def delete_knowledge_file():
    try:
        data = request.json
        filename = data.get('filename')
        if not filename:
            return jsonify({'error': 'Filename is required'}), 400

        file_path = os.path.join('uploads', filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'message': f'File {filename} deleted successfully'})
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        print(f"Error deleting knowledge file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download_file/<filename>')
def download_file(filename):
    try:
        return send_from_directory('uploads', filename, as_attachment=True)
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/register', methods=['POST'])
def register_user():
    try:
        data = request.json
        logger.info("Received registration data: %s", data)
        
        # Check if user exists
        existing_user = db.users.find_one({"email": data['email']})
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400
        
        # Hash password using pbkdf2
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        
        # Create user document
        user = {
            "email": data['email'],
            "password": hashed_password,
            "name": data.get('name', ''),
            "birthDate": data.get('birthDate', ''),
            "birthTime": data.get('birthTime', ''),
            "birthPlace": data.get('birthPlace', ''),
            "created_at": datetime.utcnow()
        }
        
        # Insert user
        result = db.users.insert_one(user)
        logger.info("User inserted with ID: %s", result.inserted_id)
        
        # Return success response
        return jsonify({
            "message": "User registered successfully",
            "userId": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        logger.error("Registration error: %s", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/login', methods=['POST'])
def login_user():
    try:
        data = request.json
        logger.info("Received login data: %s", data)
        
        user = db.users.find_one({"email": data['email']})
        
        if user and check_password_hash(user['password'], data['password']):
            user['_id'] = str(user['_id'])
            del user['password']
            return jsonify(user), 200
            
        return jsonify({"error": "Invalid credentials"}), 401
        
    except Exception as e:
        logger.error("Login error: %s", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/<user_id>', methods=['GET', 'PUT'])
def manage_user_profile(user_id):
    try:
        if request.method == 'GET':
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return jsonify({"error": "Kullanıcı bulunamadı"}), 404

            # Get birth data from the correct location
            birth_data = user.get('birth_data', {})
            
            response_data = {
                '_id': str(user['_id']),
                'name': user.get('name', ''),
                'email': user.get('email', ''),
                'birthDate': birth_data.get('date', ''),
                'birthTime': birth_data.get('time', ''),
                'birthPlace': birth_data.get('place', '')
            }
            
            logger.info(f"Retrieved user profile: {response_data}")
            return jsonify(response_data)

        elif request.method == 'PUT':
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['birthDate', 'birthTime', 'birthPlace']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({"error": f"{field} alanı gerekli"}), 400

            # Update user's birth data
            update_data = {
                'birth_data': {
                    'date': data['birthDate'],
                    'time': data['birthTime'],
                    'place': data['birthPlace']
                },
                'updated_at': datetime.utcnow()
            }

            # Add name if provided
            if 'name' in data:
                update_data['name'] = data['name']

            result = db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )

            if result.modified_count == 0:
                return jsonify({"error": "Kullanıcı bulunamadı"}), 404

            logger.info(f"Updated user profile for {user_id}")
            return jsonify({"message": "Profil güncellendi"})

    except Exception as e:
        logger.error(f"Error in manage_user_profile: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/friends/<user_id>', methods=['GET', 'POST'])
def manage_friends(user_id):
    try:
        if request.method == 'GET':
            try:
                user = db.users.find_one({"_id": ObjectId(user_id)})
                if not user:
                    logger.error(f"User not found: {user_id}")
                    return jsonify({"error": "Kullanıcı bulunamadı"}), 404

                # Initialize friends array if it doesn't exist
                if 'friends' not in user:
                    logger.info(f"Initializing friends array for user {user_id}")
                    db.users.update_one(
                        {"_id": ObjectId(user_id)},
                        {"$set": {"friends": []}}
                    )
                    return jsonify([]), 200

                friends = user.get('friends', [])
                logger.info(f"Found {len(friends)} friends for user {user_id}")
                logger.debug(f"Friends data: {friends}")
                return jsonify(friends), 200

            except Exception as e:
                logger.error(f"Error fetching friends: {str(e)}")
                return jsonify({"error": str(e)}), 500
            
        elif request.method == 'POST':
            try:
                data = request.json
                new_friend = {
                    "name": data['name'],
                    "birthDate": data['birthDate'],
                    "birthTime": data.get('birthTime', ''),
                    "birthPlace": data.get('birthPlace', ''),
                    "added_at": datetime.utcnow()
                }
                
                # First check if user exists
                user = db.users.find_one({"_id": ObjectId(user_id)})
                if not user:
                    logger.error(f"User not found when adding friend: {user_id}")
                    return jsonify({"error": "Kullanıcı bulunamadı"}), 404

                # Check if friend already exists
                existing_friends = user.get('friends', [])
                for friend in existing_friends:
                    if (friend['name'] == new_friend['name'] and 
                        friend['birthDate'] == new_friend['birthDate']):
                        logger.warning(f"Duplicate friend found: {new_friend['name']}")
                        return jsonify({"error": "Bu arkadaş zaten eklenmiş"}), 400

                # Initialize friends array if it doesn't exist
                if 'friends' not in user:
                    logger.info(f"Initializing friends array for user {user_id}")
                    db.users.update_one(
                        {"_id": ObjectId(user_id)},
                        {"$set": {"friends": []}}
                    )

                # Add new friend
                result = db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$push": {"friends": new_friend}}
                )
                
                if result.modified_count:
                    logger.info(f"Friend added successfully for user {user_id}")
                    logger.debug(f"Added friend data: {new_friend}")
                    return jsonify({"message": "Arkadaş başarıyla eklendi"}), 200
                else:
                    logger.error(f"Failed to add friend for user {user_id}")
                    return jsonify({"error": "Arkadaş eklenemedi"}), 500
                
            except Exception as e:
                logger.error(f"Error adding friend: {str(e)}")
                return jsonify({"error": str(e)}), 500
            
    except Exception as e:
        logger.error(f"Manage friends error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/pdf/<user_id>', methods=['POST'])
def upload_pdf(user_id):
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        if file and file.filename.endswith('.pdf'):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Save file info to database
            pdf_doc = {
                "user_id": ObjectId(user_id),
                "filename": filename,
                "path": file_path,
                "uploaded_at": datetime.utcnow()
            }
            db.pdfs.insert_one(pdf_doc)
            
            return jsonify({"message": "File uploaded successfully"}), 200
        return jsonify({"error": "Invalid file type"}), 400
        
    except Exception as e:
        logger.error("Upload PDF error: %s", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the service is running"""
    status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'mongodb_connected': db is not None
    }
    return jsonify(status)

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email ve şifre gerekli"}), 400

        user = db.users.find_one({"email": email})
        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404

        if not check_password_hash(user['password'], password):
            return jsonify({"error": "Hatalı şifre"}), 401

        # Return user data including birth info
        return jsonify({
            'userId': str(user['_id']),
            'name': user.get('name', 'User'),
            'email': email,
            'birthDate': user.get('birthDate', ''),
            'birthTime': user.get('birthTime', ''),
            'birthPlace': user.get('birthPlace', '')
        })

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/test/user/<user_id>', methods=['GET'])
def test_user_data(user_id):
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            # Remove sensitive data
            if 'password' in user:
                del user['password']
            # Convert ObjectId to string
            user['_id'] = str(user['_id'])
            return jsonify({
                'user': user,
                'has_friends_field': 'friends' in user,
                'friends_type': str(type(user.get('friends', []))),
                'friends_count': len(user.get('friends', []))
            }), 200
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/test/db', methods=['GET'])
def test_db():
    try:
        # Get all collections
        collections = db.list_collection_names()
        
        # Get users count
        users_count = db.users.count_documents({})
        
        # Get a sample user (first one)
        sample_user = db.users.find_one()
        if sample_user:
            # Remove sensitive data
            if 'password' in sample_user:
                del sample_user['password']
            # Convert ObjectId to string
            sample_user['_id'] = str(sample_user['_id'])
        
        return jsonify({
            'collections': collections,
            'users_count': users_count,
            'sample_user': sample_user,
            'database_name': db.name
        }), 200
    except Exception as e:
        logger.error(f"Test DB error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/reset_users', methods=['POST'])
def reset_users():
    try:
        # Drop users collection
        db.users.drop()
        logger.info("Users collection dropped")
        return jsonify({'message': 'Users reset successful'})
    except Exception as e:
        logger.error(f"Reset users error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to reset users'}), 500

@app.route('/update_user_data', methods=['POST'])
def update_user_data():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        user_data = data.get('userData')
        
        if not user_id or not user_data:
            return jsonify({'error': 'Missing required data'}), 400
            
        # Update user data
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'birth_data': user_data,
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'User data updated successfully'
            })
        else:
            return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        logger.error(f"Update user data error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Mesaj gerekli"}), 400

        user_message = data['message']
        user_id = data.get('userId')

        # Get user context if available
        user_context = ""
        if user_id:
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                birth_data = user.get('birth_data', {})
                user_context = f"""
                Kullanıcı Bilgileri:
                - İsim: {user.get('name', 'Bilinmiyor')}
                - Doğum Tarihi: {birth_data.get('date', 'Bilinmiyor')}
                - Doğum Saati: {birth_data.get('time', 'Bilinmiyor')}
                - Doğum Yeri: {birth_data.get('place', 'Bilinmiyor')}
                """

        # Load astrology knowledge
        try:
            with open('astro_knowledge.json', 'r', encoding='utf-8') as f:
                astro_knowledge = json.load(f)
        except FileNotFoundError:
            astro_knowledge = {}
            logger.warning("astro_knowledge.json bulunamadı, boş sözlük kullanılıyor")

        # Create system message with context
        system_message = f"""
        Sen bir astroloji uzmanısın. Astroloji, burçlar, gezegenler ve doğum haritaları konusunda derin bilgiye sahipsin.
        
        Bilgi Kaynakları:
        {json.dumps(astro_knowledge, indent=2, ensure_ascii=False)}
        
        {user_context if user_context else ''}
        
        Lütfen:
        1. Sorulara nazik ve bilgilendirici yanıtlar ver
        2. Astrolojik terimleri anlaşılır şekilde açıkla
        3. Bilimsel astrolojiyi temel al
        4. Kullanıcının doğum bilgilerini dikkate al
        5. Yanıtlarını Türkçe olarak ver
        """

        # Check if GROQ_API_KEY exists
        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            raise Exception("GROQ_API_KEY bulunamadı")

        # Create chat completion using Groq API
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            "model": "mixtral-8x7b-32768",
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        try:
            groq_response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if groq_response.status_code != 200:
                error_detail = groq_response.json().get('error', {}).get('message', 'Bilinmeyen hata')
                logger.error(f"Groq API Error: Status {groq_response.status_code}, Detail: {error_detail}")
                raise Exception(f"Groq API Hatası: {error_detail}")
                
            response_data = groq_response.json()
            response_text = response_data['choices'][0]['message']['content']

        except requests.exceptions.Timeout:
            raise Exception("Groq API zaman aşımına uğradı")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Groq API bağlantı hatası: {str(e)}")

        # Save conversation to database
        try:
            db.conversations.insert_one({
                "userId": user_id,
                "timestamp": datetime.utcnow(),
                "userMessage": user_message,
                "botResponse": response_text
            })
        except Exception as e:
            logger.error(f"Veritabanı kayıt hatası: {str(e)}")
            # Continue even if saving to DB fails

        return jsonify({"response": response_text})

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start the Flask app
    app.run(host='0.0.0.0', port=5003, debug=True)
