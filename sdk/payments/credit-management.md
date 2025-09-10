# Credit Management & Payments

Comprehensive credit system for managing payments, balances, and billing in Flow Nexus applications.

## MCP Tools for Credit Management

Flow Nexus provides 4 specialized MCP tools for credit and payment operations:

- `mcp__flow-nexus__check_balance` - Check current credit balance
- `mcp__flow-nexus__create_payment_link` - Create secure payment links
- `mcp__flow-nexus__configure_auto_refill` - Setup automatic refills
- `mcp__flow-nexus__get_payment_history` - Get transaction history

## Credit Balance Management

### Check Current Balance

Monitor your credit balance and auto-refill settings:

```javascript
// Check current credit balance
const balance = await client.credits.checkBalance();

console.log('Account balance:', balance);
```

**SDK Response Example:**
```javascript
{
  success: true,
  balance: 1966.2,
  currency: 'credits',
  auto_refill_enabled: false,
  auto_refill_threshold: 20,
  auto_refill_amount: 100,
  low_balance_warning: false,
  tier: 'pro',
  monthly_usage: {
    current_month: 234.8,
    limit: 5000,
    percentage_used: 4.7
  },
  estimated_remaining_days: 45,
  message: 'Current balance: 1966.2 credits'
}
```

### Balance Monitoring

```javascript
// Monitor balance with alerts
async function monitorBalance() {
  const balance = await client.credits.checkBalance();
  
  if (balance.low_balance_warning) {
    console.warn('Low balance detected:', balance.balance);
    
    // Optionally enable auto-refill
    if (!balance.auto_refill_enabled) {
      await client.credits.configureAutoRefill({
        enabled: true,
        threshold: 50,
        amount: 200
      });
    }
  }
  
  return balance;
}
```

## Payment Processing

### Create Payment Links

Generate secure payment links for credit purchases:

```javascript
// Create payment link for credit purchase
const paymentLink = await client.credits.createPaymentLink({
  amount: 100 // USD amount (minimum $10)
});

console.log('Payment link created:', paymentLink);
```

**SDK Response Example:**
```javascript
{
  success: true,
  payment_link: 'https://checkout.flow-nexus.io/pay/abc123def456',
  payment_id: 'pay_abc123def456',
  amount_usd: 100,
  credits_to_receive: 1000, // 10 credits per USD
  expiry_date: '2024-12-17T15:30:00Z',
  qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  terms_url: 'https://flow-nexus.io/terms',
  security_features: [
    'ssl_encryption',
    'fraud_protection',
    'secure_tokenization'
  ],
  supported_methods: [
    'credit_card',
    'paypal', 
    'apple_pay',
    'google_pay'
  ]
}
```

### Payment Link Customization

```javascript
// Create customized payment experience
const customPaymentLink = await client.credits.createPaymentLink({
  amount: 250,
  metadata: {
    user_id: 'user_123',
    project: 'ai-research',
    team: 'ml-engineering'
  },
  success_url: 'https://myapp.com/payment-success',
  cancel_url: 'https://myapp.com/payment-cancelled',
  description: 'Credits for AI model training project'
});
```

### Bulk Payment Processing

```javascript
// Process multiple payments
const bulkPayments = await Promise.all([
  client.credits.createPaymentLink({ amount: 50 }),
  client.credits.createPaymentLink({ amount: 100 }),
  client.credits.createPaymentLink({ amount: 200 })
]);

console.log('Payment links created:', bulkPayments.length);
```

## Auto-Refill Configuration

### Setup Automatic Refills

Configure automatic credit refills to prevent service interruptions:

```javascript
// Enable auto-refill with custom settings
const autoRefillConfig = await client.credits.configureAutoRefill({
  enabled: true,
  threshold: 100, // Refill when balance drops below 100 credits
  amount: 500 // Refill with $50 (500 credits)
});

console.log('Auto-refill configured:', autoRefillConfig);
```

**SDK Response Example:**
```javascript
{
  success: true,
  auto_refill_enabled: true,
  threshold: 100,
  amount_usd: 50,
  credits_per_refill: 500,
  estimated_refills_per_month: 2,
  estimated_monthly_cost: 100,
  next_evaluation: '2024-12-11T09:00:00Z',
  payment_method: {
    type: 'credit_card',
    last_four: '4242',
    expiry: '12/2025',
    verified: true
  },
  notification_settings: {
    email_alerts: true,
    webhook_url: null,
    slack_channel: null
  }
}
```

