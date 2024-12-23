FROM node:latest

RUN mkdir -p /usr/app/
WORKDIR /usr/app/
COPY ./src /usr/app/
COPY package*.json ./

ENV PATH /app/node_modules/.bin:$PATH

RUN npm install