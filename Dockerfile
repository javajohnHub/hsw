# Multi-stage build for production
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN cd frontend && npm ci --only=production
RUN cd backend && npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy built application
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist
COPY --from=build /app/backend/package*.json ./backend/
COPY --from=build /app/package*.json ./

# Install only production dependencies for backend
RUN cd backend && npm ci --only=production

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "backend/dist/server.js"]
