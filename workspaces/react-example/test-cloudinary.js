async function testUpload() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  
  let body = '';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="folder"\r\n\r\n';
  body += 'test_folder\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="file"; filename="test.png"\r\n';
  body += 'Content-Type: image/png\r\n\r\n';
  
  const bodyBuffer = Buffer.concat([
    Buffer.from(body),
    buffer,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);
  
  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary
      },
      body: bodyBuffer,
    });
    
    const data = await response.json();
    console.log('Upload response:', data);
  } catch (err) {
    console.error('Error during upload test:', err);
  }
}

testUpload();
