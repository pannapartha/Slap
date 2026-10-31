FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY Slap ./Slap
USER node
ENV PORT=8897
EXPOSE 8897
CMD ["node", "Slap/game/server.mjs"]
