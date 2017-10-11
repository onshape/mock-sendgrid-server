FROM node:boron

WORKDIR /usr/src/app

COPY package.json .

RUN npm install && npm install -g forever

COPY . .

EXPOSE 5870
EXPOSE 5871
CMD [ "forever", "./index.js" ]
