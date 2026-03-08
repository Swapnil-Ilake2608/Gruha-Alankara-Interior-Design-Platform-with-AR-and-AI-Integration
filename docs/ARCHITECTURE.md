# Architecture Overview

```mermaid
flowchart TD
  A[User Browser] --> B[React Frontend]
  B --> C[Analyze Room Page]
  B --> D[Design Studio]
  B --> E[Profile]

  C -->|Camera/Upload| F[FastAPI Backend]
  D -->|Buddy Chat + Booking| F
  E -->|Booking History| F

  F --> G[(SQLite Database)]
  F --> H[AI Suggestion Engine]
  F --> I[Buddy Voice/TTS]

  H --> H1[IBM Granite / Groq / Local Fallback]
  H --> H2[Transformers + CV Heuristics]

  F --> J[Uploads Folder]
  D --> K[WebRTC AR Camera]
  D --> L[3D Renderer (React Three Fiber)]
  L --> M[GLB Models or Procedural Fallback Models]
```

## Data Entities

- `users`
- `designs`
- `furniture`
- `bookings`
- `design_analysis_cache`

## Main Backend APIs

- `POST /register`
- `POST /login`
- `POST /upload/{user_id}`
- `GET /designs/{user_id}`
- `POST /buddy/chat`
- `POST /bookings/auto/{design_id}`
- `GET /bookings/user/{user_id}`
- `GET /health/ready`

## Key Frontend Flows

1. Home -> Select style -> Analyze room
2. Analyze -> Upload/capture -> AI processing -> Design Studio
3. Design Studio -> Buddy chat -> Auto booking -> Profile history
4. Design Studio -> Live AR camera -> Furniture placement preview
