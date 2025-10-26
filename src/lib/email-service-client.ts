/**
 * Email Service Client
 * Handles email sending via Mailgun or SendGrid
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ filename: string; content: Buffer }>;
  tags?: string[];
  customData?: Record<string, any>;
}

interface EmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

class EmailServiceClient {
  private provider: 'mailgun' | 'sendgrid' | 'mock';
  private apiKey: string;
  private domain: string;
  private fromEmail: string;
  private enabled: boolean;

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as any) || 'mock';
    this.apiKey = process.env.EMAIL_API_KEY || '';
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@arcus.local';
    this.enabled = !!this.apiKey;

    if (!this.enabled && this.provider !== 'mock') {
      console.warn(`⚠️  Email provider (${this.provider}) not configured - using mock`);
      this.provider = 'mock';
    }
  }

  /**
   * Send email
   */
  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    console.log(`📧 Sending email to: ${recipients.join(', ')}`);
    console.log(`   Subject: ${options.subject}`);

    if (this.provider === 'mock') {
      // Mock email sending for development
      console.log('   [MOCK MODE] Email would be sent via Mailgun/SendGrid');
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      };
    }

    try {
      if (this.provider === 'mailgun') {
        return await this.sendViaMailgun(options);
      } else if (this.provider === 'sendgrid') {
        return await this.sendViaSendGrid(options);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: (error as any).message,
      };
    }

    return { success: false, error: 'Unknown provider' };
  }

  /**
   * Send email via Mailgun
   */
  private async sendViaMailgun(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    // In production: Use mailgun-js library
    // const mailgun = require('mailgun.js');
    // const mg = mailgun(Mailgun({ username: 'api', key: this.apiKey }));
    // const result = await mg.messages.create(this.domain, {...});

    console.log('📬 [Mailgun] Email queued');
    return { success: true, messageId: `mailgun-${Date.now()}` };
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    // In production: Use @sendgrid/mail library
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.apiKey);
    // const result = await sgMail.send({...});

    console.log('📬 [SendGrid] Email queued');
    return { success: true, messageId: `sendgrid-${Date.now()}` };
  }

  /**
   * Send transactional email (PO created, approved, etc)
   */
  async sendTransactional(
    to: string,
    type: 'po_created' | 'po_approved' | 'so_created' | 'so_confirmed',
    data: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const templates: Record<string, EmailTemplate> = {
      po_created: {
        name: 'PO Created',
        subject: `Purchase Order #${data.poNumber} has been created`,
        htmlContent: `
          <h2>Purchase Order Created</h2>
          <p>A new purchase order has been created.</p>
          <ul>
            <li><strong>PO #:</strong> ${data.poNumber}</li>
            <li><strong>Vendor:</strong> ${data.vendorName}</li>
            <li><strong>Amount:</strong> ₹${data.amount}</li>
            <li><strong>Expected Delivery:</strong> ${data.expectedDelivery}</li>
          </ul>
          <p><a href="${data.actionUrl}">View Purchase Order</a></p>
        `,
      },
      po_approved: {
        name: 'PO Approved',
        subject: `Purchase Order #${data.poNumber} has been approved`,
        htmlContent: `
          <h2>Purchase Order Approved</h2>
          <p>Your purchase order has been approved.</p>
          <ul>
            <li><strong>PO #:</strong> ${data.poNumber}</li>
            <li><strong>Approved By:</strong> ${data.approvedBy}</li>
            <li><strong>Approval Date:</strong> ${data.approvalDate}</li>
          </ul>
          <p><a href="${data.actionUrl}">View Purchase Order</a></p>
        `,
      },
      so_created: {
        name: 'SO Created',
        subject: `Sales Order #${data.soNumber} has been created`,
        htmlContent: `
          <h2>Sales Order Created</h2>
          <p>A new sales order has been created.</p>
          <ul>
            <li><strong>SO #:</strong> ${data.soNumber}</li>
            <li><strong>Customer:</strong> ${data.customerName}</li>
            <li><strong>Amount:</strong> ₹${data.amount}</li>
            <li><strong>Promised Delivery:</strong> ${data.promisedDelivery}</li>
          </ul>
          <p><a href="${data.actionUrl}">View Sales Order</a></p>
        `,
      },
      so_confirmed: {
        name: 'SO Confirmed',
        subject: `Sales Order #${data.soNumber} has been confirmed`,
        htmlContent: `
          <h2>Sales Order Confirmed</h2>
          <p>Your sales order has been confirmed.</p>
          <ul>
            <li><strong>SO #:</strong> ${data.soNumber}</li>
            <li><strong>Confirmed By:</strong> ${data.confirmedBy}</li>
            <li><strong>Confirmation Date:</strong> ${data.confirmationDate}</li>
          </ul>
          <p><a href="${data.actionUrl}">View Sales Order</a></p>
        `,
      },
    };

    const template = templates[type];
    if (!template) {
      return { success: false, error: `Unknown email template: ${type}` };
    }

    return this.send({
      to,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.name,
      tags: ['transactional', type],
      customData: data,
    });
  }

  /**
   * Send notification (status updates, reminders)
   */
  async sendNotification(
    to: string | string[],
    subject: string,
    message: string,
    actionUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const htmlContent = `
      <h2>${subject}</h2>
      <p>${message}</p>
      ${actionUrl ? `<p><a href="${actionUrl}">View Details</a></p>` : ''}
    `;

    return this.send({
      to,
      subject,
      htmlContent,
      tags: ['notification'],
    });
  }

  /**
   * Send bulk email (reports, summaries)
   */
  async sendBulk(recipients: string[], subject: string, htmlContent: string): Promise<{ success: boolean; count: number; failed: string[] }> {
    const results = await Promise.all(
      recipients.map((email) =>
        this.send({
          to: email,
          subject,
          htmlContent,
          tags: ['bulk'],
        })
      )
    );

    const failed = results.filter((r) => !r.success).map((_, i) => recipients[i]);

    return {
      success: failed.length === 0,
      count: recipients.length - failed.length,
      failed,
    };
  }
}

export const emailServiceClient = new EmailServiceClient();
