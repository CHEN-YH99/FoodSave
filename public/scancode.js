import { BrowserMultiFormatReader  } from '@zxing/library';
const codeReader = new BrowserMultiFormatReader ();
codeReader.decodeFromImageElement(document.getElementById('your-image-id'))
  .then(result => {
    // 解析成功
  })
  .catch(err => {
    // 解析失败
  });