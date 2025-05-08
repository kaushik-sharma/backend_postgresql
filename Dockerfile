FROM node:22.15.0-slim

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libpq-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .
