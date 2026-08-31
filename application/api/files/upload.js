/**
 * File Upload API - Stream-based file upload
 *
 * Handles file uploads via WebSocket streaming.
 *
 * IMPORTANT: This endpoint MUST be called via WebSocket, not HTTP,
 * because the stream only exists on the WebSocket client.
 *
 * Usage from frontend:
 *   const uploader = client.createBlobUploader(file);
 *   uploader.onProgress = (progress) => console.log(`${progress}%`);
 *   await uploader.upload();
 *   const result = await client.wsTransport.call('files/upload', { streamId: uploader.id });
 */

({
  access: 'public',

  method: async ({ streamId, directory = 'general' }) => {
    const allowedDirectories = new Set([
      'general',
      'test-uploads',
      'gate-pass-request-attachments',
      'gate-pass-approval-signatures',
    ]);
    const targetDirectory = String(directory || '').trim();
    if (!allowedDirectories.has(targetDirectory)) {
      const error = new Error('Upload directory is not allowed');
      error.code = 'INVALID_UPLOAD_DIRECTORY';
      throw error;
    }

    // Get stream object
    const stream = context.client.getStream(streamId);
    const { name, size } = stream.metadata;

    // Validate file name
    if (!name || typeof name !== 'string') {
      const error = new Error('Invalid file name');
      error.code = 'INVALID_FILENAME';
      throw error;
    }

    // Sanitize file name (prevent path traversal)
    const sanitizedName = node.path.basename(name);

    // Create uploads directory
    const uploadsDir = node.path.join(
      node.process.cwd(),
      'uploads',
      targetDirectory,
    );
    await node.fsp.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = node.path.extname(sanitizedName);
    const baseName = node.path.basename(sanitizedName, ext);
    const fileName = `${baseName}-${timestamp}${ext}`;
    const filePath = node.path.join(uploadsDir, fileName);

    // Create writable stream and pipe (Metacom pattern)
    const writable = node.fs.createWriteStream(filePath);

    // Pipe and wait for completion
    await new Promise((resolve, reject) => {
      stream.readable.pipe(writable);
      writable.on('finish', resolve);
      writable.on('error', reject);
      stream.readable.on('error', reject);
    });

    // Clean up stream after use
    context.client.endStream(streamId);

    // Log upload
    console.log(`File uploaded: ${fileName} (${size} bytes)`);

    // Return result
    return {
      result: 'Upload completed',
      file: {
        name: fileName,
        originalName: sanitizedName,
        size: size,
        path: node.path.relative(node.process.cwd(), filePath),
        directory: targetDirectory,
        uploadedAt: new Date().toISOString(),
        uploadedBy: context.client.session?.data?.id || null,
      },
    };
  },
});
