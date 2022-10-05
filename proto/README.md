# protocol bufferによる言語をまたいだシリアライズ

## Golang 

```
protoc --go_out=../driver/protobuf --go_opt=paths=source_relative --go-grpc_out=../driver/protobuf --go-grpc_opt=paths=source_relative task.proto
```

## Python

```
protoc --python_out=../backend/protobuf task.proto 
```
