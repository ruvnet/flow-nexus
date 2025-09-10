# File Storage & Management

Secure cloud storage with bucket management, file operations, and URL generation for Flow Nexus applications.

## MCP Tools for Storage Management

Flow Nexus provides 6 specialized MCP tools for storage operations:

- `mcp__flow-nexus__storage_upload` - Upload files to buckets
- `mcp__flow-nexus__storage_delete` - Delete files from storage
- `mcp__flow-nexus__storage_list` - List files in buckets
- `mcp__flow-nexus__storage_get_url` - Generate public/signed URLs
- `mcp__flow-nexus__execution_files_list` - List execution-generated files
- `mcp__flow-nexus__execution_file_get` - Get execution file content

## File Upload Operations

### Basic File Upload

Upload files to secure cloud storage buckets:

```javascript
// Upload configuration file
const uploadResult = await client.storage.upload({
  bucket: 'user-files',
  path: 'configs/app-config.json',
  content: JSON.stringify({
    database: {
      host: 'localhost',
      port: 5432,
      name: 'production_db'
    },
    api: {
      version: 'v2',
      timeout: 30000,
      rate_limit: 1000
    }
  }, null, 2),
  content_type: 'application/json'
});

console.log('File uploaded:', uploadResult);
```

**SDK Response Example:**
```javascript
{
  success: true,
  bucket: 'user-files',
  path: 'configs/app-config.json',
  size_bytes: 234,
  content_type: 'application/json',
  etag: 'abc123def456789',
  version_id: 'v1.0.0-20241210150000',
  upload_time: 1.2,
  checksum: {
    algorithm: 'sha256',
    value: 'sha256:1a2b3c4d5e6f7890abcdef...'
  },
  metadata: {
    uploaded_by: 'user_123',
    client_ip: '192.168.1.100',
    user_agent: 'FlowNexusSDK/1.0'
  },
  url: 'https://storage.flow-nexus.io/user-files/configs/app-config.json',
  expires_at: '2025-12-10T15:30:00Z'
}
```

### Binary File Upload

Upload binary files like images, documents, or media:

```javascript
// Upload image file
const imageFile = await fs.readFile('profile-photo.jpg');
const base64Content = imageFile.toString('base64');

const imageUpload = await client.storage.upload({
  bucket: 'user-assets',
  path: 'images/profile-photos/user_123.jpg',
  content: base64Content,
  content_type: 'image/jpeg',
  metadata: {
    user_id: 'user_123',
    upload_source: 'profile_update',
    image_dimensions: '800x600'
  }
});

console.log('Image uploaded:', imageUpload);
```

### Batch File Upload

Upload multiple files efficiently:

```javascript
// Upload project files
const projectFiles = [
  {
    bucket: 'project-files',
    path: 'src/index.js',
    content: 'console.log("Hello World");',
    content_type: 'application/javascript'
  },
  {
    bucket: 'project-files', 
    path: 'package.json',
    content: JSON.stringify({
      name: 'my-app',
      version: '1.0.0'
    }),
    content_type: 'application/json'
  },
  {
    bucket: 'project-files',
    path: 'README.md',
    content: '# My Application\n\nThis is a sample app.',
    content_type: 'text/markdown'
  }
];

const uploadResults = await Promise.all(
  projectFiles.map(file => client.storage.upload(file))
);

console.log(`Uploaded ${uploadResults.length} files successfully`);
```

### Large File Upload with Progress

```javascript
// Upload large files with progress tracking
async function uploadLargeFile(filePath, bucketPath) {
  const fileSize = await fs.stat(filePath).then(stats => stats.size);
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  
  console.log(`Uploading ${fileSize} bytes in ${Math.ceil(fileSize / chunkSize)} chunks`);
  
  // For large files, use chunked upload
  const uploadId = await client.storage.initMultipartUpload({
    bucket: 'large-files',
    path: bucketPath,
    content_type: 'application/octet-stream'
  });
  
  const uploadProgress = {
    uploadId,
    totalSize: fileSize,
    uploadedBytes: 0,
    parts: []
  };
  
  // Upload chunks and track progress
  for (let i = 0; i < Math.ceil(fileSize / chunkSize); i++) {
    const chunk = await fs.readFile(filePath, {
      start: i * chunkSize,
      end: Math.min((i + 1) * chunkSize - 1, fileSize - 1)
    });
    
    const partResult = await client.storage.uploadPart({
      uploadId: uploadId,
      partNumber: i + 1,
      content: chunk.toString('base64')
    });
    
    uploadProgress.parts.push(partResult);
    uploadProgress.uploadedBytes += chunk.length;
    
    const percentComplete = (uploadProgress.uploadedBytes / fileSize) * 100;
    console.log(`Upload progress: ${percentComplete.toFixed(1)}%`);
  }
  
  // Complete multipart upload
  const finalResult = await client.storage.completeMultipartUpload({
    uploadId: uploadId,
    parts: uploadProgress.parts
  });
  
  return finalResult;
}
```

