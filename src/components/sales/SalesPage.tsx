import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Package,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SalesPageProps {
  user: any;
  onLogout: () => void;
}

interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postalCode: string;
  city: string;
  birthDate: string;
  gender: string;
  customerType: 'mobile' | 'bank' | 'insurance';
}

interface Product {
  id: string;
  name: string;
  points_value: number;
}

export const SalesPage = ({ user, onLogout }: SalesPageProps) => {
  const [customer, setCustomer] = useState<Customer>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    city: '',
    birthDate: '',
    gender: '',
    customerType: 'mobile'
  });
  
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [lockedLocation, setLockedLocation] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a locked location for the sale
    const savedLock = localStorage.getItem(`sales_location_lock_${user.id}`);
    if (!savedLock) {
      toast({
        variant: "destructive",
        title: "Ingen aktiv lokation",
        description: "Du skal først vælge og låse en lokation",
      });
      navigate('/app/sales');
      return;
    }

    const lockData = JSON.parse(savedLock);
    const lockTime = new Date(lockData.timestamp);
    const now = new Date();
    // Check if lock has expired (2 hours)
    if (now.getTime() - lockTime.getTime() >= 2 * 60 * 60 * 1000) {
      localStorage.removeItem(`sales_location_lock_${user.id}`);
      toast({
        variant: "destructive",
        title: "Lokation udløbet",
        description: "Din lokationslås er udløbet. Vælg lokation igen.",
      });
      navigate('/app/sales');
      return;
    }

    setLockedLocation(lockData.locationId);
    fetchProducts();
  }, [user.id, navigate, toast]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCustomerChange = (field: keyof Customer, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      // Cancel sale - unlock location
      localStorage.removeItem(`sales_location_lock_${user.id}`);
      toast({
        title: "Salg annulleret",
        description: "Lokation er frigivet",
      });
      navigate('/app/sales');
    }
  };

  const handleSubmitSale = async () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Vælg venligst et produkt",
      });
      return;
    }

    setLoading(true);
    try {
      // First create customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          first_name: customer.firstName,
          last_name: customer.lastName,
          email: customer.email,
          contact_number: customer.phone,
          postal_code: customer.postalCode,
          city: customer.city,
          birth_date: customer.birthDate,
          gender: customer.gender,
          customer_type: customer.customerType
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Then create sale
      const selectedProductData = products.find(p => p.id === selectedProduct);
      const { error: salesError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          customer_id: customerData.id,
          product_id: selectedProduct,
          location_id: lockedLocation,
          points: selectedProductData?.points_value || 0,
          customer_gender: customer.gender,
          customer_age: customer.birthDate ? new Date().getFullYear() - new Date(customer.birthDate).getFullYear() : null,
          permission: true
        });

      if (salesError) throw salesError;

      // Create customer type-specific info
      if (customer.customerType === 'mobile') {
        await supabase.from('customer_mobile_info').insert({
          customer_id: customerData.id,
          phone_number_to_move: customer.phone,
          current_provider: 'Ukendt'
        });
      }

      // Unlock location after successful sale
      localStorage.removeItem(`sales_location_lock_${user.id}`);

      toast({
        title: "Salg registreret! 🎉",
        description: `Du har optjent ${selectedProductData?.points_value || 0} point`,
      });

      setStep(4); // Success step
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fejl ved registrering",
        description: error.message || "Der opstod en fejl",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Registrer nyt salg</h1>
              <p className="text-muted-foreground">Trin {step} af 3</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-2 mb-8">
            <div 
              className="akita-gradient h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {step === 1 && (
            <Card className="akita-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <User className="mr-2 h-5 w-5" />
                  Kundeoplysninger
                </CardTitle>
                <CardDescription>Indtast kundens grundlæggende oplysninger</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Fornavn</Label>
                    <Input
                      id="firstName"
                      value={customer.firstName}
                      onChange={(e) => handleCustomerChange('firstName', e.target.value)}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Efternavn</Label>
                    <Input
                      id="lastName"
                      value={customer.lastName}
                      onChange={(e) => handleCustomerChange('lastName', e.target.value)}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={customer.email}
                      onChange={(e) => handleCustomerChange('email', e.target.value)}
                      className="pl-10 bg-input border-border"
                      placeholder="kunde@email.dk"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => handleCustomerChange('phone', e.target.value)}
                      className="pl-10 bg-input border-border"
                      placeholder="+45 12 34 56 78"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postnummer</Label>
                    <Input
                      id="postalCode"
                      value={customer.postalCode}
                      onChange={(e) => handleCustomerChange('postalCode', e.target.value)}
                      className="bg-input border-border"
                      placeholder="2100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">By</Label>
                    <Input
                      id="city"
                      value={customer.city}
                      onChange={(e) => handleCustomerChange('city', e.target.value)}
                      className="bg-input border-border"
                      placeholder="København"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="birthDate">Fødselsdato</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="birthDate"
                      type="date"
                      value={customer.birthDate}
                      onChange={(e) => handleCustomerChange('birthDate', e.target.value)}
                      className="pl-10 bg-input border-border"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gender">Køn</Label>
                  <Select value={customer.gender} onValueChange={(value) => handleCustomerChange('gender', value)}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Vælg køn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Mand</SelectItem>
                      <SelectItem value="female">Kvinde</SelectItem>
                      <SelectItem value="other">Andet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customerType">Kundetype</Label>
                  <Select value={customer.customerType} onValueChange={(value: 'mobile' | 'bank' | 'insurance') => handleCustomerChange('customerType', value)}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Vælg kundetype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobil</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="insurance">Forsikring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full akita-gradient hover:akita-glow"
                  disabled={!customer.firstName || !customer.lastName || !customer.phone}
                >
                  Fortsæt til produktvalg
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="akita-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Package className="mr-2 h-5 w-5" />
                  Vælg produkt
                </CardTitle>
                <CardDescription>Vælg det produkt kunden har købt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedProduct === product.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-input hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-foreground">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {product.points_value} point ved salg
                            </p>
                          </div>
                          {selectedProduct === product.id && (
                            <CheckCircle className="h-6 w-6 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Ingen produkter tilgængelige</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    Tilbage
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="flex-1 akita-gradient hover:akita-glow"
                    disabled={!selectedProduct}
                  >
                    Fortsæt til bekræftelse
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="akita-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Bekræft salg
                </CardTitle>
                <CardDescription>Gennemgå og bekræft salgsoplysningerne</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-input p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Kunde</h3>
                  <p className="text-foreground">{customer.firstName} {customer.lastName}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>

                <div className="bg-input p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Produkt</h3>
                  <p className="text-foreground">
                    {products.find(p => p.id === selectedProduct)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Point: {products.find(p => p.id === selectedProduct)?.points_value}
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    Tilbage
                  </Button>
                  <Button 
                    onClick={handleSubmitSale}
                    className="flex-1 akita-gradient hover:akita-glow"
                    disabled={loading}
                  >
                    {loading ? "Registrerer..." : "Registrer salg"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="akita-card border-border text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Salg registreret!</h2>
                <p className="text-muted-foreground mb-6">
                  Du har optjent {products.find(p => p.id === selectedProduct)?.points_value} point
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={() => {
                      // Need to have location lock to start new sale
                      navigate('/app/sales');
                    }}
                    className="w-full akita-gradient hover:akita-glow"
                  >
                    Registrer nyt salg
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/app/sales')}
                    className="w-full"
                  >
                    Tilbage til salgsapp
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};