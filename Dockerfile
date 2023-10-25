# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the container
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy local code to the container
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Start the application
CMD [ "node", "dist/app.js" ]

EXPOSE 3000
