FROM node:20-alpine
WORKDIR /app
COPY services/interview-service/package.json ./services/interview-service/
COPY packages/database ./packages/database/
WORKDIR /app/packages/database
RUN npm install
RUN npm run db:generate
WORKDIR /app/services/interview-service
RUN npm install
COPY services/interview-service .
EXPOSE 3004
CMD ["npm", "start"]
