import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Lock, Phone, Calendar, Upload, Camera, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OnboardingPageProps {
  onComplete: (user: any) => void;
}

export const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    address: '',
    postalCode: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Adgangskoder matcher ikke",
        description: "Sørg for at begge adgangskoder er ens",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Adgangskode for kort",
        description: "Adgangskoden skal være mindst 6 tegn",
      });
      return;
    }

    setLoading(true);

    try {
      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (passwordError) {
        toast({
          variant: "destructive",
          title: "Fejl ved opdatering af adgangskode",
          description: passwordError.message,
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Ingen bruger fundet",
          description: "Der opstod en fejl",
        });
        return;
      }

      let profileImageUrl = null;

      // Upload profile image if provided
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}/${user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profileImage, { upsert: true, contentType: profileImage.type, cacheControl: '3600' });
        if (uploadError) {
          console.error('Image upload error:', uploadError);
          toast({
            variant: "destructive",
            title: "Billede kunne ikke uploades",
            description: "Profilen oprettes uden billede",
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          profileImageUrl = publicUrl;
        }
      }

      // Update user information
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          birth_date: formData.birthDate || null,
          first_login_completed: true,
          force_password_reset: false
        })
        .eq('id', user.id);

      // Update customer record if exists (for address info)
      await supabase
        .from('customers')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          contact_number: formData.phone,
          birth_date: formData.birthDate || null,
          postal_code: formData.postalCode,
          city: formData.city
        })
        .eq('email', user.email);

      // Update profile with image if uploaded
      if (profileImageUrl) {
        await supabase
          .from('profiles')
          .update({ profile_image_url: profileImageUrl })
          .eq('user_id', user.id);
      }

      if (userError) {
        toast({
          variant: "destructive",
          title: "Fejl ved opdatering af profil",
          description: userError.message,
        });
        return;
      }

      toast({
        title: "Velkommen til AKITA!",
        description: "Din profil er oprettet og du er nu klar til at komme i gang",
      });

      onComplete(user);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Der opstod en fejl",
        description: "Prøv igen senere",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg akita-card border-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Velkommen til AKITA!
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Udfyld dine oplysninger og opret din adgangskode for at komme i gang
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImagePreview || undefined} />
                  <AvatarFallback className="text-2xl">
                    {formData.firstName ? formData.firstName[0] : <User />}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="profileImage" 
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Klik på kameraet for at uploade dit profilbillede
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">
                  Fornavn *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="pl-10 bg-input border-border"
                    placeholder="Dit fornavn"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Efternavn *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="pl-10 bg-input border-border"
                    placeholder="Dit efternavn"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Telefonnummer
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="pl-10 bg-input border-border"
                  placeholder="12 34 56 78"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="birthDate" className="text-sm font-medium">
                Fødselsdato
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  className="pl-10 bg-input border-border"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Ny adgangskode *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 bg-input border-border"
                  placeholder="Mindst 6 tegn"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Bekræft adgangskode *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="pl-10 bg-input border-border"
                  placeholder="Gentag adgangskode"
                  required
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Adresse oplysninger</h3>
              <div>
                <Label htmlFor="address" className="text-sm font-medium">
                  Adresse *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="pl-10 bg-input border-border"
                    placeholder="Din adresse"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    Postnummer *
                  </Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    className="bg-input border-border"
                    placeholder="1234"
                    maxLength={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    By *
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="bg-input border-border"
                    placeholder="København"
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full akita-gradient hover:akita-glow akita-transition"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Fuldfør opsætning
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};