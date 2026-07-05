# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools if any native modules exist
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Run production compilation
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only production artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only to reduce image size
RUN npm ci --only=production

EXPOSE 3000

CMD ["npm", "start"]
