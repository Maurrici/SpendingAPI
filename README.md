## How to start server without docker:
1. Run: npx prisma migrate dev --name init 
2. Run: npm install
3. Run: npm start

## How to start server with docker:
1. Run: docker-compose up -d --build

OBS.: You need have postgres installed.
## Swagger
- http://localhost:3000/api-docs