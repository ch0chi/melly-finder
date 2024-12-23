FROM node:latest

RUN mkdir -p /usr/app/
WORKDIR /usr/app/
COPY ./src /usr/app/src
COPY package*.json ./

RUN ls -l /usr/app/

ENV PATH /usr/app/node_modules/.bin:$PATH

RUN npm install