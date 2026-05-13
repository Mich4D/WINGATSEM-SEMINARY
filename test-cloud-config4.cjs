const cloudinary = require('cloudinary').v2;

cloudinary.config({
  api_key: "562979281774987",
  api_secret: "bQpSpVs_vkro3xknOMROI1cmaRg",
  cloud_name: "dtbja4ckz"
});
console.log(cloudinary.config());
