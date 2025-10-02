import os
import logging
from logging.handlers import RotatingFileHandler
import pytz
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
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
from groq import Groq

load_dotenv()  # Make sure .env is loaded

app = Flask(__name__, static_folder='build')

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "https://astrologi-ai.com"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

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

# Debug log environment variables
logger.info(f"GROQ_API_KEY present: {bool(os.getenv('GROQ_API_KEY'))}")
logger.info(f"OPENCAGE_API_KEY present: {bool(os.getenv('OPENCAGE_API_KEY'))}")
logger.info(f"ASTROLOGY_API_KEY present: {bool(os.getenv('ASTROLOGY_API_KEY'))}")
logger.info(f"JWT_SECRET_KEY present: {bool(os.getenv('JWT_SECRET_KEY'))}")
logger.info(f"MONGO_URI present: {bool(os.getenv('MONGO_URI'))}")

# MongoDB configuration
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    raise ValueError("No MONGO_URI environment variable set")

try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client.astrologiAi
    users_collection = db.users
    friends_collection = db.friends
    chat_collection = db.chat_history
    logging.info("Successfully connected to MongoDB")
except Exception as e:
    logging.error(f"Error connecting to MongoDB: {e}")
    raise

# JWT configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
JWT_ALGORITHM = 'HS256'


