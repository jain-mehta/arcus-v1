# Firebase Command Center - Enterprise ERP Platform

**A modern, AI-powered, multi-tenant SaaS platform for complete business operations management.**

---

## 🎯 **What is Firebase Command Center?**

Firebase Command Center is an enterprise-grade ERP system that unifies all core business operations into a single, secure, role-based platform. Built for scalability, it's designed to serve businesses in manufacturing, retail, and distribution sectors.

### **Perfect For:**
- Manufacturing Companies
- Retail Chains with Multiple Stores
- Distribution & Supply Chain Businesses
- Bath Fittings & Sanitary Ware Companies
- Any business needing integrated Vendor, Inventory, Sales, and HR management

---

## ✨ **Core Features**

### 📦 **Vendor & Procurement Management**
- Vendor onboarding with approval workflows
- Purchase order creation, tracking & approval
- Material catalog mapping with volume pricing
- Invoice management & payment tracking
- Vendor performance scoring & rating
- Automated reorder notifications

### 📊 **Inventory Management**
- Multi-location inventory (Factory + Stores)
- Real-time stock tracking with SKU management
- Goods Inward/Outward (GRN) processing
- Stock transfers between locations
- Inventory valuation (FIFO, LIFO, Weighted Average)
- AI-powered catalog extraction from images
- Low stock alerts & reorder management

### 💼 **Sales & CRM**
- Lead capture & assignment
- Visual opportunity pipeline (Kanban board)
- Customer account management with full history
- AI-assisted quotation generation
- Order management from quote to delivery
- Sales performance tracking & reporting
- Communication logging

### 🏪 **Store Operations**
- Point of Sale (POS) billing system
- Store-specific inventory management
- Stock receiving from factory
- Returns & credit note processing
- Store performance dashboards

### 👥 **Human Resources (HRMS)**
- Employee directory & profiles
- Attendance & shift management
- Leave request & approval workflow
- Payroll processing with custom salary structures
- Full & Final settlement
- Recruitment (Applicant Tracking System)
- Performance management & KPI tracking
- Policy documents & announcements

### 🔐 **Advanced Security & Access Control**
- Dynamic Role-Based Access Control (RBAC)
- Hierarchical permissions (President → Regional Head → Executive)
- Location-based access (Store-specific data)
- Custom permission templates
- Comprehensive audit logging
- Multi-tenant architecture

### 🤖 **AI-Powered Features**
- Product extraction from catalog images
- Intelligent quotation assistant
- Opportunity summary generation
- KPI suggestions based on performance

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ ([Download](https://nodejs.org/))
- Firebase CLI: `npm install -g firebase-tools`

### **Installation**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Firebase Emulators** (Terminal 1):
   ```bash
   firebase emulators:start
   ```

3. **Start Genkit AI Server** (Terminal 2):
   ```bash
   npm run genkit:dev
   ```

4. **Start Next.js Application** (Terminal 3):
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - **Main App:** http://localhost:3000
   - **Firebase Emulator UI:** http://127.0.0.1:4000/

### **Default Credentials**
- Email: `admin@example.com`
- Password: `Admin@123`

---

## 🏗️ **Technology Stack**

- **Frontend:** Next.js 15, React, TypeScript
- **UI Framework:** ShadCN UI, Tailwind CSS
- **Backend:** Next.js Server Actions
- **Database:** Google Firestore
- **Authentication:** Firebase Authentication
- **AI:** Genkit with Google AI (Gemini)
- **Hosting:** Firebase App Hosting

---

## 📱 **Multi-Tenant SaaS Ready**

The platform is architected from the ground up for multi-tenancy:

- ✅ All data scoped by `organizationId`
- ✅ Isolated user authentication per organization
- ✅ Custom branding support ready
- ✅ Independent role & permission management
- ✅ Secure data segregation with Firestore rules
- ✅ Audit logging per organization

---

## 🔧 **Configuration**

### **Firebase Setup**
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Download service account JSON and set as environment variable:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_BASE64=<your-base64-encoded-json>
   ```

### **Environment Variables**
Create a `.env.local` file:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
FIREBASE_SERVICE_ACCOUNT_BASE64=your-service-account-base64

# Genkit AI (Google AI)
GOOGLE_GENAI_API_KEY=your-gemini-api-key
```

---

## 📊 **User Roles & Permissions**

### **Pre-configured Roles:**
- **Admin** - Full system access
- **Sales President** - Organization-wide sales visibility
- **Regional Sales Head** - Region-scoped access with team view
- **Sales Executive** - Own leads & opportunities
- **Store Supervisor** - Store-specific operations
- **Factory Inventory Manager** - Central inventory control
- **HR Manager** - Employee lifecycle management

### **Custom Roles:**
Administrators can create unlimited custom roles with granular permissions for any business need.

---

## 🔒 **Security Features**

- ✅ Firebase Authentication with custom claims
- ✅ Firestore security rules with permission checks
- ✅ Server-side permission validation
- ✅ Hierarchical data access controls
- ✅ Audit logs for all critical operations
- ✅ Sensitive data masking based on roles
- ✅ Session management

---

## 📈 **Roadmap**

### **Phase 1 - Current** ✅
- Core ERP modules (Vendor, Inventory, Sales, HRMS, Store)
- Dynamic RBAC system
- AI-powered features
- Multi-tenant foundation

### **Phase 2 - Upcoming** 🚧
- Advanced analytics & reporting
- Mobile application (PWA)
- WhatsApp/SMS notifications
- Advanced workflow automation
- Custom dashboards

### **Phase 3 - Future** 🔮
- Multi-language support
- Advanced AI (demand forecasting, automated procurement)
- BigQuery integration for analytics
- Third-party integrations (Tally, ERPNext, etc.)

---

## 📞 **Support & Documentation**

- **Setup Guide:** See `RUN_LOCALLY.md`
- **Product Specs:** See `PRODUCT_REQUIREMENTS_DOCUMENT.md`
- **Database Rules:** See `firestore.rules`

---

## 📄 **License**

Proprietary - © 2025 Bobs Bath Fittings Pvt Ltd

---

**Built with ❤️ for modern businesses**
