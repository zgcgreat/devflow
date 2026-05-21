# Known Failures

## Known Issues

### None
当前为新项目，暂无已知失败记录。

## Patterns to Watch
- 实时数据推送需考虑 WebSocket 连接数限制
- 金融数据精度问题（价格计算时使用 Decimal 而非 Float）
- 港股/美股时间转换（时区问题）
