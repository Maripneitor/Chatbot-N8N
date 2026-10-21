# ==========================================
# DOCKERFILE PARA GESTOR-BIBLIOTECA-API
# ==========================================
FROM node:20-alpine AS base

# Directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto de la API
EXPOSE 3000

# Usuario no root por seguridad
USER node

# Comando por defecto para iniciar el servicio
CMD ["node", "src/server.js"]
