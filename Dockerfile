
# build node app
FROM node:20-alpine3.16
LABEL org.opencontainers.image.source="https://github.com/Justinadequate/Salesatron5000"

ENV SLACK_SIGNING_SECRET="NOTAFAKEVALUE"
ENV SLACK_BOT_TOKEN="NOTAFAKEVALUE"

# set working directory
WORKDIR /app

# copy package.json
COPY ["package.json", "package-lock.json*", "./"]

# install dependencies
RUN npm install --production

# copy app source code
COPY . .

# expose port 3000
EXPOSE 3000

# start app
CMD ["node", "src/index.js"]