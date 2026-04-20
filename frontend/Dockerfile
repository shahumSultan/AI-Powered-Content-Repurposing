FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]
