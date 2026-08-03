FROM node:20-alpine
WORKDIR /app
COPY services/ai-service/package.json ./services/ai-service/
COPY packages/database ./packages/database/
WORKDIR /app/packages/database
RUN npm install
RUN npm run db:generate
WORKDIR /app/services/ai-service
RUN npm install
COPY services/ai-service .
EXPOSE 3005
CMD ["npm", "start"]