### Advanced Auto-Refill Settings

```javascript
// Configure smart auto-refill with usage prediction
const smartAutoRefill = await client.credits.configureAutoRefill({
  enabled: true,
  threshold: 150,
  amount: 1000, // $100 refill
  smart_refill: true, // Enable usage-based predictions
  maximum_per_month: 5, // Limit refills per month
  notification_webhook: 'https://api.myapp.com/webhooks/credits',
  business_hours_only: true, // Only refill during business hours
  weekend_refill: false
});
```

### Disable Auto-Refill

```javascript
// Disable automatic refills
const disableAutoRefill = await client.credits.configureAutoRefill({
  enabled: false
});

console.log('Auto-refill disabled:', disableAutoRefill);
```

## Payment History & Analytics

### Get Transaction History

Retrieve detailed payment and usage history:

```javascript
// Get recent payment history
const paymentHistory = await client.credits.getPaymentHistory({
  limit: 20,
  include_usage: true,
  start_date: '2024-11-01',
  end_date: '2024-12-01'
});

console.log('Payment history:', paymentHistory);
```

**SDK Response Example:**
```javascript
{
  success: true,
  transactions: [
    {
      id: 'txn_abc123',
      type: 'purchase',
      amount_usd: 100,
      credits_added: 1000,
      status: 'completed',
      timestamp: '2024-11-15T14:30:00Z',
      payment_method: 'credit_card_4242',
      description: 'Credit purchase',
      metadata: {
        campaign: 'holiday_bonus',
        bonus_credits: 100
      }
    },
    {
      id: 'txn_def456', 
      type: 'usage',
      credits_used: 45.6,
      status: 'completed',
      timestamp: '2024-11-14T09:15:00Z',
      service: 'neural_training',
      description: 'LSTM model training - 50 epochs',
      details: {
        model_id: 'model_789',
        training_time: 3600,
        gpu_hours: 1.5
      }
    },
    {
      id: 'txn_ghi789',
      type: 'refund',
      amount_usd: 25,
      credits_refunded: 250,
      status: 'completed',
      timestamp: '2024-11-10T16:45:00Z',
      reason: 'service_interruption',
      description: 'Refund for failed training job'
    }
  ],
  summary: {
    total_transactions: 156,
    total_purchased_usd: 2450,
    total_credits_purchased: 24500,
    total_credits_used: 22534,
    current_balance: 1966,
    average_monthly_spend: 245
  },
  period_stats: {
    start_date: '2024-11-01',
    end_date: '2024-12-01',
    transactions_count: 47,
    total_spend: 450,
    credits_purchased: 4500,
    credits_used: 3234
  }
}
```

### Usage Analytics

```javascript
// Get detailed usage analytics
const usageAnalytics = await client.credits.getUsageAnalytics({
  timeframe: '30d',
  breakdown_by: ['service', 'day'],
  include_forecasting: true
});

console.log('Usage analytics:', usageAnalytics);
```

**SDK Response Example:**
```javascript
{
  success: true,
  timeframe: '30d',
  total_credits_used: 1234.5,
  average_daily_usage: 41.15,
  breakdown_by_service: {
    neural_training: {
      credits: 567.8,
      percentage: 46.0,
      sessions: 23
    },
    swarm_orchestration: {
      credits: 345.2,
      percentage: 28.0,
      sessions: 67
    },
    sandbox_execution: {
      credits: 234.1,
      percentage: 19.0,
      sessions: 189
    },
    workflow_processing: {
      credits: 87.4,
      percentage: 7.0,
      sessions: 45
    }
  },
  daily_usage: [
    { date: '2024-11-01', credits: 45.6 },
    { date: '2024-11-02', credits: 32.1 },
    { date: '2024-11-03', credits: 67.8 }
    // ... more daily data
  ],
  forecasting: {
    next_30_days_estimate: 1456.7,
    confidence_interval: 0.85,
    seasonal_factors: ['increased_usage_weekdays'],
    recommended_budget: 1600
  }
}
```

