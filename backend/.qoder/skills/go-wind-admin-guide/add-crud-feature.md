# 添加新 CRUD 功能 - 分步指南

当需要添加新的 CRUD 功能模块时，按以下步骤操作。以添加 "Product" 资源为例。

## Proto 两层架构

本项目采用 **源领域 + BFF 层** 的 Proto 两层架构:

```
源领域层 (如 permission/service/v1/)          BFF 层 (如 admin/service/v1/)
├── 消息定义 (message)                        ├── REST Service 定义
├── gRPC Service 定义 (无 HTTP 注解)     →     ├── 带 google.api.http 路由注解
└── 完整 CRUD + 业务 RPC                      └── 可裁剪 API 面积，按需暴露
```

**关键区别:**
- **源领域层**: 定义消息类型 + 完整的 gRPC Service（不带 `google.api.http` 注解），提供全部 RPC 方法
- **BFF 层 (admin)**: 定义 REST Service（带 `google.api.http` 注解），import 源领域的消息类型，只暴露前端需要的接口

## 完整流程概览

```
1. 源领域: 定义消息 + gRPC Service
2. BFF 层: 定义 REST Service (带 HTTP 路由)
3. 生成 Go 代码
4. 创建 Ent Schema → 5. 生成 Ent 代码
6. 创建 Repository → 7. 创建 Service → 8. 注册到 Server
9. 更新 Wire → 10. 重新生成 → 11. 验证
```

## Step 1: 源领域层 - 定义消息 + gRPC Service

在 `api/protos/` 下对应的领域包中，同时定义消息和 gRPC Service（**不带** `google.api.http` 注解）:

```protobuf
// api/protos/catalog/service/v1/product.proto
syntax = "proto3";
package catalog.service.v1;

import "gnostic/openapi/v3/annotations.proto";
import "google/protobuf/empty.proto";
import "google/protobuf/timestamp.proto";
import "google/protobuf/field_mask.proto";
import "pagination/v1/pagination.proto";

// 产品管理服务 (gRPC)
service ProductService {
  // 查询产品列表
  rpc List (pagination.PagingRequest) returns (ListProductResponse) {}
  // 统计产品数量
  rpc Count (pagination.PagingRequest) returns (CountProductResponse) {}
  // 查询产品详情
  rpc Get (GetProductRequest) returns (Product) {}
  // 创建产品
  rpc Create (CreateProductRequest) returns (google.protobuf.Empty) {}
  // 更新产品
  rpc Update (UpdateProductRequest) returns (google.protobuf.Empty) {}
  // 删除产品
  rpc Delete (DeleteProductRequest) returns (google.protobuf.Empty) {}
}

// 产品
message Product {
  optional uint32 id = 1 [json_name = "id", (gnostic.openapi.v3.property) = {description: "产品ID"}];
  optional string name = 2 [json_name = "name", (gnostic.openapi.v3.property) = {description: "产品名称"}];
  optional string description = 3 [json_name = "description", (gnostic.openapi.v3.property) = {description: "产品描述"}];
  optional uint32 status = 4 [json_name = "status", (gnostic.openapi.v3.property) = {description: "状态"}];

  optional uint32 created_by = 100 [json_name = "createdBy", (gnostic.openapi.v3.property) = {description: "创建者ID"}];
  optional uint32 updated_by = 101 [json_name = "updatedBy", (gnostic.openapi.v3.property) = {description: "更新者ID"}];
  optional google.protobuf.Timestamp created_at = 200 [json_name = "createdAt", (gnostic.openapi.v3.property) = {description: "创建时间"}];
  optional google.protobuf.Timestamp updated_at = 201 [json_name = "updatedAt", (gnostic.openapi.v3.property) = {description: "更新时间"}];
}

message ListProductResponse {
  repeated Product items = 1;
  uint64 total = 2;
}

message GetProductRequest {
  oneof query_by {
    uint32 id = 1 [json_name = "id"];
  }
  optional google.protobuf.FieldMask view_mask = 100 [json_name = "viewMask"];
}

message CreateProductRequest {
  Product data = 1;
}

message UpdateProductRequest {
  uint32 id = 1;
  Product data = 2;
  google.protobuf.FieldMask update_mask = 3 [json_name = "updateMask"];
  optional bool allow_missing = 4 [json_name = "allowMissing"];
}

message DeleteProductRequest {
  oneof query_by {
    uint32 id = 1 [json_name = "id"];
  }
}

message CountProductResponse {
  uint64 count = 1;
}
```

## Step 2: BFF 层 - 定义 REST Service

在 `api/protos/admin/service/v1/` 下创建 REST 接口定义，**import 源领域消息**，按需暴露接口:

