// Re-encode before upload to reduce mobile data use and remove EXIF/location metadata.
export async function compressPhoto(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose a JPG, PNG, or WebP photo.')
  if (file.size > 10 * 1024 * 1024)
    throw new Error('Choose a photo smaller than 10 MB.')
  const bitmap = await createImageBitmap(file)
  try {
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser could not prepare your photo.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error('Could not prepare this photo.')),
        'image/jpeg',
        0.78,
      ),
    )
    if (blob.size > 5 * 1024 * 1024)
      throw new Error(
        'This photo is still too large. Please choose a smaller one.',
      )
    return new File([blob], 'evidence.jpg', { type: 'image/jpeg' })
  } finally {
    bitmap.close()
  }
}