### Export Financial Data

```javascript
// Export data for accounting/finance
const financialExport = await client.credits.exportFinancialData({
  format: 'csv', // 'csv', 'json', 'pdf'
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  include_tax_details: true,
  include_usage_breakdown: true
});

console.log('Financial export:', financialExport);
```

## Billing & Invoicing

### Generate Invoices

```javascript
// Generate monthly invoice
const invoice = await client.credits.generateInvoice({
  period: '2024-11',
  format: 'pdf',
  include_usage_details: true,
  billing_address: {
    company: 'AI Research Corp',
    address: '123 Tech Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'US'
  }
});

console.log('Invoice generated:', invoice);
```

### Subscription Management

```javascript
// Manage subscription billing
const subscription = await client.credits.manageSubscription({
  action: 'update',
  plan: 'enterprise',
  billing_cycle: 'monthly',
  auto_renewal: true,
  credit_allowance: 10000 // Monthly allowance
});
```

## Credit Allocation & Teams

### Team Credit Allocation

```javascript
// Allocate credits to team members
const allocation = await client.credits.allocateCredits({
  allocations: [
    {
      user_id: 'user_123',
      credits: 500,
      purpose: 'neural_training',
      expiry: '2024-12-31'
    },
    {
      user_id: 'user_456', 
      credits: 300,
      purpose: 'sandbox_development',
      expiry: '2024-12-31'
    }
  ],
  notify_users: true
});

console.log('Credits allocated:', allocation);
```

### Credit Transfer

```javascript
// Transfer credits between accounts
const transfer = await client.credits.transferCredits({
  from_user: 'user_123',
  to_user: 'user_456',
  amount: 100,
  reason: 'project_collaboration',
  require_approval: true
});
```

## Error Handling

```javascript
try {
  await client.credits.createPaymentLink({ amount: 5 }); // Below minimum
} catch (error) {
  switch (error.code) {
    case 'AMOUNT_TOO_LOW':
      console.log('Payment amount below minimum $10');
      break;
    case 'PAYMENT_METHOD_REQUIRED':
      console.log('No payment method configured');
      break;
    case 'CREDIT_LIMIT_EXCEEDED':
      console.log('Account credit limit exceeded');
      break;
    case 'PAYMENT_FAILED':
      console.log('Payment processing failed:', error.details);
      break;
    case 'INSUFFICIENT_CREDITS':
      console.log('Not enough credits for operation');
      break;
    case 'AUTO_REFILL_FAILED':
      console.log('Automatic refill failed:', error.reason);
      break;
    default:
      console.error('Credit management error:', error.message);
  }
}
```

## Best Practices

### 1. Balance Monitoring

```javascript
// Implement proactive balance monitoring
class CreditMonitor {
  constructor(client, thresholds = { warning: 100, critical: 20 }) {
    this.client = client;
    this.thresholds = thresholds;
    this.setupMonitoring();
  }
  
  async setupMonitoring() {
    // Check balance every hour
    setInterval(() => {
      this.checkBalance();
    }, 3600000);
  }
  
  async checkBalance() {
    const balance = await this.client.credits.checkBalance();
    
    if (balance.balance <= this.thresholds.critical) {
      await this.handleCriticalBalance(balance);
    } else if (balance.balance <= this.thresholds.warning) {
      await this.handleLowBalance(balance);
    }
  }
  
  async handleCriticalBalance(balance) {
    console.error('CRITICAL: Low credit balance', balance.balance);
    
    // Auto-enable refill if not enabled
    if (!balance.auto_refill_enabled) {
      await this.client.credits.configureAutoRefill({
        enabled: true,
        threshold: this.thresholds.warning,
        amount: 500
      });
    }
    
    // Notify team
    await this.notifyTeam('critical', balance);
  }
  
  async handleLowBalance(balance) {
    console.warn('WARNING: Low credit balance', balance.balance);
    await this.notifyTeam('warning', balance);
  }
}
```

### 2. Cost Optimization

