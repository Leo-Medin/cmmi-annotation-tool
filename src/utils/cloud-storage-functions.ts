import { v4 as uuidv4 } from 'uuid';

/* Utility function to convert a canvas to a BLOB */
export const dataURLToBlob = (dataURL: string) => {
  const BASE64_MARKER = ';base64,';
  let contentType = '';
  let parts: string[] = [];
  let rawd = '';
  if (dataURL.indexOf(BASE64_MARKER) === -1) {
      parts = dataURL.split(',');
      contentType = parts[0].split(':')[1];
      rawd = parts[1];

      return new Blob([rawd], {type: contentType});
  }

  parts = dataURL.split(BASE64_MARKER);
  contentType = parts[0].split(':')[1];
  rawd = window.atob(parts[1]);
  const rawLength = rawd.length;

  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = rawd.charCodeAt(i);
  }

  return new Blob([uInt8Array], {type: contentType});
}

export function getBase64(file: Blob) {
  return new Promise(function(resolve, reject) {
      const reader = new FileReader();
      reader.onload = function() { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
  });
}

/* Handle image resized events */
export const imageUpload = (blob: Blob, contentType: string, folder: string, publicPhoto = false) => {
    return new Promise(async function(resolve, reject) {

        const filename = uuidv4()+'.jpg';

        const promiseMine = getBase64(blob);
        const fileMine = await promiseMine;

        const apiHost = window.location.protocol + "//" + window.location.host;

        await fetch(`${apiHost}/api/upload`, {
          method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
          body: JSON.stringify({
            // url,
            filename,
            contentType,
            folder,
            file: fileMine,
            publicPhoto
          }),
        })
        .then(response=>response.json())
        .then(result => { 
            if (result.status) {
                resolve(result.url);
            } else {
                console.error('Upload failed:', result);
                reject(result.message);
            }
        })
  });
};

export const fileUpload = (fileData: string, folder: string, extension: string, contentType: string) => {
    return new Promise(async function(resolve, reject) {

        const filename = uuidv4()+extension;

        const apiHost = window.location.protocol + "//" + window.location.host;

        await fetch(`${apiHost}/api/upload`, {
          method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
          body: JSON.stringify({
            filename,
            folder,
            file: fileData,
            contentType
          }),
        })
        .then(response=>response.json())
        .then(result => { 
            console.log('fileUpload() after fetch result:', result); 
            if (result.status) {
                console.log('Uploaded successfully!');
                resolve(result.url);
            } else {
                console.error('Upload failed:', result);
                reject(result.message);
            }
        })
        .catch((err)=>{
            reject(err.message? err.message: err)
        })

  });
};

export const uploadFile = (file: File, folder: string, publicPhoto = false) => {
    return new Promise(async function(resolve, reject) {

        // Read in file
        // const file = event.target.files[0];
        const contentType = file.type;
        let reader = null;

        // Ensure it's an image
        if(file.type.match(/image.*/)) {
            // console.log('uploadFile(): An image has been selected');

            // Load the image
            reader = new FileReader();
            reader.onload = function (readerEvent) {
                const image = new Image();
                image.onload = function () {

                    // Resize the image
                    const canvas = document.createElement('canvas');
                    const max_size = 2048; // TODO : pull max size from app config
                    let width = image.width;
                    let height = image.height;
                    if (width > height) {
                      if (width > max_size) {
                          height *= max_size / width;
                          width = max_size;
                      }
                    } else {
                      if (height > max_size) {
                          width *= max_size / height;
                          height = max_size;
                      }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d')?.drawImage(image, 0, 0, width, height)
                    const dataUrl = canvas.toDataURL('image/jpeg',.6); //quality 0.6
                    const resizedImage = dataURLToBlob(dataUrl);

                    imageUpload(resizedImage, contentType, folder, publicPhoto)
                    .then((result) => {
                        resolve(result as string);
                    })
                    .catch((error) => {
                        reject(error);
                    });
                }
                image.src = readerEvent.target?.result as string;
            }
            reader.readAsDataURL(file);
        }
        else
        if(file.type.match(/video.*/)) {
            console.log('A video has been selected');

            // Load the image
            reader = new FileReader();
            reader.onload = function (readerEvent) {
                fileUpload(readerEvent.target?.result as string, folder, '.mp4', contentType)
                .then((result) => {
                    resolve(result as string);
                })
                .catch((error) => {
                    reject(error);
                });

            }
            reader.readAsDataURL(file);
        } 
        else
        if(file.type==='application/pdf') {
            // console.log('PDF file has been selected');
            if(file.size > 800000) {
                reject('PDF file is too big to upload');

                return
            }

            // Load the image
            reader = new FileReader();
            reader.onload = function (readerEvent) {
                fileUpload(readerEvent.target?.result as string, folder, '.pdf', contentType)
                .then((result) => {
                    resolve(result as string);
                })
                .catch((error) => {
                    console.log('fileUpload exception:', error)
                    reject(error);
                });

            }
            reader.readAsDataURL(file);
        } 
        else reject('File type is not supported');

    });
};

