FROM node:17-alpine

WORKDIR /opt/pixel-ping

# Install node_modules
COPY package*.json .
RUN npm install

COPY . .

EXPOSE 9187

CMD [ "/opt/pixel-ping/bin/pixel-ping", "/opt/pixel-ping/config.json" ]
