# Frontend & Backend Compatibility Report

This document summarizes the main integration issues identified between the React frontend and the Flask backend.

## Summary Table

| Area | Frontend Expectation | Backend Reality | Impact |
| --- | --- | --- | --- |
| Authentication | Frontend posts credentials to `/login`. | Backend only exposes `/api/user/login` for authentication. 【F:src/pages/LoginPage.js†L57-L76】【F:app.py†L1108-L1125】 | Login attempts will hit a missing route and fail with 404 errors.
| Natal chart calculation | Frontend sends `{ birthPlace: "..." }` in the request body. | Backend expects the key to be `location` and rejects the request when it is absent. 【F:src/components/InputForm.js†L50-L67】【F:app.py†L820-L841】 | Natal chart generation always returns “Missing required fields: location”.
| Friends API | Frontend calls `/api/user/friends/<userId>` and expects an array. | Backend secures `/api/friends/<user_id>` (requires JWT) and returns `{ "friends": [...] }`. 【F:src/pages/FriendsPage.js†L40-L123】【F:app.py†L207-L245】 | Fetching friends fails due to wrong path, missing auth header, and mismatched response shape.
| Synastry API (page) | Frontend calls `/api/synastry` without names. | Backend only exposes `/api/calculate-synastry` and requires both `name` fields; it passes the provided value directly into `calculate_chart`, which expects a location object. 【F:src/pages/SynastryPage.js†L68-L116】【F:app.py†L885-L907】【F:app.py†L618-L632】 | Synastry analysis fails because of the wrong URL, missing required fields, and incompatible location handling.
| Synastry API (form) | Frontend sends people with `{ location: birthPlace }`. | Backend expects the key `birthPlace` for each person. 【F:src/components/SynastryForm.js†L61-L101】【F:app.py†L897-L907】 | Payload validation fails, preventing calculations.
| Chat history | Frontend posts to `/api/chat/message` expecting a stored history. | Backend attempts to use `chat_collection` but never defines it. 【F:src/pages/ChatPage.js†L68-L117】【F:app.py†L247-L281】 | Chat requests crash with a `NameError`, so no responses are returned.

## Additional Notes

- Multiple frontend components hard-code `http://localhost:5003` instead of reusing the shared `API_URL` setting, which complicates deployment to other environments. 【F:src/components/InputForm.js†L22-L107】【F:src/components/SynastryForm.js†L21-L112】
- The backend enforces JWT authentication on several endpoints, but some frontend calls (e.g., the Friends page) omit the required `Authorization` header entirely. 【F:src/pages/FriendsPage.js†L40-L123】【F:app.py†L207-L245】

Addressing the discrepancies above will be necessary to make the two halves of the application operate together reliably.