## File Listing & Discovery

### List Files in Bucket

Browse and search files in storage buckets:

```javascript
// List files in user bucket
const fileList = await client.storage.list({
  bucket: 'user-files',
  path: 'projects/', // Optional path prefix
  limit: 50,
  recursive: true
});

console.log('Files found:', fileList);
```

**SDK Response Example:**
```javascript
{
  success: true,
  bucket: 'user-files',
  path_prefix: 'projects/',
  files: [
    {
      path: 'projects/ai-research/data.csv',
      size_bytes: 1024000,
      content_type: 'text/csv',
      last_modified: '2024-12-10T14:30:00Z',
      etag: 'abc123def456',
      storage_class: 'standard',
      metadata: {
        created_by: 'user_123',
        project: 'ai-research'
      }
    },
    {
      path: 'projects/ai-research/model.pkl',
      size_bytes: 5678000,
      content_type: 'application/octet-stream',
      last_modified: '2024-12-10T13:15:00Z',
      etag: 'def456ghi789',
      storage_class: 'standard',
      metadata: {
        model_type: 'neural_network',
        accuracy: '0.95'
      }
    },
    {
      path: 'projects/web-app/dist.zip',
      size_bytes: 2345000,
      content_type: 'application/zip',
      last_modified: '2024-12-09T16:45:00Z',
      etag: 'ghi789jkl012',
      storage_class: 'standard'
    }
  ],
  total_files: 47,
  total_size_bytes: 12456789,
  has_more: true,
  next_token: 'eyJsYXN0X2tl...'
}
```

### Advanced File Filtering

```javascript
// Search files with advanced filters
const searchResults = await client.storage.list({
  bucket: 'user-files',
  path: '',
  filters: {
    content_type: 'image/*', // Images only
    min_size: 100000, // Minimum 100KB
    max_size: 5000000, // Maximum 5MB
    modified_after: '2024-12-01T00:00:00Z',
    has_metadata: ['user_id', 'project']
  },
  sort_by: 'size_desc',
  limit: 25
});
```

### File Search by Metadata

```javascript
// Search files by metadata tags
const metadataSearch = await client.storage.search({
  bucket: 'user-files',
  metadata_query: {
    project: 'ai-research',
    status: 'processed',
    tags: ['machine-learning', 'production']
  },
  content_types: ['application/json', 'text/csv'],
  date_range: {
    start: '2024-11-01',
    end: '2024-12-01'
  }
});

console.log('Metadata search results:', metadataSearch);
```

## URL Generation & Access

### Generate Public URLs

Create public URLs for file access:

```javascript
// Generate public URL for file sharing
const publicUrl = await client.storage.getUrl({
  bucket: 'user-files',
  path: 'reports/monthly-analytics.pdf',
  expires_in: 3600 // 1 hour expiry
});

console.log('Public URL generated:', publicUrl);
```

**SDK Response Example:**
```javascript
{
  success: true,
  bucket: 'user-files',
  path: 'reports/monthly-analytics.pdf',
  url: 'https://storage.flow-nexus.io/user-files/reports/monthly-analytics.pdf?token=abc123&expires=1702741800',
  expires_at: '2024-12-10T16:30:00Z',
  expires_in: 3600,
  access_type: 'public_read',
  download_url: 'https://storage.flow-nexus.io/download/user-files/reports/monthly-analytics.pdf?token=abc123',
  preview_url: 'https://storage.flow-nexus.io/preview/user-files/reports/monthly-analytics.pdf?token=abc123',
  metadata: {
    file_size: '2.3 MB',
    content_type: 'application/pdf',
    download_filename: 'monthly-analytics.pdf'
  }
}
```

### Signed URLs for Secure Access

```javascript
// Generate signed URLs for secure access
const signedUrl = await client.storage.getUrl({
  bucket: 'private-files',
  path: 'confidential/financial-data.xlsx',
  expires_in: 900, // 15 minutes
  access_type: 'private',
  permissions: ['read', 'download'],
  user_context: {
    user_id: 'user_123',
    role: 'admin'
  }
});

console.log('Signed URL:', signedUrl);
```

