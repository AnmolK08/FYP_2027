FROM node:20-alpine
WORKDIR /app
COPY services/auth-service/package.json ./services/auth-service/
COPY packages/database ./packages/database/
WORKDIR /app/packages/database
RUN npm install
RUN npm run db:generate
WORKDIR /app/services/auth-service
RUN npm install
COPY services/auth-service .
EXPOSE 3002
CMD ["npm", "start"]
