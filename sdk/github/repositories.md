# GitHub Integration - Repository Analysis

Flow Nexus provides GitHub repository integration through automated analysis capabilities.

## Available Tool

### Repository Analysis

The `mcp__flow-nexus__github_repo_analyze` tool provides comprehensive repository analysis with multiple analysis types.

## Basic Usage

### Code Quality Analysis

```javascript
const analysis = await mcp_flow_nexus_github_repo_analyze({
  repo: "owner/repository-name",
  analysis_type: "code_quality"
});

console.log(analysis);
// Returns:
// {
//   success: true,
//   analysis_id: "uuid-string",
//   repository: "owner/repository-name", 
//   analysis_type: "code_quality",
//   status: "analyzing"
// }
```

### Performance Analysis

```javascript
const performanceAnalysis = await mcp_flow_nexus_github_repo_analyze({
  repo: "ruvnet/flow-nexus",
  analysis_type: "performance"
});
```

### Security Analysis

```javascript
const securityAnalysis = await mcp_flow_nexus_github_repo_analyze({
  repo: "company/private-repo",
  analysis_type: "security"
});
```

## Analysis Types

The tool supports three analysis types:

| Type | Description | Use Case |
|------|-------------|----------|
| `code_quality` | Code quality assessment | Code reviews, refactoring planning |
| `performance` | Performance bottleneck analysis | Optimization planning |
| `security` | Security vulnerability scanning | Security audits |

## Response Format

```javascript
{
  success: boolean,
  analysis_id: string,      // Unique identifier for this analysis
  repository: string,       // Full repo name (owner/repo)
  analysis_type: string,    // Type of analysis requested
  status: string           // Current status: "analyzing", "completed", "failed"
}
```

## Asynchronous Analysis

Repository analysis is asynchronous. The initial call returns immediately with a status of "analyzing":

```javascript
// Step 1: Start analysis
const analysis = await mcp_flow_nexus_github_repo_analyze({
  repo: "large-org/complex-repo",
  analysis_type: "code_quality"
});

console.log(analysis.status); // "analyzing"

// Step 2: Check status later (implementation depends on your needs)
// Note: Status checking tools not yet documented - would need to test
// additional MCP tools for result retrieval
```

## Real-World Example

Based on actual testing with the Flow Nexus repository:

```javascript
const result = await mcp_flow_nexus_github_repo_analyze({
  repo: "ruvnet/flow-nexus",
  analysis_type: "code_quality"
});

// Actual response:
// {
//   "success": true,
//   "analysis_id": "7226c5a7-8a79-45af-bcc6-0f895a13937f",
//   "repository": "ruvnet/flow-nexus", 
//   "analysis_type": "code_quality",
//   "status": "analyzing"
// }
```

## Use Cases

### Pre-Deployment Analysis
Analyze repositories before deploying to production:

```javascript
const analysis = await mcp_flow_nexus_github_repo_analyze({
  repo: "company/production-app",
  analysis_type: "security"
});

// Use analysis_id to track progress and retrieve results
```

### Code Review Automation
Integrate with development workflows:

```javascript
const qualityCheck = await mcp_flow_nexus_github_repo_analyze({
  repo: "team/feature-branch-repo", 
  analysis_type: "code_quality"
});

// Incorporate results into PR review process
```

### Performance Monitoring
Regular performance analysis for optimization:

```javascript
const perfAnalysis = await mcp_flow_nexus_github_repo_analyze({
  repo: "company/api-service",
  analysis_type: "performance"
});

// Track performance trends over time
```

## Integration Patterns

### Batch Analysis

```javascript
const repos = ["org/repo1", "org/repo2", "org/repo3"];
const analysisTypes = ["code_quality", "performance", "security"];

const results = [];

for (const repo of repos) {
  for (const type of analysisTypes) {
    const analysis = await mcp_flow_nexus_github_repo_analyze({
      repo,
      analysis_type: type
    });
    results.push(analysis);
  }
}

console.log(`Started ${results.length} analyses`);
```

### Workflow Integration

```javascript
async function analyzeRepositoryComprehensively(repoName) {
  const analyses = await Promise.all([
    mcp_flow_nexus_github_repo_analyze({
      repo: repoName,
      analysis_type: "code_quality"
    }),
    mcp_flow_nexus_github_repo_analyze({
      repo: repoName, 
      analysis_type: "performance"
    }),
    mcp_flow_nexus_github_repo_analyze({
      repo: repoName,
      analysis_type: "security"
    })
  ]);

  return {
    repository: repoName,
    quality_analysis_id: analyses[0].analysis_id,
    performance_analysis_id: analyses[1].analysis_id,
    security_analysis_id: analyses[2].analysis_id
  };
}
```

## Error Handling

```javascript
try {
  const analysis = await mcp_flow_nexus_github_repo_analyze({
    repo: "invalid/repo-name",
    analysis_type: "code_quality"
  });
} catch (error) {
  console.error("Analysis failed:", error.message);
  // Handle repository not found, permission errors, etc.
}
```

## Limitations

- Analysis is asynchronous - results are not immediately available
- Repository must be accessible (public or you must have permissions)
- Analysis result retrieval requires additional tooling (not yet documented)

The GitHub repository analysis tool provides the foundation for automated code quality, performance, and security assessment of GitHub repositories within the Flow Nexus ecosystem.