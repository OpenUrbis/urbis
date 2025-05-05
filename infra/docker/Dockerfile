FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx turbo run build --filter=@open-urbis/map-api

EXPOSE 3000

CMD ["node", "apps/api/dist/app/main.js"]