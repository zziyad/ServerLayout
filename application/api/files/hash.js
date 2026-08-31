/**
 * File Hash API - Compute SHA-256 hash of an uploaded file
 *
 * Usage from frontend:
 *   const result = await client.api.files.hash({ name, directory });
 *   console.log(result.hash);
 */

({
  access: 'public',

  method: async ({ name, directory = 'general' }) => {
    if (!name || typeof name !== 'string') {
      const error = new Error('Invalid file name');
      error.code = 'INVALID_FILENAME';
      throw error;
    }

    const sanitizedName = node.path.basename(name);
    const uploadsDir = node.path.join(node.process.cwd(), 'uploads', directory);
    const filePath = node.path.join(uploadsDir, sanitizedName);

    try {
      await node.fsp.access(filePath, node.fs.constants.R_OK);
    } catch (error) {
      const err = new Error(`File not found: ${sanitizedName}`);
      err.code = 'FILE_NOT_FOUND';
      throw err;
    }

    const hash = node.crypto.createHash('sha256');
    const readable = node.fs.createReadStream(filePath);

    await new Promise((resolve, reject) => {
      readable.on('data', (chunk) => hash.update(chunk));
      readable.on('end', resolve);
      readable.on('error', reject);
    });

    return {
      name: sanitizedName,
      directory,
      algorithm: 'sha256',
      hash: hash.digest('hex'),
    };
  },
});
