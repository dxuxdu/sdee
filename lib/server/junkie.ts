import axios from 'axios';
import crypto from 'crypto';

interface JunkieConfig {
  webhookUrl?: string;
  webhookUrlWeekly?: string;
  webhookUrlMonthly?: string;
  webhookUrlLifetime?: string;
  hmacSecret?: string;
  provider?: string;
  defaultService?: string;
}

export interface JunkieResponse {
  success: boolean;
  keys?: string[];
  webhookResponse?: any;
  error?: string;
  details?: any;
}

export class JunkieKeySystem {
  private webhookUrls: Record<string, string | undefined>;
  private hmacSecret?: string;
  private provider: string;
  private defaultService: string;

  constructor(config: JunkieConfig) {
    this.webhookUrls = {
      weekly: config.webhookUrlWeekly || config.webhookUrl,
      monthly: config.webhookUrlMonthly || config.webhookUrl,
      lifetime: config.webhookUrlLifetime || config.webhookUrl
    };
    this.hmacSecret = config.hmacSecret ? config.hmacSecret.trim() : undefined;
    this.provider = config.provider || 'seisenhub';
    this.defaultService = config.defaultService || 'Premium Key';
  }

  generateHMAC(payload: any): string | null {
    if (!this.hmacSecret) {
      return null;
    }
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(payloadString)
      .digest('hex');
  }

  async generateKey(options: any): Promise<JunkieResponse> {
    const {
      tier = 'weekly',
      validity = 168,
      quantity = 1,
      userInfo = {},
      paymentInfo = {}
    } = options;

    const payload = {
      item: {
        product: {
          name: 'Premium Key'
        },
        quantity: quantity
      },
      user: {
        email: userInfo.email || '',
        payerId: userInfo.payerId || '',
        robloxUsername: userInfo.robloxUsername || userInfo.custom || ''
      },
      payment: {
        tier: tier,
        amount: paymentInfo.amount || 0,
        currency: paymentInfo.currency || 'EUR',
        transactionId: paymentInfo.transactionId || '',
        timestamp: new Date().toISOString()
      },
      metadata: {
        provider: this.provider,
        service: this.defaultService,
        validity: validity,
        source: 'paypal_webhook'
      }
    };

    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (this.hmacSecret) {
        headers['X-Webhook-Signature'] = this.generateHMAC(payload);
      }

      const webhookUrl = this.webhookUrls[tier] || this.webhookUrls.weekly;
      
      if (!webhookUrl) {
          throw new Error('No webhook URL configured for this tier');
      }

      console.log('Calling Junkie webhook for tier:', tier);
      
      const response = await axios.post(webhookUrl, payload, {
        headers,
        timeout: 30000
      });

      console.log('Junkie webhook response:', response.data);

      let keys: string[] = [];
      if (typeof response.data === 'string') {
        keys = [response.data];
      } else if (response.data.keys && Array.isArray(response.data.keys)) {
        keys = response.data.keys;
      } else if (response.data.key) {
        keys = [response.data.key];
      } else if (Array.isArray(response.data)) {
        keys = response.data;
      }

      return {
        success: true,
        keys: keys,
        webhookResponse: response.data
      };

    } catch (error: any) {
      console.error('Junkie webhook error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        details: error.response?.status || 'Unknown error'
      };
    }
  }
}
