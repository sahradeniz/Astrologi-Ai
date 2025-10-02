# Astrologi AI

Astrologi AI is a full-stack astrology assistant that combines a Flask backend with a React + Chakra UI frontend. The platform offers personalised natal chart calculations, synastry insights, chat-based guidance, and friend management backed by MongoDB.

## Project Structure

```
Astrologi-Ai/
├── app.py                # Flask application exposing REST APIs
├── src/                  # React single-page application (Create React App)
├── public/               # Static assets for the frontend
├── docs/                 # Documentation
└── requirements.txt      # Python dependencies
```

## Requirements

- Python 3.10+
- Node.js 18+
- MongoDB instance (local or cloud)
- An `.env` file with the following keys:
  - `MONGO_URI`
  - `JWT_SECRET_KEY`
  - `GROQ_API_KEY`
  - `OPENCAGE_API_KEY`
  - `ASTROLOGY_API_KEY`

## Backend Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Export your environment variables or create an `.env` file in the project root.
4. Run the Flask API (defaults to `http://localhost:5003`):
   ```bash
   flask --app app.py run --host 0.0.0.0 --port 5003
   ```

### Key API Endpoints

- `POST /api/user/register` – Register a user and receive a JWT.
- `POST /api/user/login` – Authenticate and receive a JWT plus profile data.
- `GET/PUT /api/user/<user_id>` – Retrieve or update profile details (requires `Authorization: Bearer <token>`).
- `GET/POST /api/friends/<user_id>` – List or add friends.
- `DELETE /api/friends/<user_id>/<friend_id>` – Remove a stored friend.
- `POST /calculate_natal_chart` – Calculate a natal chart and receive frontend-ready data.

## Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Provide the backend URL via environment variable when needed:
   ```bash
   REACT_APP_API_URL=http://localhost:5003 npm start
   ```
   This launches the React app at `http://localhost:3000`.

The SPA uses `localStorage` for JWT handling. After authenticating, protected routes (Home, Profile, etc.) automatically load user and friend data from the backend.

## Running Tests

Frontend unit tests use Jest and React Testing Library:
```bash
npm test -- --watchAll=false
```

Back-end tests are not yet implemented. You can exercise the APIs manually with tools such as Postman or curl.

## Development Tips

- Ensure the backend is running before exploring authenticated pages; the frontend fetches profile information on load.
- Update `src/config.js` to point to your backend if you are not using environment variables.
- Logs are written to `logs/app.log` with rotation enabled for easier debugging.

## License

This project is proprietary and intended for internal use. Please contact the maintainers before sharing or distributing.
