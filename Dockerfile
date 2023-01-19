FROM node:19-alpine

WORKDIR /app
COPY . .
RUN echo -e "update-notifier=false\nloglevel=error" > ~/.npmrc
RUN npm --no-update-notifier install --development
RUN npm run build
CMD npm run start
