import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarDays, CreditCard, Building2, Send } from 'lucide-react';

export default function PaymentForm() {
const [formData, setFormData] = useState({
issuerBic: 'AAAAAXXX',
issuerIban: 'AKJDKSJDLJSDK',
issuerCurrency: 'EUR',
beneficiaryBic: 'BBBBBXXX',
beneficiaryIban: 'HSLKHSLFHLKFS',
beneficiaryCurrency: 'EUR',
executionDate: new Date().toISOString().split('T')[0],
amount: '123.99',
currency: 'EUR'
});

const [jsonResponse, setJsonResponse] = useState(null);
const [showResponse, setShowResponse] = useState(false);

const handleInputChange = (field, value) => {
setFormData(prev => ({
...prev,
[field]: value
}));
};

const handleSubmit = (e) => {
e.preventDefault();

    const paymentData = {
      issuer: {
        bic: formData.issuerBic,
        iban: formData.issuerIban,
        currency: formData.issuerCurrency
      },
      beneficiary: {
        bic: formData.beneficiaryBic,
        iban: formData.beneficiaryIban,
        currency: formData.beneficiaryCurrency
      },
      executionDate: formData.executionDate,
      amount: parseFloat(formData.amount),
      currency: formData.currency
    };

    setJsonResponse(paymentData);
    setShowResponse(true);
};

return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
<div className="max-w-4xl mx-auto space-y-6">
<div className="text-center py-8">
<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
Payment Transfer
</h1>
<p className="text-gray-600 mt-2">Secure international money transfer</p>
</div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
              <CardDescription className="text-blue-100">
                Enter the transfer information below
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                {/* Issuer Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    Issuer (Sender)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="issuerBic">BIC Code</Label>
                      <Input
                        id="issuerBic"
                        value={formData.issuerBic}
                        onChange={(e) => handleInputChange('issuerBic', e.target.value)}
                        placeholder="AAAAAXXX"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="issuerCurrency">Currency</Label>
                      <Select value={formData.issuerCurrency} onValueChange={(value) => handleInputChange('issuerCurrency', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="issuerIban">IBAN</Label>
                    <Input
                      id="issuerIban"
                      value={formData.issuerIban}
                      onChange={(e) => handleInputChange('issuerIban', e.target.value)}
                      placeholder="AKJDKSJDLJSDK"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Beneficiary Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Building2 className="w-5 h-5 text-green-500" />
                    Beneficiary (Receiver)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="beneficiaryBic">BIC Code</Label>
                      <Input
                        id="beneficiaryBic"
                        value={formData.beneficiaryBic}
                        onChange={(e) => handleInputChange('beneficiaryBic', e.target.value)}
                        placeholder="BBBBBXXX"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="beneficiaryCurrency">Currency</Label>
                      <Select value={formData.beneficiaryCurrency} onValueChange={(value) => handleInputChange('beneficiaryCurrency', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="beneficiaryIban">IBAN</Label>
                    <Input
                      id="beneficiaryIban"
                      value={formData.beneficiaryIban}
                      onChange={(e) => handleInputChange('beneficiaryIban', e.target.value)}
                      placeholder="HSLKHSLFHLKFS"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Transfer Details */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Send className="w-5 h-5 text-purple-500" />
                    Transfer Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="123.99"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="executionDate">Execution Date</Label>
                      <div className="relative">
                        <Input
                          id="executionDate"
                          type="date"
                          value={formData.executionDate}
                          onChange={(e) => handleInputChange('executionDate', e.target.value)}
                          className="mt-1 pl-10"
                        />
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 mt-0.5" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 text-lg font-semibold"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Generate Payment JSON
                </Button>
                              </div>
            </CardContent>
          </Card>

          {/* JSON Response */}
          <Card className={`shadow-xl border-0 bg-white/70 backdrop-blur-sm transition-all duration-500 ${showResponse ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle>JSON Response</CardTitle>
              <CardDescription className="text-green-100">
                Generated payment data structure
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {jsonResponse ? (
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(jsonResponse, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <p>Submit the form to see the JSON response</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
);
}
