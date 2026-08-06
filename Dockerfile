FROM node:20-alpine

WORKDIR /app

# Copy package info
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy rest of application code
COPY . .

# Build Vite frontend
RUN npm run build

# Environment settings for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
