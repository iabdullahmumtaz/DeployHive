FROM node:20-alpine
RUN apk add --no-cache git docker-cli
WORKDIR /app
RUN mkdir -p deployments repos
COPY package*.json ./
RUN npm install --omit=dev
COPY src/server ./src/server
EXPOSE 6012
CMD ["node", "src/server/index.js"]
