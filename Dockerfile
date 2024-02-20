# Use an official Node.js runtime as a base image
FROM node:latest

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the local contents to the container
COPY . .

# Expose necessary ports (replace 3000, 3306, and 8983 with the actual ports used by your backend services)
EXPOSE 4000

# Command to start your backend application (replace "start" with the actual command to start your Node.js application)
CMD ["npm", "start"]