def generate_jwt_token(user_id, email, expires_delta=timedelta(days=1)):
    """Generate a signed JWT for the given user."""
    payload = {
        'user_id': str(user_id),
        'email': email,
        'exp': datetime.utcnow() + expires_delta
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def serialize_user(user_doc):
    """Prepare a user document for API responses."""
    birth_data = user_doc.get('birth_data', {})
    birth_date = birth_data.get('birthDate') or user_doc.get('birthDate', '')
    birth_time = birth_data.get('birthTime') or user_doc.get('birthTime', '')
    birth_place = birth_data.get('birthPlace') or user_doc.get('birthPlace', '')

    return {
        "userId": str(user_doc['_id']),
        "email": user_doc.get('email', ''),
        "name": user_doc.get('name', ''),
        "birthDate": birth_date,
        "birthTime": birth_time,
        "birthPlace": birth_place,
    }

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token is missing'}), 401

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

@app.route('/api/user/<user_id>', methods=['GET', 'PUT'])
@token_required
def manage_user_profile(current_user, user_id):
    try:
        if str(current_user['_id']) != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        if request.method == 'GET':
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return jsonify({"error": "Kullanıcı bulunamadı"}), 404

            # Remove sensitive data
            user.pop('password', None)
            user['_id'] = str(user['_id'])
            
            # Get birth data if exists
            birth_data = user.get('birth_data', {})
            
            return jsonify({
                "name": user.get('name', ''),
                "email": user.get('email', ''),
                "birthDate": birth_data.get('birthDate', ''),
                "birthTime": birth_data.get('birthTime', ''),
                "birthPlace": birth_data.get('birthPlace', '')
            })

        elif request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({"error": "Veri gönderilmedi"}), 400

            update_data = {}
            
            # Update name if provided
            if 'name' in data:
                update_data['name'] = data['name']
            
            # Update birth data if provided
            if 'birth_data' in data:
                update_data['birth_data'] = data['birth_data']
            elif any(key in data for key in ['birthDate', 'birthTime', 'birthPlace']):
                # Handle individual birth data fields
                birth_data = {
                    'birthDate': data.get('birthDate', ''),
                    'birthTime': data.get('birthTime', ''),
                    'birthPlace': data.get('birthPlace', '')
                }
                update_data['birth_data'] = birth_data

            if not update_data:
                return jsonify({"error": "Güncellenecek veri bulunamadı"}), 400

            result = users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )

            if result.modified_count == 0:
                return jsonify({"error": "Kullanıcı güncellenemedi"}), 400

            # Get updated user data
            updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
            if not updated_user:
                return jsonify({"error": "Güncellenmiş kullanıcı bulunamadı"}), 404

            birth_data = updated_user.get('birth_data', {})
            
            return jsonify({
                "name": updated_user.get('name', ''),
                "email": updated_user.get('email', ''),
                "birthDate": birth_data.get('birthDate', ''),
                "birthTime": birth_data.get('birthTime', ''),
                "birthPlace": birth_data.get('birthPlace', '')
            })

    except Exception as e:
        logger.error(f"Error in manage_user_profile: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/friends/<user_id>', methods=['GET', 'POST'])
@token_required
def manage_friends(current_user, user_id):
    try:
        if str(current_user['_id']) != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        if request.method == 'GET':
            # Get user's friends
            friends = friends_collection.find({'user_id': ObjectId(user_id)})
            friends_list = []
            for friend in friends:
                friend['_id'] = str(friend['_id'])
                friend['user_id'] = str(friend['user_id'])
                friends_list.append(friend)
            return jsonify({'friends': friends_list})

        elif request.method == 'POST':
            data = request.get_json()
            if not data or not all(key in data for key in ['name', 'birthDate', 'birthTime', 'birthPlace']):
                return jsonify({'error': 'Eksik bilgi'}), 400

            new_friend = {
                'user_id': ObjectId(user_id),
                'name': data['name'],
                'birthDate': data['birthDate'],
                'birthTime': data['birthTime'],
                'birthPlace': data['birthPlace']
            }

            result = friends_collection.insert_one(new_friend)
            new_friend['_id'] = str(result.inserted_id)
            new_friend['user_id'] = str(new_friend['user_id'])

            return jsonify({'friend': new_friend}), 201

    except Exception as e:
        logger.error(f"Error in manage_friends: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/friends/<user_id>/<friend_id>', methods=['DELETE'])
@token_required
def remove_friend(current_user, user_id, friend_id):
    try:
        if str(current_user['_id']) != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        result = friends_collection.delete_one({
            '_id': ObjectId(friend_id),
            'user_id': ObjectId(user_id)
        })

        if result.deleted_count == 0:
            return jsonify({'error': 'Friend not found'}), 404

        return jsonify({'message': 'Friend removed successfully'})

    except Exception as e:
        logger.error(f"Error removing friend: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat/message', methods=['POST'])
@token_required
def chat_message(current_user):
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Mesaj bulunamadı'}), 400

        # Get user context
        birth_data = current_user.get('birth_data', {})
        user_context = f"""
        Kullanıcı: {current_user.get('name', 'Unknown')}
        Doğum Tarihi: {birth_data.get('birthDate', 'Unknown')}
        Doğum Saati: {birth_data.get('birthTime', 'Unknown')}
        Doğum Yeri: {birth_data.get('birthPlace', 'Unknown')}
        """

        # Log incoming message
        logger.info(f"Processing chat message from user {current_user.get('name')}: {data['message']}")

        try:
            # Process message with AI
            response = process_chat_message(data['message'], user_context)
            
            # Log AI response
            logger.info(f"AI response: {response}")

            # Save chat history
            chat_history = {
                'user_id': current_user['_id'],
                'message': data['message'],
                'response': response,
                'timestamp': datetime.utcnow()
            }
            chat_collection.insert_one(chat_history)
            
            return jsonify({'response': response})

        except Exception as e:
            error_message = str(e)
            logger.error(f"Error processing chat message: {error_message}")
            return jsonify({'error': error_message}), 500

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': 'Beklenmeyen bir hata oluştu'}), 500

def process_chat_message(message, user_context):
    try:
        # Get Groq API key and debug log
        groq_api_key = os.getenv('GROQ_API_KEY')
        logger.info(f"GROQ_API_KEY present: {bool(groq_api_key)}")
        
        if not groq_api_key:
            logger.error("Groq API key is missing")
            raise Exception("Groq API anahtarı bulunamadı")

        # Initialize Groq client
        client = Groq(api_key=groq_api_key)
        
        try:
            # Prepare the conversation context
            conversation = [
                {"role": "system", "content": """
                Sen bir astroloji uzmanısın. Kullanıcıların astroloji ve burçlar hakkındaki 
                sorularını yanıtlıyorsun. Yanıtlarını verirken şu kurallara dikkat et:
                1. Sorulara nazik ve bilgilendirici yanıtlar ver
                2. Astrolojik terimleri anlaşılır şekilde açıkla
                3. Bilimsel astrolojiyi temel al
                4. Kullanıcının doğum bilgilerini dikkatte al
                5. Yanıtlarını Türkçe olarak ver
                """},
                {"role": "system", "content": f"Kullanıcı Bilgileri:\n{user_context}"},
                {"role": "user", "content": message}
            ]

            logger.info(f"Sending request to Groq with message: {message}")

            # Create chat completion using Groq client
            chat_completion = client.chat.completions.create(
                messages=conversation,
                model="mixtral-8x7b-32768",
                temperature=0.7,
                max_tokens=500
            )
            
            # Extract and return the response text
            ai_response = chat_completion.choices[0].message.content.strip()
            logger.info(f"Received response from Groq: {ai_response}")
            
            return ai_response

        except Exception as e:
            logger.error(f"Groq API Error: {str(e)}")
            raise Exception(f"Groq API hatası: {str(e)}")

    except Exception as e:
        logger.error(f"Error in process_chat_message: {str(e)}")
        raise

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
        prompt = f"""An expert astrologer, provide a detailed interpretation of the {aspect_type} aspect between {planet1} and {planet2}.
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

            for base_angle, aspect_type in aspect_types.items():
                orb = orbs[aspect_type]
                if abs(angle - base_angle) <= orb:
                    interpretation = get_aspect_interpretation(
                        aspect_type,
                        data1['name_tr'],
                        data2['name_tr']
                    )

                    if planet2 not in aspects[planet1]:
                        aspects[planet1][planet2] = []

                    aspect_data = {
                        "aspect_type": aspect_type,
                        "angle": round(angle, 2),
                        "planet1": planet1,
                        "planet2": planet2,
                        "planet1_tr": data1['name_tr'],
                        "planet2_tr": data2['name_tr']
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


def format_chart_data_for_frontend(chart_data, metadata):
    """Attach metadata and ensure frontend friendly payload."""
    formatted = {
        'planet_positions': chart_data.get('planet_positions', {}),
        'aspects': chart_data.get('aspects', {}),
        'house_positions': chart_data.get('house_positions', []),
        'ascendant': chart_data.get('ascendant'),
        'midheaven': chart_data.get('midheaven'),
    }

    formatted.update({
        'name': metadata.get('name', ''),
        'birth_date': metadata.get('birthDate', ''),
        'birth_time': metadata.get('birthTime', ''),
        'birth_place': metadata.get('birthPlace', ''),
    })

    return formatted

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

            metadata = {
                'name': data.get('name', ''),
                'birthDate': birth_date,
                'birthTime': birth_time,
                'birthPlace': birth_place,
            }

            frontend_chart = format_chart_data_for_frontend(chart_data, metadata)

            response = jsonify(frontend_chart)
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

        # Calculate natal charts for both persons
        person1_location = get_coordinates_and_timezone(person1['birthPlace'])
        person2_location = get_coordinates_and_timezone(person2['birthPlace'])

        if not person1_location or not person2_location:
            return jsonify({"error": "Doğum yeri bilgileri doğrulanamadı"}), 400

        person1_chart = calculate_chart(person1['birthDate'], person1['birthTime'], person1_location)
        person2_chart = calculate_chart(person2['birthDate'], person2['birthTime'], person2_location)

        if not person1_chart or not person2_chart:
            raise Exception("Doğum haritaları hesaplanamadı")

        # Calculate aspects between charts
        synastry_aspects = []
        compatibility_score = 0
        total_aspects = 0

        # Define aspect types and their weights for compatibility
        aspect_weights = {
            "Conjunction": 5,  # Very strong
            "Trine": 4,      # Harmonious
            "Sextile": 3,    # Positive
            "Square": -2,    # Challenging
            "Opposition": -3  # Very challenging
        }

        # Calculate aspects between all planets
        for p1_name, p1_data in person1_chart['planet_positions'].items():
            for p2_name, p2_data in person2_chart['planet_positions'].items():
                # Calculate the angular difference
                diff = abs(p1_data['longitude'] - p2_data['longitude']) % 360
                
                # Check for aspects
                for aspect_angle, aspect_name in [(0, "Conjunction"), (60, "Sextile"), 
                                                (90, "Square"), (120, "Trine"), 
                                                (180, "Opposition")]:
                    orb = 8 if aspect_name in ["Conjunction", "Opposition"] else 6
                    
                    if abs(diff - aspect_angle) <= orb:
                        # Get interpretation
                        description = get_aspect_interpretation(aspect_name, p1_name, p2_name)
                        
                        # Calculate the weight of this aspect
                        weight = aspect_weights.get(aspect_name, 0)
                        compatibility_score += weight
                        total_aspects += 1
                        
                        synastry_aspects.append({
                            "planet1": p1_name,
                            "planet2": p2_name,
                            "aspect": aspect_name,
                            "orb": round(abs(diff - aspect_angle), 2),
                            "description": description
                        })

        # Normalize compatibility score to 0-100 range
        if total_aspects > 0:
            base_score = 50  # Start from middle
            max_variation = 25  # Allow score to vary by ±25
            normalized_score = base_score + (compatibility_score / total_aspects) * (max_variation / 5)
            final_score = max(0, min(100, normalized_score))  # Clamp between 0 and 100
        else:
            final_score = 50  # Default score if no aspects found

        synastry_result = {
            "compatibility_score": round(final_score),
            "aspects": synastry_aspects,
            "person1_positions": [
                {"planet": name, "sign": data.get("zodiac_sign"), "degree": data.get("degree")}
                for name, data in person1_chart['planet_positions'].items()
            ],
            "person2_positions": [
                {"planet": name, "sign": data.get("zodiac_sign"), "degree": data.get("degree")}
                for name, data in person2_chart['planet_positions'].items()
            ],
            "summary": f"{person1['name']} ve {person2['name']} arasındaki uyum skoru: {round(final_score)}%",
            "recommendations": [
                "Birbirinizin farklılıklarına saygı gösterin",
                "İletişimi açık ve dürüst tutun",
                "Ortak hedefler belirleyin"
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
        existing_user = users_collection.find_one({"email": data['email']})
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400

        # Hash password using pbkdf2
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')

        birth_data = {
            'birthDate': data.get('birthDate', ''),
            'birthTime': data.get('birthTime', ''),
            'birthPlace': data.get('birthPlace', ''),
        }

        # Create user document
        user = {
            "email": data['email'],
            "password": hashed_password,
            "name": data.get('name', ''),
            "birth_data": birth_data,
            "created_at": datetime.utcnow()
        }

        # Insert user
        result = users_collection.insert_one(user)
        logger.info("User inserted with ID: %s", result.inserted_id)

        user['_id'] = result.inserted_id
        token = generate_jwt_token(result.inserted_id, data['email'])
        response_data = serialize_user(user)
        response_data.update({
            "token": token,
            "message": "User registered successfully"
        })

        return jsonify(response_data), 201

    except Exception as e:
        logger.error("Registration error: %s", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        logger.info("Received login data: %s", data)

        user = users_collection.find_one({"email": data['email']})

        if user and check_password_hash(user['password'], data['password']):
            token = generate_jwt_token(user['_id'], user['email'])
            response_data = serialize_user(user)
            response_data['token'] = token
            return jsonify(response_data), 200

        return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        logger.error("Login error: %s", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/test/user/<user_id>', methods=['GET'])
def test_user_data(user_id):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
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
        users_count = users_collection.count_documents({})
        
        # Get a sample user (first one)
        sample_user = users_collection.find_one()
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
        users_collection.drop()
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
        result = users_collection.update_one(
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

@app.after_request
def add_security_headers(response):
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.astroloji.ai https://api.opencagedata.com https://api.groq.com;"
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Start the Flask app
    app.run(host='0.0.0.0', port=5003, debug=True)
