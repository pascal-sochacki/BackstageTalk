FROM node

WORKDIR /app

COPY package-lock.json package.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]