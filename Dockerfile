FROM node:19-alpine

WORKDIR /app
COPY . .
RUN npm --no-update-notifier install --development
RUN npm run build
CMD npm run start
