# Github-Mirrors

Cloudflare 反代加速 Github 访问。

## 相关提示

1. 本地构建时可能需要运行`npm run cf-typegen`，生成`worker-configuration.d.ts`。
2. 配置到 Cloudflare worker 时，需要打开`添加访问者位置标头`，参见[文档](https://developers.cloudflare.com/rules/transform/managed-transforms/configure/)
3. 默认仅允许中国大陆 IP 访问，可通过环境变量修改配置
