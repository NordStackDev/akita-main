import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Phone, Calendar, MapPin, CreditCard, Camera, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsPageProps {
  user: any;
  onLogout: () => void;
}

export const SettingsPage = ({ user, onLogout }: SettingsPageProps) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    address: '',
    postalCode: '',
    city: ''
  });

  const [bankData, setBankData] = useState({
    bankAccount: '',
    bankRegNumber: ''
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      const { data: userInfo, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const { data: profileInfo, error: profileError } = await supabase
        .from('profiles')
        .select('profile_image_url')
        .eq('user_id', user.id)
        .single();

      if (userInfo) {
        setUserData(userInfo);
        setProfileData({
          firstName: userInfo.first_name || '',
          lastName: userInfo.last_name || '',
          phone: userInfo.phone || '',
          birthDate: userInfo.birth_date || '',
          address: '', // Not stored in users table
          postalCode: '', // Not stored in users table
          city: '' // Not stored in users table
        });
        setBankData({
          bankAccount: userInfo.bank_account_number || '',
          bankRegNumber: userInfo.bank_reg_number || ''
        });
      }

      if (profileInfo?.profile_image_url) {
        setProfileImagePreview(profileInfo.profile_image_url);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fejl ved indlæsning",
        description: "Kunne ikke indlæse brugerdata",
      });
    }
  };

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let profileImageUrl = profileImagePreview;

      // Upload new profile image if provided
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profileImage);

        if (uploadError) {
          throw uploadError;
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
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          name: `${profileData.firstName} ${profileData.lastName}`,
          phone: profileData.phone,
          birth_date: profileData.birthDate
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update profile with image if uploaded
      if (profileImageUrl !== profileImagePreview) {
        await supabase
          .from('profiles')
          .update({ profile_image_url: profileImageUrl })
          .eq('user_id', user.id);
      }

      toast({
        title: "Profil opdateret",
        description: "Dine oplysninger er blevet opdateret",
      });

      setProfileImage(null);
      await loadUserData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fejl ved opdatering",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          bank_account_number: bankData.bankAccount,
          bank_reg_number: bankData.bankRegNumber
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Bankoplysninger opdateret",
        description: "Dine bankoplysninger er blevet opdateret",
      });

      await loadUserData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fejl ved opdatering",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <p className="text-muted-foreground">Indlæser indstillinger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Indstillinger</h1>
          <p className="text-muted-foreground">Administrer din profil og indstillinger</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="bank">Bankoplysninger</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="akita-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profil oplysninger
                </CardTitle>
                <CardDescription>
                  Opdater dine personlige oplysninger og profilbillede
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Profile Picture Upload */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profileImagePreview || undefined} />
                        <AvatarFallback className="text-2xl">
                          {profileData.firstName ? profileData.firstName[0] : <User />}
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
                      Klik på kameraet for at uploade nyt profilbillede
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
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
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
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
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
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
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
                        value={profileData.birthDate}
                        onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full akita-gradient hover:akita-glow akita-transition"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Gem profil
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card className="akita-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bankoplysninger
                </CardTitle>
                <CardDescription>
                  Opdater dine bankoplysninger til udbetaling af løn og provision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBankUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankRegNumber" className="text-sm font-medium">
                        Reg. nummer
                      </Label>
                      <Input
                        id="bankRegNumber"
                        type="text"
                        value={bankData.bankRegNumber}
                        onChange={(e) => setBankData({...bankData, bankRegNumber: e.target.value})}
                        className="bg-input border-border"
                        placeholder="1234"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankAccount" className="text-sm font-medium">
                        Kontonummer
                      </Label>
                      <Input
                        id="bankAccount"
                        type="text"
                        value={bankData.bankAccount}
                        onChange={(e) => setBankData({...bankData, bankAccount: e.target.value})}
                        className="bg-input border-border"
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Disse oplysninger bruges kun til udbetaling af løn og provision
                  </p>

                  <Button 
                    type="submit" 
                    className="w-full akita-gradient hover:akita-glow akita-transition"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Gem bankoplysninger
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};