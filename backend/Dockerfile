FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY backend.js ./

RUN mkdir -p /data

EXPOSE 3003

CMD ["node", "backend.js"]