### Batch URL Generation

```javascript
// Generate URLs for multiple files
const files = [
  'images/photo1.jpg',
  'images/photo2.jpg', 
  'documents/report.pdf'
];

const urls = await Promise.all(
  files.map(path => 
    client.storage.getUrl({
      bucket: 'user-assets',
      path: path,
      expires_in: 7200 // 2 hours
    })
  )
);

console.log('Generated URLs:', urls.map(u => u.url));
```

## File Deletion & Cleanup

### Delete Single File

Remove files from storage:

```javascript
// Delete specific file
const deleteResult = await client.storage.delete({
  bucket: 'user-files',
  path: 'temp/old-data.csv'
});

console.log('File deleted:', deleteResult);
```

**SDK Response Example:**
```javascript
{
  success: true,
  bucket: 'user-files',
  path: 'temp/old-data.csv',
  deleted_at: '2024-12-10T15:45:00Z',
  file_info: {
    size_bytes: 456789,
    content_type: 'text/csv',
    last_modified: '2024-11-15T10:30:00Z'
  },
  storage_freed: '456.8 KB',
  backup_available: false
}
```

### Batch File Deletion

```javascript
// Delete multiple files
const filesToDelete = [
  'temp/cache-file-1.tmp',
  'temp/cache-file-2.tmp',
  'logs/old-logs.txt'
];

const deleteResults = await Promise.all(
  filesToDelete.map(path =>
    client.storage.delete({
      bucket: 'user-files',
      path: path
    })
  )
);

console.log(`Deleted ${deleteResults.length} files`);
```

### Automated Cleanup

```javascript
// Implement automated file cleanup
async function cleanupOldFiles(bucket, olderThanDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const files = await client.storage.list({
    bucket: bucket,
    filters: {
      modified_before: cutoffDate.toISOString()
    },
    limit: 1000
  });
  
  console.log(`Found ${files.files.length} files older than ${olderThanDays} days`);
  
  const deletePromises = files.files.map(file =>
    client.storage.delete({
      bucket: bucket,
      path: file.path
    })
  );
  
  const results = await Promise.all(deletePromises);
  const totalFreed = results.reduce((sum, result) => 
    sum + result.file_info.size_bytes, 0
  );
  
  console.log(`Cleanup complete: ${results.length} files deleted, ${totalFreed} bytes freed`);
  
  return {
    files_deleted: results.length,
    storage_freed: totalFreed,
    cleanup_date: new Date().toISOString()
  };
}
```

## Execution File Management

### List Execution-Generated Files

Access files created during sandbox or workflow executions:

```javascript
// List files from execution
const executionFiles = await client.storage.listExecutionFiles({
  stream_id: 'exec_abc123',
  created_by: 'claude-code',
  file_type: 'output'
});

console.log('Execution files:', executionFiles);
```

**SDK Response Example:**
```javascript
{
  success: true,
  stream_id: 'exec_abc123',
  files: [
    {
      id: 'file_def456',
      path: '/output/analysis_results.json',
      size_bytes: 15678,
      content_type: 'application/json',
      created_by: 'claude-code',
      created_at: '2024-12-10T15:20:00Z',
      file_type: 'output',
      description: 'Data analysis results',
      metadata: {
        execution_step: 'data_processing',
        agent_id: 'agent_researcher_789'
      }
    },
    {
      id: 'file_ghi789',
      path: '/output/visualization.png', 
      size_bytes: 234567,
      content_type: 'image/png',
      created_by: 'claude-flow',
      created_at: '2024-12-10T15:22:00Z',
      file_type: 'visualization',
      description: 'Generated chart visualization'
    }
  ],
  total_files: 5,
  total_size: '1.2 MB'
}
```

### Get Execution File Content

```javascript
// Retrieve specific execution file
const executionFile = await client.storage.getExecutionFile({
  file_id: 'file_def456',
  include_content: true
});

console.log('Execution file:', executionFile);
```

