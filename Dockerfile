FROM node:6.11.0-alpine
MAINTAINER Victor Gomov

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY ./src /usr/src/app/src
COPY ./config /usr/src/app/config

ENV PORT 8080

EXPOSE 8080
CMD ["npm", "start"]
