# WeChat Cloud Hosting 基础镜像
FROM node:18-alpine

# 设置容器工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# 复制所有源码
COPY . .

# 云托管固定暴露 80 端口
EXPOSE 80

# 启动服务
CMD ["node", "index.js"]
