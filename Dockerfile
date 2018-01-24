FROM node:carbon-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN npm install -g yarn && yarn install --production && yarn global add forever

COPY . .

EXPOSE 5870
EXPOSE 5871
CMD [ "npm", "start" ]
