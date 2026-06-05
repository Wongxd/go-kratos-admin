# 构建与运行指南

## 前置条件

- Go 1.22+
- Docker & Docker Compose (可选，用于依赖服务)
- buf CLI (Protobuf 代码生成)
- gow CLI (GoWind Toolkit，可选但推荐)

## 环境初始化

```bash
# 安装 protoc 插件和 CLI 工具
make init

# 或分别安装
make plugin   # 安装 protoc-gen-go 等插件
make cli      # 安装 kratos, buf, ent, golangci-lint 等工具

# 安装 gow CLI (GoWind 一站式工具集)
go install github.com/tx7do/go-wind-toolkit/gowind/cmd/gow@latest
```

## 常用 Make 命令

所有命令在 `backend/` 根目录执行:

| 命令                | 说明                                |
|-------------------|-----------------------------------|
| `make api`        | 生成 Protobuf Go 代码                 |
| `make openapi`    | 生成 OpenAPI 文档                     |
| `make ts`         | 生成前端 TypeScript 类型                |
| `make ent`        | 生成 Ent ORM 代码                     |
| `make wire`       | 生成 Wire 依赖注入代码                    |
| `make gen`        | 一键生成 (ent + wire + api + openapi) |
| `make build`      | 构建 (含 api + openapi 生成)           |
| `make build_only` | 仅构建，不生成代码                         |
| `make test`       | 运行测试                              |
| `make cover`      | 运行覆盖率测试                           |
| `make lint`       | 运行 golangci-lint                  |
| `make vet`        | 运行 go vet                         |
| `make all`        | 生成 + 构建                           |

## gow CLI 工具 (推荐)

`gow` 是 GoWind 项目的一站式 CLI 工具，提供比 Make 更便捷的命令。**所有 `gow` 命令均可在项目任意目录位置执行**，无需切到特定路径。安装: `go install github.com/tx7do/go-wind-toolkit/gowind/cmd/gow@latest`

### 代码生成

| 命令                                                                                            | 说明                                        |
|-----------------------------------------------------------------------------------------------|-------------------------------------------|
| `gow api`                                                                                     | 生成所有服务的 Protobuf & API 代码 (自动遍历所有 buf 配置) |
| `gow ent`                                                                                     | 生成所有服务的 Ent 代码                            |
| `gow ent admin`                                                                               | 仅生成 admin 服务的 Ent 代码                      |
| `gow wire`                                                                                    | 生成所有服务的 Wire 依赖注入代码                       |
| `gow wire admin`                                                                              | 仅生成 admin 服务的 Wire 代码                     |
| `gow generate`                                                                                | 交互式从数据库生成完整 CRUD 代码                       |
| `gow generate --dsn "mysql://user:pass@tcp(localhost:3306)/dbname" --service admin --orm ent` | 从数据库一键生成 CRUD 代码                          |

### 项目管理

| 命令                              | 说明           |
|---------------------------------|--------------|
| `gow new myproject`             | 创建新项目        |
| `gow add service admin -s rest` | 添加 REST 微服务  |
| `gow run`                       | 在服务目录下运行当前服务 |
| `gow run admin`                 | 运行指定服务       |
| `gow version`                   | 查看版本         |

### 微服务演进

```bash
# 从 admin 服务提取 role 模块到 user 服务 (目标服务不存在时自动创建)
gow extract admin user -o role

# 提取多个实体
gow extract admin user -o role,permission

# 保留源文件 (默认删除)
gow extract admin user -o role --keep-source
```

## 启动依赖服务 (Docker)

```bash
# 启动 MySQL, Redis, MinIO 等基础服务
make docker-libs

# 或使用 docker compose
docker compose -f docker-compose.libs.yaml up -d
```

## 运行服务

```bash
# 在服务目录下运行 (推荐)
cd app/admin/service
make run

# 或构建后运行
make build
./bin/server -c ./configs
```

## 配置文件

位于 `app/admin/service/configs/`:

| 文件            | 用途                   |
|---------------|----------------------|
| `server.yaml` | HTTP/Asynq/SSE 服务器配置 |
| `data.yaml`   | 数据库连接配置              |
| `auth.yaml`   | 认证(JWT)配置            |
| `logger.yaml` | 日志配置                 |
| `oss.yaml`    | 对象存储配置               |
| `client.yaml` | 客户端配置                |

## Docker 部署

```bash
# 构建镜像
make docker

# Docker Compose 全栈启动
make docker-up

# 停止服务
make docker-down
```

## 测试

```bash
# 运行所有测试
make test

# 带覆盖率
make cover

# 运行指定包的测试
go test ./app/admin/service/internal/data/...
go test ./pkg/...
```

## 常见问题

1. **Wire 生成失败**: 确保所有 ProviderSet 中引用的构造函数签名正确
2. **Ent 生成失败**: 检查 schema 文件是否在 `internal/data/ent/schema/` 目录
3. **Protobuf 生成失败**: 确保安装了 buf CLI 且 `api/buf.yaml` 配置正确
4. **数据库连接失败**: 检查 `configs/data.yaml` 和 Docker 服务状态
