import { BrowserMultiFormatReader  } from '@zxing/library';
const codeReader = new BrowserMultiFormatReader ();
codeReader.decodeFromImageElement(document.getElementById('your-image-id'))
  .then(result => {
    console.log(`Parsed result: ${result.text}`);
  })
  .catch(err => {
    console.error(err);
  });