const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Basic env parser since we can't use dotenv easily with ES modules/custom paths without setup
function parseEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key && !key.startsWith('#')) {
                env[key] = value;
            }
        }
    });
    return env;
}

async function testJunkie() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        const env = parseEnv(envPath);
        
        const webhookUrl = env.JUNKIE_WEBHOOK_URL_WEEKLY || env.JUNKIE_WEBHOOK_URL;
        
        if (!webhookUrl) {
            console.error('❌ No Junkie Webhook URL found in .env.local');
            return;
        }

        console.log('Testing Webhook URL:', webhookUrl);

        const payload = {
            item: {
                product: { name: 'Premium Key (Test)' },
                quantity: 1
            },
            user: {
                email: 'test@seisen-debug.com',
                payerId: 'TEST-PAYER-ID',
                robloxUsername: 'SeisenDebugger'
            },
            payment: {
                tier: 'weekly',
                amount: 3.00,
                currency: 'EUR',
                transactionId: 'TEST-TX-' + Date.now(),
                timestamp: new Date().toISOString()
            },
            metadata: {
                provider: env.JUNKIE_PROVIDER || 'seisenhub',
                service: env.JUNKIE_SERVICE || 'Premium Key',
                validity: 168,
                source: 'debug_script'
            }
        };

        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        const hmacSecret = env.JUNKIE_HMAC_SECRET;
        const headers = { 'Content-Type': 'application/json' };

        if (hmacSecret) {
            console.log('Generating HMAC signature...');
            const crypto = require('crypto');
            const signature = crypto
                .createHmac('sha256', hmacSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            headers['X-Webhook-Signature'] = signature;
            console.log('Signature:', signature);
        } else {
            console.warn('⚠️ No HMAC Secret found - request depends on Junkie config');
        }

        const response = await axios.post(webhookUrl, payload, {
            headers: headers,
            timeout: 10000
        });

        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Request Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testJunkie();
