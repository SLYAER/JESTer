# Use the official Node.js 18 alpine image for a smaller footprint
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies securely
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the correct port
EXPOSE 3000

# Start the application using the predefined start script
CMD ["npm", "start"]