```protobuf
// api/protos/admin/service/v1/i_product.proto
syntax = "proto3";
package admin.service.v1;

import "google/api/annotations.proto";
import "google/protobuf/empty.proto";
import "pagination/v1/pagination.proto";
import "catalog/service/v1/product.proto";

// 产品管理服务 (REST)
service ProductService {
  rpc List (pagination.PagingRequest) returns (catalog.service.v1.ListProductResponse) {
    option (google.api.http) = { get: "/admin/v1/products" };
  }
  rpc Get (catalog.service.v1.GetProductRequest) returns (catalog.service.v1.Product) {
    option (google.api.http) = { get: "/admin/v1/products/{id}" };
  }
  rpc Create (catalog.service.v1.CreateProductRequest) returns (google.protobuf.Empty) {
    option (google.api.http) = { post: "/admin/v1/products" body: "*" };
  }
  rpc Update (catalog.service.v1.UpdateProductRequest) returns (google.protobuf.Empty) {
    option (google.api.http) = { put: "/admin/v1/products/{id}" body: "*" };
  }
  rpc Delete (catalog.service.v1.DeleteProductRequest) returns (google.protobuf.Empty) {
    option (google.api.http) = { delete: "/admin/v1/products/{id}" };
  }
  // 注意: 源领域有 Count RPC，但 BFF 层可选择性不暴露
}
```

**裁剪原则**: BFF 层只暴露前端需要的 RPC，源领域中的 `Count`、`BatchCreate` 等方法可不在 REST 层暴露。

## Step 3: 生成 Go 代码

```bash
# 方式一: 使用 gow (推荐，可在项目任意位置执行)
gow api

# 方式二: 使用 Make (需要在 backend/ 根目录执行)
cd backend
make api          # 生成 protobuf Go 代码
make openapi      # 生成 OpenAPI 文档
```

## Step 4: 创建 Ent Schema

在 `app/admin/service/internal/data/ent/schema/` 下创建:

```go
// app/admin/service/internal/data/ent/schema/product.go
package schema

import (
    "entgo.io/ent"
    "entgo.io/ent/dialect/entsql"
    "entgo.io/ent/schema"
    "entgo.io/ent/schema/field"
)

type Product struct {
    ent.Schema
}

func (Product) Annotations() []schema.Annotation {
    return []schema.Annotation{
        entsql.Annotation{Table: "product"},
    }
}

func (Product) Fields() []ent.Field {
    return []ent.Field{
        field.Uint32("id"),
        field.String("name").Optional().Default(""),
        field.String("description").Optional().Default(""),
        field.Uint32("status").Optional().Default(0),
        field.Uint32("created_by").Optional().Default(0),
        field.Uint32("updated_by").Optional().Default(0),
        field.Time("created_at").Optional(),
        field.Time("updated_at").Optional(),
    }
}

func (Product) Edges() []ent.Edge {
    return nil
}
```

## Step 5: 生成 Ent 代码

```bash
# 方式一: 使用 gow (推荐)
gow ent
# 或仅生成 admin 服务
gow ent admin

# 方式二: 使用 Make
cd app/admin/service
make ent
```

## Step 6: 创建 Repository

在 `app/admin/service/internal/data/` 下创建 `product_repo.go`。

**关键**: 项目使用自封装的 `go-crud/entgo` 泛型 Repository，泛型签名需包含 Ent 生成的 9 种类型。使用 `mapper.CopierMapper` 做 Entity ↔ DTO 转换。

