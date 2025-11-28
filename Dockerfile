# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./

# Install only production dependencies (if any needed for server.js, currently none but good practice)
# Since server.js uses native modules, we might not strictly need node_modules, 
# but if we add deps later, this is ready.
# RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "server.js"]
