FROM node:20-alpine
WORKDIR /app
COPY services/leetcode-service/package.json ./services/leetcode-service/
COPY packages/database ./packages/database/
WORKDIR /app/packages/database
RUN npm install
RUN npm run db:generate
WORKDIR /app/services/leetcode-service
RUN npm install
COPY services/leetcode-service .
EXPOSE 3003
CMD ["npm", "start"]
