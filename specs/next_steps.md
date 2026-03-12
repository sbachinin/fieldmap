# Next Steps

## Image Processing Improvements

### HEIC File Support
- **@image-processing.js needs to handle HEIC files properly**
- At minimum, it is necessary to try uploading a picture taken on iPhone 8
- HEIC (High Efficiency Image Container) is the default format for newer iPhones
- Current implementation may not support this format, causing upload failures
- For HEIC files, in case resizing doesn't work in the current implementation, I can just skip resizing and upload it as is