```go
// app/admin/service/internal/data/product_repo.go
package data

import (
    "context"
    "time"

    "entgo.io/ent/dialect/sql"
    "github.com/go-kratos/kratos/v2/log"
    "github.com/tx7do/kratos-bootstrap/bootstrap"

    paginationV1 "github.com/tx7do/go-crud/api/gen/go/pagination/v1"
    entCrud "github.com/tx7do/go-crud/entgo"

    "github.com/tx7do/go-utils/copierutil"
    "github.com/tx7do/go-utils/mapper"

    "go-wind-admin/app/admin/service/internal/data/ent"
    "go-wind-admin/app/admin/service/internal/data/ent/product"
    "go-wind-admin/app/admin/service/internal/data/ent/predicate"
    pb "go-wind-admin/api/gen/go/catalog/service/v1"
)

type ProductRepo struct {
    entClient *entCrud.EntClient[*ent.Client]
    log       *log.Helper

    mapper     *mapper.CopierMapper[pb.Product, ent.Product]
    repository *entCrud.Repository[
        // Ent 生成的 9 种泛型类型，顺序固定
        ent.ProductQuery, ent.ProductSelect,       // Query, Select
        ent.ProductCreate, ent.ProductCreateBulk,   // Create, CreateBulk
        ent.ProductUpdate, ent.ProductUpdateOne,    // Update, UpdateOne
        ent.ProductDelete,                          // Delete
        predicate.Product,                          // Predicate
        pb.Product, ent.Product,                    // DTO, Entity
    ]
}

func NewProductRepo(
    ctx *bootstrap.Context,
    entClient *entCrud.EntClient[*ent.Client],
) *ProductRepo {
    r := &ProductRepo{
        entClient: entClient,
        log:       ctx.NewLoggerHelper("repo/product"),
        mapper:    mapper.NewCopierMapper[pb.Product, ent.Product](),
    }

    r.repository = entCrud.NewRepository[
        ent.ProductQuery, ent.ProductSelect,
        ent.ProductCreate, ent.ProductCreateBulk,
        ent.ProductUpdate, ent.ProductUpdateOne,
        ent.ProductDelete,
        predicate.Product,
        pb.Product, ent.Product,
    ](r.mapper)

    // 注册时间类型转换器 (必须)
    r.mapper.AppendConverters(copierutil.NewTimeStringConverterPair())
    r.mapper.AppendConverters(copierutil.NewTimeTimestamppbConverterPair())

    return r
}

// Count 统计数量
func (r *ProductRepo) Count(ctx context.Context, req *paginationV1.PagingRequest) (*pb.CountProductResponse, error) {
    builder := r.entClient.Client().Product.Query()
    whereSelectors, _, err := r.repository.BuildListSelectorWithPaging(builder, req)
    if len(whereSelectors) != 0 {
        builder.Modify(whereSelectors...)
    }
    count, err := builder.Count(ctx)
    if err != nil {
        r.log.Errorf("query product count failed: %s", err.Error())
        return nil, adminV1.ErrorInternalServerError("query product count failed")
    }
    return &pb.CountProductResponse{Count: uint64(count)}, nil
}

// List 分页查询列表
func (r *ProductRepo) List(ctx context.Context, req *paginationV1.PagingRequest) (*pb.ListProductResponse, error) {
    if req == nil {
        return nil, adminV1.ErrorBadRequest("invalid parameter")
    }
    builder := r.entClient.Client().Product.Query()
    ret, err := r.repository.ListWithPaging(ctx, builder, builder.Clone(), req)
    if err != nil {
        return nil, err
    }
    if ret == nil {
        return &pb.ListProductResponse{Total: 0, Items: nil}, nil
    }
    return &pb.ListProductResponse{Total: ret.Total, Items: ret.Items}, nil
}

// Get 查询详情
func (r *ProductRepo) Get(ctx context.Context, req *pb.GetProductRequest) (*pb.Product, error) {
    if req == nil {
        return nil, adminV1.ErrorBadRequest("invalid parameter")
    }
    builder := r.entClient.Client().Product.Query()
    var whereCond []func(s *sql.Selector)
    switch req.QueryBy.(type) {
    default:
    case *pb.GetProductRequest_Id:
        whereCond = append(whereCond, product.IDEQ(req.GetId()))
    }
    dto, err := r.repository.Get(ctx, builder, req.GetViewMask(), whereCond...)
    if err != nil {
        return nil, err
    }
    return dto, err
}

// Create 创建
func (r *ProductRepo) Create(ctx context.Context, req *pb.CreateProductRequest) error {
    if req == nil || req.Data == nil {
        return adminV1.ErrorBadRequest("invalid parameter")
    }
    builder := r.entClient.Client().Product.Create().
        SetNillableName(req.Data.Name).
        SetNillableDescription(req.Data.Description).
        SetNillableStatus(req.Data.Status).
        SetNillableCreatedBy(req.Data.CreatedBy).
        SetCreatedAt(time.Now())
    if err := builder.Exec(ctx); err != nil {
        r.log.Errorf("insert product failed: %s", err.Error())
        return adminV1.ErrorInternalServerError("insert product failed")
    }
    return nil
}

// Update 更新
func (r *ProductRepo) Update(ctx context.Context, req *pb.UpdateProductRequest) error {
    if req == nil || req.Data == nil {
        return adminV1.ErrorBadRequest("invalid parameter")
    }
    builder := r.entClient.Client().Debug().Product.Update()
    err := r.repository.UpdateX(ctx, builder, req.Data, req.GetUpdateMask(),
        func(dto *pb.Product) {
            builder.
                SetNillableName(req.Data.Name).
                SetNillableDescription(req.Data.Description).
                SetNillableStatus(req.Data.Status).
                SetNillableUpdatedBy(req.Data.UpdatedBy).
                SetUpdatedAt(time.Now())
        },
        func(s *sql.Selector) {
            s.Where(sql.EQ(product.FieldID, req.GetId()))
        },
    )
    return err
}

// Delete 删除
func (r *ProductRepo) Delete(ctx context.Context, req *pb.DeleteProductRequest) error {
    if req == nil {
        return adminV1.ErrorBadRequest("invalid parameter")
    }
    builder := r.entClient.Client().Debug().Product.Delete()
    _, err := r.repository.Delete(ctx, builder, func(s *sql.Selector) {
        s.Where(sql.EQ(product.FieldID, req.GetId()))
    })
    if err != nil {
        r.log.Errorf("delete product failed: %s", err.Error())
        return adminV1.ErrorInternalServerError("delete product failed")
    }
    return nil
}
```

