/**
 * File List API - List uploaded files
 *
 * Returns a list of uploaded files from a directory.
 *
 * Usage from frontend:
 *   const result = await client.api.files.list({ directory: 'test-uploads' });
 *   console.log(result.files);
 */

({
  access: 'public',

  method: async ({ directory = 'general' }) => {
    const uploadsDir = node.path.join(node.process.cwd(), 'uploads', directory);

    // Check if directory exists
    try {
      await node.fsp.access(uploadsDir, node.fs.constants.R_OK);
    } catch (error) {
      // Directory doesn't exist, return empty list
      return {
        files: [],
        directory,
        total: 0,
      };
    }

    // Read directory
    const files = await node.fsp.readdir(uploadsDir);

    // Get file stats
    const fileList = await Promise.all(
      files.map(async (fileName) => {
        const filePath = node.path.join(uploadsDir, fileName);

        try {
          const stats = await node.fsp.stat(filePath);

          // Skip directories
          if (!stats.isFile()) {
            return null;
          }

          // Determine MIME type
          const ext = node.path.extname(fileName).toLowerCase();
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

          return {
            name: fileName,
            size: stats.size,
            type,
            directory,
            uploadedAt: stats.mtime.toISOString(),
            path: node.path.relative(node.process.cwd(), filePath),
          };
        } catch (error) {
          // Skip files that can't be read
          return null;
        }
      }),
    );

    // Filter out null entries and sort by upload date (newest first)
    const validFiles = fileList
      .filter((file) => file !== null)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return {
      files: validFiles,
      directory,
      total: validFiles.length,
    };
  },
});