**SDK Response Example:**
```javascript
{
  success: true,
  file: {
    id: 'file_def456',
    path: '/output/analysis_results.json',
    size_bytes: 15678,
    content_type: 'application/json',
    content: {
      analysis_summary: {
        total_records: 10000,
        processing_time: 45.6,
        accuracy_score: 0.94,
        key_insights: [
          'Customer retention improved by 23%',
          'Peak usage during weekday mornings',
          'Mobile traffic accounts for 67% of total'
        ]
      },
      metrics: {
        cpu_usage: '12.5%',
        memory_usage: '256 MB',
        execution_duration: 127.3
      }
    },
    metadata: {
      execution_step: 'data_processing',
      agent_id: 'agent_researcher_789',
      workflow_id: 'workflow_abc123'
    },
    download_url: 'https://storage.flow-nexus.io/execution/file_def456',
    expires_at: '2024-12-11T15:20:00Z'
  }
}
```

## Storage Analytics & Monitoring

### Storage Usage Analytics

```javascript
// Get storage usage statistics
const storageAnalytics = await client.storage.getAnalytics({
  bucket: 'user-files',
  timeframe: '30d',
  breakdown_by: ['content_type', 'path_prefix']
});

console.log('Storage analytics:', storageAnalytics);
```

**SDK Response Example:**
```javascript
{
  success: true,
  bucket: 'user-files',
  timeframe: '30d',
  summary: {
    total_files: 1247,
    total_size_bytes: 5678901234,
    total_size_formatted: '5.3 GB',
    average_file_size: 4556123,
    storage_cost_estimate: 12.45 // USD
  },
  breakdown_by_content_type: {
    'application/json': {
      files: 456,
      size_bytes: 234567890,
      percentage: 4.1
    },
    'image/jpeg': {
      files: 234,
      size_bytes: 1234567890,
      percentage: 21.7
    },
    'application/pdf': {
      files: 123,
      size_bytes: 987654321,
      percentage: 17.4
    }
  },
  breakdown_by_path: {
    'projects/': {
      files: 567,
      size_bytes: 2345678901,
      percentage: 41.3
    },
    'uploads/': {
      files: 345,
      size_bytes: 1234567890,
      percentage: 21.7
    },
    'temp/': {
      files: 234,
      size_bytes: 567890123,
      percentage: 10.0
    }
  },
  growth_trend: {
    daily_average_uploads: 23,
    daily_average_size: 45678901,
    projected_monthly_growth: '15%'
  }
}
```

### Monitor Storage Quotas

```javascript
// Check storage quotas and limits
const quotaStatus = await client.storage.getQuotaStatus();

console.log('Storage quota status:', quotaStatus);
```

**SDK Response Example:**
```javascript
{
  success: true,
  quotas: {
    total_storage: {
      limit_bytes: 107374182400, // 100 GB
      used_bytes: 5368709120, // 5 GB
      available_bytes: 102005473280,
      percentage_used: 5.0
    },
    file_count: {
      limit: 50000,
      used: 1247,
      available: 48753,
      percentage_used: 2.5
    },
    bandwidth: {
      monthly_limit_bytes: 1073741824000, // 1 TB
      monthly_used_bytes: 54975581388, // 51.2 GB
      available_bytes: 1018766202612,
      percentage_used: 5.1
    }
  },
  tier: 'pro',
  upgrade_options: [
    {
      tier: 'enterprise',
      storage_limit: '1 TB',
      file_count_limit: 'unlimited',
      monthly_bandwidth: '10 TB'
    }
  ],
  warnings: []
}
```

## Error Handling

```javascript
try {
  await client.storage.upload({
    bucket: 'invalid-bucket',
    path: 'test.txt',
    content: 'test content'
  });
} catch (error) {
  switch (error.code) {
    case 'BUCKET_NOT_FOUND':
      console.log('Specified bucket does not exist');
      break;
    case 'QUOTA_EXCEEDED':
      console.log('Storage quota exceeded');
      break;
    case 'FILE_TOO_LARGE':
      console.log('File exceeds maximum size limit');
      break;
    case 'INVALID_CONTENT_TYPE':
      console.log('Unsupported content type');
      break;
    case 'ACCESS_DENIED':
      console.log('Insufficient permissions for bucket');
      break;
    case 'UPLOAD_FAILED':
      console.log('File upload failed:', error.details);
      break;
    case 'NETWORK_ERROR':
      console.log('Network error during upload');
      break;
    default:
      console.error('Storage error:', error.message);
  }
}
```

## Best Practices

### 1. Efficient File Organization

