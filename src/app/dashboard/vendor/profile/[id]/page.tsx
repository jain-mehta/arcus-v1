
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, MessageSquare, Star, ArrowLeft } from 'lucide-react';
import { getPurchaseOrders, getVendorDocuments, getCommunicationLogsByVendorId } from '@/lib/firebase/firestore';
import { ClientWrapper } from './client-wrapper';
import type { CommunicationLog, Vendor, VendorDocument, User } from '@/lib/firebase/types';
import { Button } from '@/components/ui/button';
import { getVendor, getStoreManagers } from './actions';
import { notFound } from 'next/navigation';

function VendorNotFound() {
  return (
    <div className="text-center py-16">
      <h2 className="text-2xl font-bold mb-2">Vendor Not Found</h2>
      <p className="text-muted-foreground mb-6">The vendor you are looking for does not exist.</p>
      <Button asChild>
        <Link href="/dashboard/vendor/list">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vendor List
        </Link>
      </Button>
    </div>
  )
}

export default async function VendorProfilePage({ params }: any) {
  const vendorData = await getVendor(params.id);

  if (!vendorData) {
    return <VendorNotFound />;
  }
  
  // Fetch related data concurrently for better performance
  const [{ purchaseOrders }, documents, communicationLog, storeManagers] = await Promise.all([
    getPurchaseOrders(vendorData.id),
    getVendorDocuments(vendorData.id),
    getCommunicationLogsByVendorId(vendorData.id),
    getStoreManagers() // Fetching managers for the edit dialog
  ]);

  const outstandingBalance = purchaseOrders
    .filter(po => po.paymentStatus !== 'Paid')
    .reduce((acc, po) => acc + (po.totalAmount - po.amountGiven), 0);
  
  const lastPayment = purchaseOrders
    .filter(po => po.paymentStatus === 'Paid')
    .sort((a,b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())[0];


  const generalInfo = {
    'Business Name': vendorData.name,
    'Vendor Category': vendorData.category,
    'Operational Region': vendorData.operationalRegion,
    'Contact Name': vendorData.contact?.name,
    'Contact Email': vendorData.contact?.email,
    'Contact Phone': vendorData.contact?.phone,
    'Business Address': vendorData.address,
    Website: vendorData.website,
  };

  const paymentAndTermsInfo = {
    'Payment Terms': vendorData.paymentTerms,
    'Preferred Payment Method': vendorData.preferredPaymentMethod,
    'Outstanding Balance': `₹${outstandingBalance.toLocaleString('en-IN')}`,
    'Last Payment Date': lastPayment ? new Date(lastPayment.deliveryDate).toLocaleDateString() : 'N/A',
  };

  const taxInfo = {
    GSTIN: vendorData.tax?.gstin,
    'PAN Number': vendorData.tax?.panNumber,
  };

  const bankingInfo = {
    'Bank Name': vendorData.banking?.bankName,
    'Account Holder Name': vendorData.banking?.accountHolderName,
    'Account Number': vendorData.banking?.accountNumber ? '**** **** ' + vendorData.banking.accountNumber.slice(-4) : undefined, // Mask account number
    'IFSC Code': vendorData.banking?.ifscCode,
  };

  const performance = {
    onTimeDelivery: vendorData.onTimeDelivery,
    qualityScore: vendorData.qualityScore,
    avgResponseTime: vendorData.avgResponseTime,
  };
  

  return (
    <div className="space-y-8">
        <ClientWrapper vendorData={vendorData} storeManagers={storeManagers}/>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <InfoCard title="General Information" data={generalInfo} />
          <InfoCard title="Payment & Terms" data={paymentAndTermsInfo} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InfoCard title="GST & Tax Details" data={taxInfo} />
            <InfoCard title="Banking Details" data={bankingInfo} />
          </div>
          <PerformanceCard performance={performance} />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <DocumentRepository documents={documents} />
          <CommunicationLog log={communicationLog} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  data,
}: {
  title: string;
  data: Record<string, string | undefined>;
}) {
  const filteredData = Object.entries(data).filter(([_, value]) => value !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {filteredData.map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm font-medium text-muted-foreground">
                {key}
              </dt>
              <dd className="text-sm text-foreground">{value || 'N/A'}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function PerformanceCard({
  performance,
}: {
  performance: Record<string, any>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring & Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">On-Time Delivery</span>
            <span className="text-sm font-medium">
              {performance.onTimeDelivery || 0}%
            </span>
          </div>
          <Progress
            value={performance.onTimeDelivery || 0}
            aria-label={`${performance.onTimeDelivery || 0}% on-time delivery`}
          />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Overall Quality Score</span>
            <span className="text-sm font-medium">
              {performance.qualityScore || 0} / 5
            </span>
          </div>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(performance.qualityScore || 0)
                    ? 'text-primary fill-current'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Average Response Time
          </p>
          <p className="text-sm font-semibold">{performance.avgResponseTime || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentRepository({
  documents,
}: {
  documents: VendorDocument[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Repository</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length > 0 ? (
            documents.map((doc) => (
            <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50"
            >
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium truncate">{doc.name}</span>
            </a>
            ))
        ) : (
            <p className="text-sm text-muted-foreground text-center p-4">No documents uploaded.</p>
        )}
      </CardContent>
    </Card>
  );
}

function CommunicationLog({
  log,
}: {
  log: CommunicationLog[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {log.length > 0 ? (
            log.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                <p className="text-sm font-medium">{item.type} - {item.user}</p>
                <p className="text-xs text-muted-foreground pb-1">
                    {new Date(item.date).toLocaleString()}
                </p>
                <p className='text-sm'>{item.summary}</p>
                </div>
            </div>
            ))
        ) : (
             <p className="text-sm text-muted-foreground text-center p-4">No communication logged.</p>
        )}
      </CardContent>
    </Card>
  );
}