### go-crud 关键概念

- **泛型签名**: `Repository` 的 9 个泛型参数对应 Ent 生成的类型，顺序固定不可调换
- **CopierMapper**: 自动完成 Ent Entity ↔ Protobuf DTO 的双向转换，通过注册 `ConverterPair` 处理类型差异
- **时间转换器**: 必须注册 `TimeStringConverterPair` + `TimeTimestamppbConverterPair` 处理 `time.Time` ↔ `Timestamp`
- **枚举转换器**: 有 enum 字段时需用 `mapper.NewEnumTypeConverter` 注册
- **ListWithPaging**: 传入 `builder` 和 `builder.Clone()` 两个 builder，自动处理分页、排序、搜索
- **UpdateX**: 支持 `FieldMask` 部分更新，第二个回调函数用于设置 WHERE 条件

## Step 7: 创建 Service

在 `app/admin/service/internal/service/` 下创建 `product_service.go`:

```go
// app/admin/service/internal/service/product_service.go
package service

import (
    "context"
    "github.com/go-kratos/kratos/v2/log"
    "github.com/tx7do/go-utils/trans"
    "google.golang.org/protobuf/types/known/emptypb"

    pb "go-wind-admin/api/gen/go/catalog/service/v1"
    adminV1 "go-wind-admin/api/gen/go/admin/service/v1"
    "go-wind-admin/app/admin/service/internal/data"
    "go-wind-admin/pkg/middleware/auth"
)

type ProductService struct {
    adminV1.UnimplementedProductServiceServer

    repo *data.ProductRepo
    log  *log.Helper
}

func NewProductService(
    ctx *bootstrap.Context,
    repo *data.ProductRepo,
) *ProductService {
    return &ProductService{
        repo: repo,
        log:  ctx.NewLoggerHelper("service/product"),
    }
}

func (s *ProductService) Create(ctx context.Context, req *pb.CreateProductRequest) (*emptypb.Empty, error) {
    if req.Data == nil {
        return nil, adminV1.ErrorBadRequest("invalid parameter")
    }
    operator, err := auth.FromContext(ctx)
    if err != nil {
        return nil, err
    }
    req.Data.CreatedBy = trans.Ptr(operator.UserId)
    if err = s.repo.Create(ctx, req); err != nil {
        return nil, err
    }
    return &emptypb.Empty{}, nil
}

// ... List, Get, Update, Delete 方法参照 api_service.go 模式
```

## Step 8: 注册到 Server

编辑 `app/admin/service/internal/server/rest_server.go`:

1. 在 `NewRestServer` 参数中添加 `productService *service.ProductService`
2. 注册 HTTP handler: `adminV1.RegisterProductServiceHTTPServer(srv, productService)`

## Step 9: 更新 Wire ProviderSet

三个文件都需要更新:

**data/providers/wire_set.go:**
```go
data.NewProductRepo,
```

**service/providers/wire_set.go:**
```go
service.NewProductService,
```

## Step 10: 重新生成 Wire 代码

```bash
# 方式一: 使用 gow (推荐)
gow wire
# 或仅生成 admin 服务
gow wire admin

# 方式二: 使用 Make
cd app/admin/service
make wire
```

## Step 11: 验证

```bash
# 运行服务 (无需先构建)
# 方式一: 使用 gow (推荐)
gow run
# 方式二: 使用 Make
cd app/admin/service && make run

# 如需构建二进制
make build

# 访问 Swagger 验证新接口
# http://localhost:7788/docs
```

## 关键注意事项

- **Ent 的可选字段**使用 `.Optional()`，对应 proto 的 `optional` 关键字
- **Update 操作**支持 `FieldMask` 做部分更新，使用 `SetNillable*` 方法
- **错误码**使用各领域包定义的错误函数，不要用标准 `errors.New`
- **日志命名**遵循 `模块/子模块` 格式，如 `repo/product`
- **新建文件后**需要运行 `make wire` 重新生成依赖注入代码
- **不要手动修改** `wire_gen.go`、`api/gen/go/` 和 `internal/data/ent/` 下的生成代码
