const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hercare/recipes-workouts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Wrapper to handle Multer errors safely
const uploadSingleImage = (req, res, next) => {
  const multerUpload = upload.single('image');

  multerUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Image must be 5MB or smaller' });
        }
        return res.status(400).json({ message: 'Invalid image upload' });
      }
      console.error('Error during image upload:', err);
      return res.status(500).json({ message: 'Image upload failed' });
    }
    next();
  });
};

module.exports = uploadSingleImage;
