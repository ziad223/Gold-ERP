# ClientAssetTagPreview

Direct local Chrome proof used the existing asset detail route for asset `AST-PUR-1787083585731-1-1-plz5` at 840x1180. In AR and EN the component mounted with `data-c4-tag-preview`, `previewSurface`, and `previewViewport`; document/body width had no horizontal overflow. The tag face remained `rgb(255,255,255)` with readable dark text in light and dark shell modes. Barcode/Asset identity was not changed and no print action was invoked.

Result: `CLIENT_ASSET_TAG_PREVIEW_DIRECT = PASS`; `CLIENT_ASSET_TAG_PREVIEW_TABLET = PASS`.
