/**
 * File Download API - Stream-based file download
 *
 * Downloads files via WebSocket streaming using Metacom pattern.
 *
 * IMPORTANT: This endpoint MUST be called via WebSocket, not HTTP.
 *
 * Usage from frontend:
 *   const result = await client.wsTransport.call('files/download', {
 *     name: 'document-1769183257827.pdf',
 *     directory: 'test-uploads'
 *   });
 *   const downloader = client.createStreamDownloader(result.streamId, { size: result.size });
 *   const buffer = await downloader.receive();
 *   const blob = downloader.toBlob(buffer, result.type);
 */

({
  access: 'public',

  method: async ({ name, directory = 'general', streamId }) => {
    // Validate file name
    if (!name || typeof name !== 'string') {
      const error = new Error('Invalid file name');
      error.code = 'INVALID_FILENAME';
      throw error;
    }

    // Sanitize file name (prevent path traversal)
    const sanitizedName = node.path.basename(name);

    // Build file path
    const uploadsDir = node.path.join(node.process.cwd(), 'uploads', directory);
    const filePath = node.path.join(uploadsDir, sanitizedName);

    // Check if file exists
    try {
      await node.fsp.access(filePath, node.fs.constants.R_OK);
    } catch (error) {
      const err = new Error(`File not found: ${sanitizedName}`);
      err.code = 'FILE_NOT_FOUND';
      throw err;
    }

    // Get file size and type
    const { size } = await node.fsp.stat(filePath);
    const ext = node.path.extname(sanitizedName).toLowerCase();

    // Determine MIME type
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
      '.pptx':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.zip': 'application/zip',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    const type = mimeTypes[ext] || 'application/octet-stream';

    // Use provided streamId or generate one
    const actualStreamId =
      streamId ||
      `download-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Create Node.js readable stream to read the file
    const readable = node.fs.createReadStream(filePath);

    // Create Metacom stream on the client (for download: server → client)
    const stream = context.client.createStream(
      actualStreamId,
      { name: sanitizedName, size },
      { direction: 'download' },
    );

    // Pipe Node.js readable to Metacom writable (Metacom pattern - no await)
    readable.pipe(stream.writable);

    // Return stream info immediately (streaming happens asynchronously)
    return {
      streamId: stream.id,
      file: {
        name: sanitizedName,
        size,
        type,
        directory,
      },
    };
  },
});
