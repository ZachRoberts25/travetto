travetto: Asset-Rest
===

**Install: Rest support**
```bash
$ npm install @travetto/asset-rest
```

This module provides a clean and direct mechanism for processing uploads, built upon [`busboy`](https://github.com/mscdex/busboy).  The module also provides some best practices with respect to temporary file deletion.

Once the files are uploaded, they are exposed on [`Rest`](https://github.com/travetto/travetto/tree/master/module/rest)'s request object as `req.files`. The uploaded files are constructed as `Asset` instances, which allows for integration with the [`Asset`](https://github.com/travetto/travetto/tree/master/module/asset) module.

A simple example:

**Code: Rest controller with upload support**
```typescript
@Controller('/avatar')
class Controller {

  constructor(assetService: AssetService, imageService: ImageService) {}

  @Post('/')
  async setAvatar(@Upload() file: Asset) {
    const stored = await this.assetService.store(asset);
    return {
      path: stored.path
    };
  }

  @Get('/:imgPath')
  async getAvatar(@Path() imgPath: string, @Query() opts:ImageOptions>) {
    return await this.imageService.get(imgPath, opts);
  }
}
```