```javascript
// Organize files with logical structure
class FileOrganizer {
  constructor(client) {
    this.client = client;
    this.buckets = {
      userFiles: 'user-files',
      assets: 'user-assets',
      temp: 'temp-files',
      archive: 'archive-files'
    };
  }
  
  generatePath(category, userId, filename) {
    const date = new Date().toISOString().split('T')[0];
    
    switch (category) {
      case 'profile':
        return `users/${userId}/profile/${filename}`;
      case 'project':
        return `users/${userId}/projects/${date}/${filename}`;
      case 'temp':
        return `temp/${userId}/${Date.now()}_${filename}`;
      default:
        return `users/${userId}/misc/${filename}`;
    }
  }
  
  async uploadOrganized(category, userId, filename, content) {
    const path = this.generatePath(category, userId, filename);
    const bucket = category === 'temp' ? this.buckets.temp : this.buckets.userFiles;
    
    return await this.client.storage.upload({
      bucket,
      path,
      content,
      metadata: {
        user_id: userId,
        category,
        uploaded_at: new Date().toISOString()
      }
    });
  }
}
```

### 2. Automated Backup Strategy

```javascript
// Implement automated backup
async function backupCriticalFiles(bucket) {
  // Identify critical files
  const criticalFiles = await client.storage.list({
    bucket: bucket,
    filters: {
      has_metadata: ['critical', 'backup_required']
    }
  });
  
  console.log(`Found ${criticalFiles.files.length} critical files to backup`);
  
  for (const file of criticalFiles.files) {
    // Copy to backup bucket
    await client.storage.copy({
      source_bucket: bucket,
      source_path: file.path,
      destination_bucket: 'backup-files',
      destination_path: `backups/${new Date().toISOString().split('T')[0]}/${file.path}`
    });
  }
}
```

### 3. CDN Integration

```javascript
// Optimize file delivery with CDN
class CDNManager {
  constructor(client, cdnDomain) {
    this.client = client;
    this.cdnDomain = cdnDomain;
  }
  
  async uploadWithCDN(bucket, path, content, options = {}) {
    // Upload to storage
    const uploadResult = await this.client.storage.upload({
      bucket,
      path,
      content,
      ...options
    });
    
    // Generate CDN URL
    const cdnUrl = `https://${this.cdnDomain}/${bucket}/${path}`;
    
    // Invalidate CDN cache if needed
    if (options.invalidateCache) {
      await this.invalidateCDNCache(cdnUrl);
    }
    
    return {
      ...uploadResult,
      cdn_url: cdnUrl,
      cache_invalidated: options.invalidateCache || false
    };
  }
  
  async invalidateCDNCache(url) {
    // Implementation depends on CDN provider
    console.log(`Invalidating CDN cache for: ${url}`);
  }
}
```

### 4. File Processing Pipeline

```javascript
// Process uploaded files automatically
class FileProcessor {
  constructor(client) {
    this.client = client;
    this.processors = new Map();
    
    // Register processors
    this.processors.set('image/*', this.processImage.bind(this));
    this.processors.set('application/pdf', this.processPDF.bind(this));
    this.processors.set('text/csv', this.processCSV.bind(this));
  }
  
  async processUpload(uploadResult) {
    const contentType = uploadResult.content_type;
    
    // Find matching processor
    for (const [pattern, processor] of this.processors) {
      if (this.matchesPattern(contentType, pattern)) {
        await processor(uploadResult);
        break;
      }
    }
  }
  
  async processImage(uploadResult) {
    console.log('Processing image:', uploadResult.path);
    
    // Generate thumbnail
    const thumbnailUrl = await this.generateThumbnail(uploadResult);
    
    // Extract metadata
    const metadata = await this.extractImageMetadata(uploadResult);
    
    // Update file metadata
    await this.updateFileMetadata(uploadResult, {
      thumbnail_url: thumbnailUrl,
      dimensions: metadata.dimensions,
      color_palette: metadata.colors
    });
  }
  
  async processCSV(uploadResult) {
    console.log('Processing CSV:', uploadResult.path);
    
    // Analyze CSV structure
    const analysis = await this.analyzeCSVStructure(uploadResult);
    
    // Generate preview
    const preview = await this.generateCSVPreview(uploadResult);
    
    // Update metadata
    await this.updateFileMetadata(uploadResult, {
      row_count: analysis.rows,
      column_count: analysis.columns,
      preview_data: preview
    });
  }
  
  matchesPattern(contentType, pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(contentType);
  }
}
```

## Next Steps

- [Sandbox Execution](../sandbox/sandbox-execution.md) - File processing in sandboxes
- [Workflows](../workflows/workflow-orchestration.md) - Automated file workflows
- [Credit Management](../payments/credit-management.md) - Storage cost management