```javascript
// Optimize credit usage across services
async function optimizeCreditUsage() {
  const analytics = await client.credits.getUsageAnalytics({
    timeframe: '7d',
    breakdown_by: ['service']
  });
  
  // Identify expensive services
  const expensiveServices = Object.entries(analytics.breakdown_by_service)
    .filter(([_, data]) => data.percentage > 30)
    .map(([service, data]) => ({ service, ...data }));
  
  console.log('High-cost services:', expensiveServices);
  
  // Suggest optimizations
  for (const service of expensiveServices) {
    if (service.service === 'neural_training') {
      console.log('Consider using smaller models or fewer epochs');
    } else if (service.service === 'sandbox_execution') {
      console.log('Review sandbox timeout settings and cleanup policies');
    }
  }
}
```

### 3. Budget Management

```javascript
// Implement budget controls
class BudgetManager {
  constructor(client, monthlyBudget) {
    this.client = client;
    this.monthlyBudget = monthlyBudget;
  }
  
  async checkBudgetCompliance() {
    const analytics = await this.client.credits.getUsageAnalytics({
      timeframe: '30d'
    });
    
    const currentSpend = analytics.total_credits_used * 0.1; // $0.10 per credit
    const budgetUsed = (currentSpend / this.monthlyBudget) * 100;
    
    if (budgetUsed > 90) {
      console.warn('Budget 90% utilized');
      await this.implementSpendingControls();
    } else if (budgetUsed > 80) {
      console.warn('Budget 80% utilized');
      await this.sendBudgetAlert();
    }
    
    return {
      budget: this.monthlyBudget,
      spent: currentSpend,
      remaining: this.monthlyBudget - currentSpend,
      percentage_used: budgetUsed
    };
  }
  
  async implementSpendingControls() {
    // Reduce auto-refill amounts
    await this.client.credits.configureAutoRefill({
      enabled: true,
      amount: 100, // Smaller refill amounts
      threshold: 50
    });
  }
}
```

### 4. Financial Reporting

```javascript
// Generate comprehensive financial reports
async function generateMonthlyReport(month, year) {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const [paymentHistory, usageAnalytics] = await Promise.all([
    client.credits.getPaymentHistory({
      start_date: startDate,
      end_date: endDate,
      limit: 1000
    }),
    client.credits.getUsageAnalytics({
      start_date: startDate,
      end_date: endDate,
      breakdown_by: ['service', 'day']
    })
  ]);
  
  const report = {
    period: `${year}-${month}`,
    financial_summary: {
      total_spent: paymentHistory.period_stats.total_spend,
      credits_purchased: paymentHistory.period_stats.credits_purchased,
      credits_used: paymentHistory.period_stats.credits_used,
      efficiency_ratio: paymentHistory.period_stats.credits_used / paymentHistory.period_stats.credits_purchased
    },
    usage_breakdown: usageAnalytics.breakdown_by_service,
    cost_per_service: {},
    recommendations: []
  };
  
  // Calculate cost per service
  for (const [service, data] of Object.entries(usageAnalytics.breakdown_by_service)) {
    report.cost_per_service[service] = data.credits * 0.1; // $0.10 per credit
  }
  
  return report;
}
```

## Webhooks & Notifications

### Setup Payment Webhooks

```javascript
// Configure webhooks for payment events
const webhookConfig = await client.credits.configureWebhooks({
  events: [
    'payment.completed',
    'payment.failed',
    'balance.low',
    'auto_refill.completed',
    'auto_refill.failed'
  ],
  webhook_url: 'https://api.myapp.com/webhooks/payments',
  secret_key: 'webhook_secret_123'
});
```

### Handle Webhook Events

```javascript
// Process incoming webhook events
function handlePaymentWebhook(event) {
  switch (event.type) {
    case 'payment.completed':
      console.log('Payment successful:', event.data);
      // Update user account, send confirmation
      break;
      
    case 'balance.low':
      console.log('Low balance alert:', event.data);
      // Send notification to team
      break;
      
    case 'auto_refill.failed':
      console.error('Auto-refill failed:', event.data);
      // Alert administrators, disable auto-refill
      break;
  }
}
```

## Next Steps

- [Storage Management](../storage/file-storage.md) - File storage and management
- [User Management](../authentication/users.md) - Account management
- [System Monitoring](../system/monitoring.md) - Usage tracking