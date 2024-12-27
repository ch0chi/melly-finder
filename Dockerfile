FROM node:latest

RUN mkdir -p /usr/app/
WORKDIR /usr/app/
COPY ./src /usr/app/src
COPY package*.json ./
#RUN touch /usr/app/store.json

ENV PATH /usr/app/node_modules/.bin:$PATH

RUN npm install